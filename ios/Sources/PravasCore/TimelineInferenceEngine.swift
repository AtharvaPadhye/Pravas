import Foundation

public struct TimelineInferenceEngine: Sendable {
    public static let integrations: [Integration] = [
        Integration(
            id: "apple_photos",
            label: "Apple Photos",
            signal: "geo-tagged media clusters",
            permission: "read-only album/location metadata"
        ),
        Integration(
            id: "google_maps",
            label: "Google Maps",
            signal: "visited places and dwell time",
            permission: "location history export or app webhook"
        ),
        Integration(
            id: "gmail_reservations",
            label: "Gmail / Reservations",
            signal: "hotel and restaurant confirmations",
            permission: "reservation emails only"
        ),
        Integration(
            id: "credit_card",
            label: "Credit Card",
            signal: "merchant, timestamp, and amount",
            permission: "travel merchant transactions"
        )
    ]

    public static let demoSignals: [TravelSignal] = [
        TravelSignal(
            source: "apple_photos",
            capturedAt: "2026-05-02T09:08:00+01:00",
            place: "Alfama",
            venue: "Memmo Alfama",
            category: .hotel,
            detail: "Apple Photos detected: Alfama",
            confidence: 0.78
        ),
        TravelSignal(
            source: "gmail_reservations",
            capturedAt: "2026-05-02T08:55:00+01:00",
            place: "Alfama",
            venue: "Memmo Alfama",
            category: .hotel,
            detail: "Gmail found: Memmo Alfama booking",
            confirmation: "MAL-4921",
            confidence: 0.96
        ),
        TravelSignal(
            source: "google_maps",
            capturedAt: "2026-05-02T09:18:00+01:00",
            place: "Alfama",
            venue: "Memmo Alfama",
            category: .hotel,
            detail: "Maps dwell: overnight stay started at 9:18 AM",
            dwellMinutes: 620,
            confidence: 0.92
        ),
        TravelSignal(
            source: "google_maps",
            capturedAt: "2026-05-02T13:04:00+01:00",
            place: "Cais do Sodré",
            venue: "Time Out Market",
            category: .restaurant,
            detail: "Maps visited: Time Out Market",
            dwellMinutes: 68,
            confidence: 0.9
        ),
        TravelSignal(
            source: "credit_card",
            capturedAt: "2026-05-02T13:22:00+01:00",
            place: "Cais do Sodré",
            venue: "Time Out Market",
            category: .restaurant,
            detail: "Card charge: €42.10 restaurant",
            amount: "€42.10",
            confidence: 0.88
        )
    ]

    private let now: @Sendable () -> Date

    public init(now: @escaping @Sendable () -> Date = Date.init) {
        self.now = now
    }

    public func inferTimeline(from signals: [TravelSignal] = Self.demoSignals) -> TimelineResponse {
        var groupedEvents: [String: EventAccumulator] = [:]

        for signal in signals {
            let key = "\(Self.dayKey(from: signal.capturedAt)):\(Self.normalizedVenueKey(for: signal))"
            var current = groupedEvents[key] ?? EventAccumulator(signal: signal)

            if signal.capturedAt < current.firstSeenAt {
                current.firstSeenAt = signal.capturedAt
            }

            if current.category == .activity {
                current.category = signal.category
            }

            current.evidence.append(signal)
            groupedEvents[key] = current
        }

        let events = groupedEvents.values
            .map { accumulator in
                let evidence = accumulator.evidence.sorted { $0.capturedAt < $1.capturedAt }
                return TimelineEvent(
                    day: accumulator.day,
                    venue: accumulator.venue,
                    place: accumulator.place,
                    category: accumulator.category,
                    firstSeenAt: accumulator.firstSeenAt,
                    evidence: evidence,
                    title: Self.eventTitle(category: accumulator.category, venue: accumulator.venue),
                    confidence: Self.summarizeConfidence(evidence),
                    reason: Self.inferenceReason(category: accumulator.category, evidence: evidence)
                )
            }
            .sorted { $0.firstSeenAt < $1.firstSeenAt }

        let groupedByDay = Dictionary(grouping: events, by: \.day)
        let timeline = groupedByDay.keys.sorted().enumerated().map { index, day in
            TimelineDay(
                day: day,
                label: "AI generated: Day \(index + 1) timeline",
                events: groupedByDay[day] ?? []
            )
        }

        return TimelineResponse(
            principle: "No manual logging — Pravas captures passive travel signals and asks only for review.",
            generatedBy: "Pravas iOS Timeline Backend",
            generatedAt: ISO8601DateFormatter().string(from: now()),
            integrations: Self.integrations,
            events: events,
            timeline: timeline
        )
    }

    private struct EventAccumulator {
        let day: String
        let venue: String
        let place: String
        var category: TimelineCategory
        var firstSeenAt: String
        var evidence: [TravelSignal]

        init(signal: TravelSignal) {
            day = TimelineInferenceEngine.dayKey(from: signal.capturedAt)
            venue = signal.venue ?? signal.place ?? "Unknown place"
            place = signal.place ?? signal.venue ?? "Unknown place"
            category = signal.category
            firstSeenAt = signal.capturedAt
            evidence = []
        }
    }

    private static let sourceWeights: [String: Double] = [
        "gmail_reservations": 0.34,
        "google_maps": 0.28,
        "credit_card": 0.22,
        "apple_photos": 0.16
    ]

    private static func dayKey(from capturedAt: String) -> String {
        String(capturedAt.prefix(10))
    }

    private static func normalizedVenueKey(for signal: TravelSignal) -> String {
        let name = (signal.venue ?? signal.place ?? "unknown").lowercased()
        let scalars = name.unicodeScalars.map { scalar in
            CharacterSet.alphanumerics.contains(scalar) ? Character(scalar) : "-"
        }
        return String(scalars)
            .split(separator: "-")
            .joined(separator: "-")
    }

    private static func eventTitle(category: TimelineCategory, venue: String) -> String {
        switch category {
        case .hotel: "Stayed at \(venue)"
        case .restaurant: "Ate at \(venue)"
        case .activity: "Visited \(venue)"
        }
    }

    private static func inferenceReason(category: TimelineCategory, evidence: [TravelSignal]) -> String {
        let sources = Set(evidence.map(\.source))
        let hasDwell = evidence.contains { ($0.dwellMinutes ?? 0) >= 45 }
        let hasReservation = sources.contains("gmail_reservations")
        let hasCharge = sources.contains("credit_card")

        if category == .hotel && hasReservation && hasDwell {
            return "Reservation plus overnight dwell time indicates the traveler stayed here."
        }

        if category == .restaurant && hasCharge && hasDwell {
            return "Map dwell time plus a same-place card charge indicates a restaurant visit."
        }

        return "Multiple passive travel signals point to the same place and time window."
    }

    private static func summarizeConfidence(_ signals: [TravelSignal]) -> Double {
        let sourceScore = signals.reduce(0.0) { total, signal in
            total + (sourceWeights[signal.source] ?? 0.1)
        }
        let averageSignalConfidence = signals.reduce(0.0) { $0 + $1.confidence } / Double(max(signals.count, 1))
        let rawScore = min(0.99, sourceScore + averageSignalConfidence * 0.34)
        return (rawScore * 100).rounded() / 100
    }
}

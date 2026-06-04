import Foundation

public struct TripPlanner: Sendable {
    private let backend: TimelineBackend
    private let now: @Sendable () -> Date

    public init(backend: TimelineBackend = LocalTimelineBackend(), now: @escaping @Sendable () -> Date = Date.init) {
        self.backend = backend
        self.now = now
    }

    public func buildDashboard(for draft: TripDraft, reviewItems: [SignalReviewItem]) async throws -> TripDashboard {
        let approvedSignals = reviewItems
            .filter { $0.status != .rejected }
            .map(\.signal)
        let timeline = approvedSignals.isEmpty
            ? try await backend.loadDemoTimeline()
            : try await backend.submitSignals(approvedSignals)

        return TripDashboard(
            draft: draft,
            timeline: timeline,
            reviewedSignals: reviewItems,
            shareURL: draft.visibility == .shareable ? shareURL(for: draft) : nil,
            lastUpdatedAt: now()
        )
    }

    public func publishRecap(from dashboard: TripDashboard) -> PublishedRecap {
        let highlights = dashboard.timeline.events.map(\.title)
        let summary = "\(dashboard.draft.destination) · \(dashboard.timeline.events.count) AI-reviewed moments across \(dashboard.timeline.timeline.count) day(s)."
        return PublishedRecap(
            title: "\(dashboard.draft.name) recap",
            summary: summary,
            shareURL: dashboard.shareURL ?? shareURL(for: dashboard.draft),
            highlights: highlights
        )
    }

    private func shareURL(for draft: TripDraft) -> URL {
        let slug = draft.name
            .lowercased()
            .unicodeScalars
            .map { CharacterSet.alphanumerics.contains($0) ? Character($0) : "-" }
            .reduce(into: "") { partialResult, character in
                if character == "-", partialResult.last == "-" { return }
                partialResult.append(character)
            }
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
        return URL(string: "https://pravas.app/trips/\(slug.isEmpty ? draft.id.uuidString.lowercased() : slug)")!
    }
}

import Foundation
import Testing
@testable import PravasCore

@Suite("Timeline inference")
struct TimelineInferenceEngineTests {
    @Test("demo signals create hotel and restaurant events")
    func demoSignalsCreateExpectedEvents() {
        let engine = TimelineInferenceEngine(now: { Date(timeIntervalSince1970: 0) })
        let response = engine.inferTimeline()

        #expect(response.generatedBy == "Pravas iOS Timeline Backend")
        #expect(response.integrations.count == 4)
        #expect(response.events.count == 2)
        #expect(response.timeline.count == 1)
        #expect(response.events.map(\.title) == ["Stayed at Memmo Alfama", "Ate at Time Out Market"])
    }

    @Test("hotel confidence and reasoning combine reservation with dwell time")
    func hotelReasoningUsesReservationAndDwell() {
        let event = TimelineInferenceEngine().inferTimeline().events.first { $0.category == .hotel }

        #expect(event?.confidence == 0.99)
        #expect(event?.reason == "Reservation plus overnight dwell time indicates the traveler stayed here.")
        #expect(event?.evidence.map(\.source) == ["gmail_reservations", "apple_photos", "google_maps"])
    }

    @Test("custom activity signals fall back to visit language")
    func customActivitySignalsAreGrouped() {
        let signals = [
            TravelSignal(
                source: "apple_photos",
                capturedAt: "2026-06-01T10:00:00+00:00",
                place: "Brooklyn",
                venue: "Brooklyn Bridge Park",
                category: .activity,
                detail: "Photo cluster at the waterfront",
                confidence: 0.72
            ),
            TravelSignal(
                source: "google_maps",
                capturedAt: "2026-06-01T10:30:00+00:00",
                place: "Brooklyn",
                venue: "Brooklyn Bridge Park",
                category: .activity,
                detail: "Maps dwell at the park",
                dwellMinutes: 55,
                confidence: 0.84
            )
        ]

        let response = TimelineInferenceEngine().inferTimeline(from: signals)

        #expect(response.events.count == 1)
        #expect(response.events[0].title == "Visited Brooklyn Bridge Park")
        #expect(response.events[0].evidence.count == 2)
    }
}

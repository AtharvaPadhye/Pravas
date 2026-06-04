import Foundation
import Testing
@testable import PravasCore

@Suite("Trip planner")
struct TripPlannerTests {
    @Test("dashboard uses approved and pending signals while excluding rejected signals")
    func dashboardExcludesRejectedSignals() async throws {
        let draft = TripDraft(
            name: "Lisbon Weekend",
            destination: "Lisbon",
            startsAt: Date(timeIntervalSince1970: 0),
            endsAt: Date(timeIntervalSince1970: 86_400),
            invitedFriends: ["Maya"],
            visibility: .shareable
        )
        let rejected = SignalReviewItem(
            signal: TravelSignal(
                source: "google_maps",
                capturedAt: "2026-05-02T15:00:00+01:00",
                place: "Belém",
                venue: "Jerónimos Monastery",
                category: .activity,
                detail: "Maps detected a short stop",
                confidence: 0.7
            ),
            status: .rejected
        )
        let approved = SignalReviewItem(signal: TimelineInferenceEngine.demoSignals[0], status: .approved)
        let pending = SignalReviewItem(signal: TimelineInferenceEngine.demoSignals[1], status: .pending)
        let planner = TripPlanner(now: { Date(timeIntervalSince1970: 42) })

        let dashboard = try await planner.buildDashboard(for: draft, reviewItems: [approved, pending, rejected])

        #expect(dashboard.timeline.events.count == 1)
        #expect(dashboard.timeline.events[0].venue == "Memmo Alfama")
        #expect(dashboard.timeline.events[0].evidence.count == 2)
        #expect(dashboard.timeline.events[0].evidence.contains { $0.venue == "Jerónimos Monastery" } == false)
        #expect(dashboard.shareURL?.absoluteString == "https://pravas.app/trips/lisbon-weekend")
        #expect(dashboard.lastUpdatedAt == Date(timeIntervalSince1970: 42))
    }

    @Test("published recap summarizes generated highlights")
    func publishedRecapUsesDashboardEvents() async throws {
        let draft = TripDraft(
            name: "Food Crawl",
            destination: "Porto",
            startsAt: Date(timeIntervalSince1970: 0),
            endsAt: Date(timeIntervalSince1970: 86_400),
            invitedFriends: [],
            visibility: .privateTrip
        )
        let planner = TripPlanner(now: { Date(timeIntervalSince1970: 42) })
        let dashboard = try await planner.buildDashboard(
            for: draft,
            reviewItems: TimelineInferenceEngine.demoSignals.map { SignalReviewItem(signal: $0, status: .approved) }
        )

        let recap = planner.publishRecap(from: dashboard)

        #expect(recap.title == "Food Crawl recap")
        #expect(recap.summary == "Porto · 2 AI-reviewed moments across 1 day(s).")
        #expect(recap.shareURL.absoluteString == "https://pravas.app/trips/food-crawl")
        #expect(recap.highlights == ["Stayed at Memmo Alfama", "Ate at Time Out Market"])
    }
}

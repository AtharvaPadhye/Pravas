import Foundation
import Testing
@testable import PravasCore

@Suite("Trip store")
struct TripStoreTests {
    @Test("trip drafts and dashboards round trip through disk")
    func tripDraftsAndDashboardsRoundTripThroughDisk() async throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("PravasCoreTests-\(UUID().uuidString)", isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }

        let store = TripStore(storageURL: directory.appendingPathComponent("trip.json"))
        let draft = TripDraft(
            name: "PNW Loop",
            destination: "Seattle",
            startsAt: Date(timeIntervalSince1970: 1_000),
            endsAt: Date(timeIntervalSince1970: 2_000),
            invitedFriends: ["Leo"],
            visibility: .privateTrip
        )
        let planner = TripPlanner(now: { Date(timeIntervalSince1970: 3_000) })
        let dashboard = try await planner.buildDashboard(
            for: draft,
            reviewItems: TimelineInferenceEngine.demoSignals.map { SignalReviewItem(signal: $0, status: .approved) }
        )

        try await store.save(draft)
        try await store.saveDashboard(dashboard)

        #expect(try await store.load() == draft)
        #expect(try await store.loadDashboard() == dashboard)

        try await store.reset()
        #expect(try await store.load() == nil)
        #expect(try await store.loadDashboard() == nil)
    }
}

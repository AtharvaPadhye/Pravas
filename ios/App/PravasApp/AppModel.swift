import Foundation
import PravasCore

@MainActor
final class AppModel: ObservableObject {
    @Published var draft = TripDraft(
        name: "Pacific Northwest loop",
        destination: "Seattle, Olympic, Portland",
        startsAt: Calendar.current.date(from: DateComponents(year: 2026, month: 8, day: 14)) ?? .now,
        endsAt: Calendar.current.date(from: DateComponents(year: 2026, month: 8, day: 21)) ?? .now,
        invitedFriends: ["Maya", "Leo", "Nora"],
        visibility: .privateTrip
    )
    @Published var timeline: TimelineResponse?
    @Published var integrations: [Integration] = []
    @Published var isLoading = false
    @Published var statusMessage = "Ready to auto-capture Lisbon Day 1."

    private let backend: TimelineBackend

    init(backend: TimelineBackend) {
        self.backend = backend
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let integrations = backend.loadIntegrations()
            async let timeline = backend.loadDemoTimeline()
            self.integrations = try await integrations
            self.timeline = try await timeline
            statusMessage = "Timeline generated from passive signals."
        } catch {
            statusMessage = "Could not load timeline: \(error.localizedDescription)"
        }
    }

    func createTrip() {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        statusMessage = "Created \(draft.name) · \(formatter.string(from: draft.startsAt)) to \(formatter.string(from: draft.endsAt)) · \(draft.visibility.displayName)."
    }

    func addFriend(named name: String) {
        let cleaned = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty, !draft.invitedFriends.contains(cleaned) else { return }
        draft.invitedFriends.append(cleaned)
    }
}

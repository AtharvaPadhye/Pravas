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
    @Published var signalInbox: [SignalReviewItem] = TimelineInferenceEngine.demoSignals.map { SignalReviewItem(signal: $0) }
    @Published var dashboard: TripDashboard?
    @Published var recap: PublishedRecap?
    @Published var isLoading = false
    @Published var statusMessage = "Ready to auto-capture Lisbon Day 1."

    private let backend: TimelineBackend
    private let planner: TripPlanner
    private let store: TripStore

    init(
        backend: TimelineBackend,
        store: TripStore = TripStore(
            storageURL: FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("Pravas/trip-draft.json")
        )
    ) {
        self.backend = backend
        self.planner = TripPlanner(backend: backend)
        self.store = store
    }

    var pendingSignalCount: Int {
        signalInbox.filter { $0.status == .pending }.count
    }

    var approvedSignalCount: Int {
        signalInbox.filter { $0.status == .approved }.count
    }

    var shareURLText: String {
        dashboard?.shareURL?.absoluteString ?? recap?.shareURL.absoluteString ?? "Private until published"
    }

    func bootstrap() async {
        do {
            if let storedDashboard = try await store.loadDashboard() {
                dashboard = storedDashboard
                draft = storedDashboard.draft
                timeline = storedDashboard.timeline
                signalInbox = storedDashboard.reviewedSignals
                statusMessage = "Restored your latest Pravas trip dashboard."
            } else if let storedDraft = try await store.load() {
                draft = storedDraft
                statusMessage = "Restored your saved trip draft."
            }
        } catch {
            statusMessage = "Could not restore saved trip: \(error.localizedDescription)"
        }

        await refresh()
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let integrations = backend.loadIntegrations()
            async let timeline = planner.buildDashboard(for: draft, reviewItems: signalInbox)
            self.integrations = try await integrations
            let dashboard = try await timeline
            self.dashboard = dashboard
            self.timeline = dashboard.timeline
            try await store.saveDashboard(dashboard)
            statusMessage = "Timeline generated from \(approvedOrAvailableSignalCount) passive signals."
        } catch {
            statusMessage = "Could not load timeline: \(error.localizedDescription)"
        }
    }

    func createTrip() async {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium

        do {
            try await store.save(draft)
            await refresh()
            statusMessage = "Created \(draft.name) · \(formatter.string(from: draft.startsAt)) to \(formatter.string(from: draft.endsAt)) · \(draft.visibility.displayName)."
        } catch {
            statusMessage = "Could not save trip: \(error.localizedDescription)"
        }
    }

    func addFriend(named name: String) {
        let cleaned = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty, !draft.invitedFriends.contains(cleaned) else { return }
        draft.invitedFriends.append(cleaned)
    }

    func updateSignal(_ item: SignalReviewItem, status: SignalReviewStatus) async {
        guard let index = signalInbox.firstIndex(where: { $0.id == item.id }) else { return }
        signalInbox[index].status = status
        signalInbox[index].note = switch status {
        case .pending: "Waiting for traveler review"
        case .approved: "Approved by traveler"
        case .rejected: "Hidden from recap"
        }
        await refresh()
    }

    func addManualMoment(venue: String, place: String, category: TimelineCategory, detail: String) async {
        let cleanedVenue = venue.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanedPlace = place.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedVenue.isEmpty else { return }

        let signal = TravelSignal(
            source: "traveler_manual",
            capturedAt: ISO8601DateFormatter().string(from: Date()),
            place: cleanedPlace.isEmpty ? draft.destination : cleanedPlace,
            venue: cleanedVenue,
            category: category,
            detail: detail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Added manually in Pravas iOS" : detail,
            confidence: 0.95
        )
        signalInbox.append(SignalReviewItem(signal: signal, status: .approved, note: "Added by traveler"))
        await refresh()
    }

    func publishRecap() async {
        guard let dashboard else {
            await refresh()
            return
        }

        let published = planner.publishRecap(from: dashboard)
        recap = published
        statusMessage = "Published recap: \(published.shareURL.absoluteString)"
    }

    private var approvedOrAvailableSignalCount: Int {
        let approved = signalInbox.filter { $0.status == .approved }.count
        return approved == 0 ? signalInbox.count : approved
    }
}

import SwiftUI
import PravasCore

struct SignalInboxView: View {
    @EnvironmentObject private var model: AppModel
    @State private var venue = ""
    @State private var place = ""
    @State private var detail = ""
    @State private var category: TimelineCategory = .activity

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HeroCard(
                        eyebrow: "Review queue",
                        title: "Approve moments before they become the trip story.",
                        body: "Pravas starts with passive signals, then lets travelers confirm, hide, or add context so the final dashboard stays trustworthy."
                    )
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }

                Section("Pending and reviewed signals") {
                    ForEach(model.signalInbox) { item in
                        SignalReviewRow(item: item) { status in
                            Task { await model.updateSignal(item, status: status) }
                        }
                    }
                }

                Section("Add a missing moment") {
                    TextField("Venue", text: $venue)
                    TextField("Place or neighborhood", text: $place)
                    Picker("Category", selection: $category) {
                        ForEach(TimelineCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category)
                        }
                    }
                    TextField("What should the recap say?", text: $detail, axis: .vertical)
                        .lineLimit(2...4)
                    Button {
                        Task {
                            await model.addManualMoment(
                                venue: venue,
                                place: place,
                                category: category,
                                detail: detail
                            )
                            venue = ""
                            place = ""
                            detail = ""
                            category = .activity
                        }
                    } label: {
                        Label("Save moment", systemImage: "plus.circle.fill")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Signal Inbox")
        }
    }
}

private struct SignalReviewRow: View {
    let item: SignalReviewItem
    let onStatusChange: (SignalReviewStatus) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                Image(systemName: iconName)
                    .foregroundStyle(statusColor)
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.signal.venue ?? item.signal.place ?? "Unknown place")
                        .font(.headline)
                    Text(item.signal.detail)
                        .font(.subheadline)
                    Text("\(item.signal.source.replacingOccurrences(of: "_", with: " ").capitalized) · \(item.status.displayName)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(Int(item.signal.confidence * 100))%")
                    .font(.caption.bold())
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.12), in: Capsule())
            }

            if let note = item.note {
                Text(note)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack {
                Button("Approve") { onStatusChange(.approved) }
                    .buttonStyle(.borderedProminent)
                    .disabled(item.status == .approved)
                Button("Hide") { onStatusChange(.rejected) }
                    .buttonStyle(.bordered)
                    .disabled(item.status == .rejected)
                Button("Pending") { onStatusChange(.pending) }
                    .buttonStyle(.bordered)
                    .disabled(item.status == .pending)
            }
            .controlSize(.small)
        }
        .padding(.vertical, 6)
    }

    private var iconName: String {
        switch item.signal.category {
        case .hotel: "bed.double.fill"
        case .restaurant: "fork.knife"
        case .activity: "figure.walk"
        }
    }

    private var statusColor: Color {
        switch item.status {
        case .pending: .orange
        case .approved: .green
        case .rejected: .secondary
        }
    }
}

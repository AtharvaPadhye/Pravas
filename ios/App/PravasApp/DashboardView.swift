import SwiftUI
import PravasCore

struct DashboardView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HeroCard(
                        eyebrow: "Product proof",
                        title: "Lisbon Day 1",
                        body: model.timeline?.principle ?? "AI assembles hotel stays, restaurants, and memories from consented passive signals."
                    )

                    if model.isLoading {
                        ProgressView("Generating timeline…")
                            .frame(maxWidth: .infinity)
                    }

                    ForEach(model.timeline?.timeline ?? []) { day in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(day.label)
                                .font(.title3.bold())
                            ForEach(day.events) { event in
                                TimelineEventCard(event: event)
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Timeline")
            .toolbar {
                Button("Refresh") {
                    Task { await model.refresh() }
                }
            }
            .task {
                guard model.timeline == nil else { return }
                await model.refresh()
            }
        }
    }
}

private struct TimelineEventCard: View {
    let event: TimelineEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: iconName)
                    .foregroundStyle(.orange)
                Text(event.title)
                    .font(.headline)
                Spacer()
                Text("\(Int(event.confidence * 100))%")
                    .font(.caption.bold())
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.green.opacity(0.12), in: Capsule())
            }
            Text(event.reason)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Divider()
            ForEach(event.evidence) { signal in
                VStack(alignment: .leading, spacing: 2) {
                    Text(signal.detail)
                        .font(.caption.weight(.semibold))
                    Text(signal.source.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .background(.background, in: RoundedRectangle(cornerRadius: 22))
    }

    private var iconName: String {
        switch event.category {
        case .hotel: "bed.double.fill"
        case .restaurant: "fork.knife"
        case .activity: "figure.walk"
        }
    }
}

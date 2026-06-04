import SwiftUI
import PravasCore

struct RecapView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HeroCard(
                        eyebrow: "Shareable recap",
                        title: model.recap?.title ?? "Turn approved moments into a polished story.",
                        body: model.recap?.summary ?? "Publish a private or shareable link with highlights, day-by-day events, and the approved evidence behind each memory."
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Share link")
                            .font(.headline)
                        Text(model.shareURLText)
                            .font(.subheadline.monospaced())
                            .textSelection(.enabled)
                            .foregroundStyle(.secondary)
                        Button {
                            Task { await model.publishRecap() }
                        } label: {
                            Label("Publish recap", systemImage: "paperplane.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                    }
                    .padding(20)
                    .background(.background, in: RoundedRectangle(cornerRadius: 24))

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Highlights")
                            .font(.title2.bold())
                        ForEach(model.recap?.highlights ?? model.timeline?.events.map(\.title) ?? [], id: \.self) { highlight in
                            Label(highlight, systemImage: "checkmark.seal.fill")
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(.green.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Trip stats")
                            .font(.headline)
                        HStack {
                            StatPill(value: "\(model.approvedSignalCount)", label: "approved")
                            StatPill(value: "\(model.pendingSignalCount)", label: "pending")
                            StatPill(value: "\(model.timeline?.events.count ?? 0)", label: "moments")
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Recap")
        }
    }
}

private struct StatPill: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
            Text(label.uppercased())
                .font(.caption2.bold())
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 18))
    }
}

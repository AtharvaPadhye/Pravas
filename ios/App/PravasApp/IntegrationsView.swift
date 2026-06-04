import SwiftUI
import PravasCore

struct IntegrationsView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section("Consented signal sources") {
                    ForEach(model.integrations) { integration in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(integration.label)
                                .font(.headline)
                            Text(integration.signal)
                                .font(.subheadline)
                            Text("Permission: \(integration.permission)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 6)
                    }
                }

                Section("Backend mode") {
                    Label("Local iOS inference engine is active", systemImage: "checkmark.seal.fill")
                        .foregroundStyle(.green)
                    Text("The same grouping, confidence, and reasoning rules as the Node proof backend can run on-device, while RemoteTimelineBackend can call the hosted API when available.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Signals")
            .task {
                guard model.integrations.isEmpty else { return }
                await model.refresh()
            }
        }
    }
}

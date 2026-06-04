import SwiftUI

struct RootView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        TabView {
            StartTripView()
                .tabItem { Label("Start", systemImage: "sparkles") }
            SignalInboxView()
                .tabItem { Label("Inbox", systemImage: "tray.full") }
                .badge(model.pendingSignalCount)
            DashboardView()
                .tabItem { Label("Timeline", systemImage: "map") }
            RecapView()
                .tabItem { Label("Recap", systemImage: "square.and.arrow.up") }
            IntegrationsView()
                .tabItem { Label("Signals", systemImage: "sensor.tag.radiowaves.forward") }
        }
        .tint(.orange)
        .task { await model.bootstrap() }
    }
}

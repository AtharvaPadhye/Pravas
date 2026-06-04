import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            StartTripView()
                .tabItem { Label("Start", systemImage: "sparkles") }
            DashboardView()
                .tabItem { Label("Timeline", systemImage: "map") }
            IntegrationsView()
                .tabItem { Label("Signals", systemImage: "sensor.tag.radiowaves.forward") }
        }
        .tint(.orange)
    }
}

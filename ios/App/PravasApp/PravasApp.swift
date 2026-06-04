import SwiftUI
import PravasCore

@main
struct PravasApp: App {
    @StateObject private var model = AppModel(backend: LocalTimelineBackend())

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
        }
    }
}

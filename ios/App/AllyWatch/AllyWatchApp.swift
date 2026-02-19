import SwiftUI

@main
struct AllyWatchApp: App {
    @WKApplicationDelegateAdaptor(AllyWatchAppDelegate.self) var delegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(WatchSessionManager.shared)
        }
    }
}

class AllyWatchAppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        WatchSessionManager.shared.activate()
    }
}

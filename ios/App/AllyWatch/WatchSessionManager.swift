import Foundation
import WatchConnectivity
import WidgetKit

class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchSessionManager()

    @Published var widgetData: WidgetData?

    private override init() {
        super.init()
        // Load cached data on init
        widgetData = WidgetData.loadLocal()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// Request fresh data from the phone (on-demand pull)
    func requestDataFromPhone() {
        let session = WCSession.default
        guard session.activationState == .activated, session.isReachable else { return }

        session.sendMessage(["request": "requestData"], replyHandler: { response in
            if let jsonString = response["widgetData"] as? String {
                self.handleReceivedData(jsonString)
            }
        }, errorHandler: { error in
            print("[WatchSessionManager] Request failed: \(error)")
        })
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            // Request fresh data on activation
            requestDataFromPhone()
        }
    }

    /// Receive application context updates (primary data transfer)
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        if let jsonString = applicationContext["widgetData"] as? String {
            handleReceivedData(jsonString)
        }
    }

    // MARK: - Private

    private func handleReceivedData(_ jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(WidgetData.self, from: data) else {
            return
        }

        DispatchQueue.main.async {
            self.widgetData = decoded
        }

        // Cache locally for offline access and complications
        decoded.saveLocal()

        // Reload complication timelines
        WidgetCenter.shared.reloadAllTimelines()
    }
}

import Foundation
import WatchConnectivity

class PhoneSessionManager: NSObject, WCSessionDelegate {
    static let shared = PhoneSessionManager()

    private override init() {
        super.init()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// Send the latest widget data to the paired Apple Watch
    func sendDataToWatch() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isPaired else { return }

        guard let defaults = UserDefaults(suiteName: WidgetData.suiteName),
              let jsonData = defaults.data(forKey: WidgetData.userDefaultsKey),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return
        }

        do {
            try session.updateApplicationContext(["widgetData": jsonString])
        } catch {
            print("[PhoneSessionManager] Failed to send application context: \(error)")
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("[PhoneSessionManager] Activation failed: \(error)")
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        // Re-activate for switching paired watches
        WCSession.default.activate()
    }

    /// Handle on-demand pull requests from the watch
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        if message["request"] as? String == "requestData" {
            if let defaults = UserDefaults(suiteName: WidgetData.suiteName),
               let jsonData = defaults.data(forKey: WidgetData.userDefaultsKey),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                replyHandler(["widgetData": jsonString])
            } else {
                replyHandler(["error": "No data available"])
            }
        }
    }
}

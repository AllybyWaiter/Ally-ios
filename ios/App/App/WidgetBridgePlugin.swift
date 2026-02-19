import Foundation
import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise)
    ]

    @objc public func updateWidgetData(_ call: CAPPluginCall) {
        guard let jsonString = call.getString("data") else {
            call.reject("Missing 'data' parameter")
            return
        }

        guard let defaults = UserDefaults(suiteName: "group.com.waiterai.ally") else {
            call.reject("Failed to access App Group UserDefaults")
            return
        }

        // Validate JSON is parseable before storing
        guard let jsonData = jsonString.data(using: .utf8),
              (try? JSONSerialization.jsonObject(with: jsonData)) != nil else {
            call.reject("Invalid JSON data")
            return
        }

        defaults.set(jsonData, forKey: "widgetData")

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        PhoneSessionManager.shared.sendDataToWatch()

        call.resolve()
    }
}

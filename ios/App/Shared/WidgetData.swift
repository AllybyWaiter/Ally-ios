import Foundation

struct WidgetData: Codable {
    let updatedAt: String
    let aquariums: [WidgetAquarium]

    static let suiteName = "group.com.waiterai.ally"
    static let userDefaultsKey = "widgetData"

    /// Load from App Group UserDefaults (iOS app + iOS widgets)
    static func load() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: suiteName),
              let data = defaults.data(forKey: userDefaultsKey) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetData.self, from: data)
    }

    var isStale: Bool {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: updatedAt) else {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: updatedAt) else { return true }
            return Date().timeIntervalSince(date) > 86400
        }
        return Date().timeIntervalSince(date) > 86400 // 24 hours
    }

    static let placeholder = WidgetData(
        updatedAt: ISO8601DateFormatter().string(from: Date()),
        aquariums: [
            WidgetAquarium(
                id: "preview",
                name: "My Aquarium",
                type: "aquarium",
                healthStatus: "good",
                daysSinceTest: 2,
                keyParameters: [
                    WidgetParameter(name: "pH", value: 7.2, unit: "", status: "good"),
                    WidgetParameter(name: "Ammonia", value: 0.0, unit: "ppm", status: "good"),
                    WidgetParameter(name: "Nitrite", value: 0.0, unit: "ppm", status: "good"),
                    WidgetParameter(name: "Nitrate", value: 15.0, unit: "ppm", status: "good"),
                ],
                nextTask: WidgetTask(name: "Water Change", dueDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(86400)), taskType: "water_change", isOverdue: false),
                livestockCount: 12
            )
        ]
    )

    #if os(watchOS)
    /// Load from local UserDefaults (watchOS app + watch complications share the same container)
    static func loadLocal() -> WidgetData? {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetData.self, from: data)
    }

    /// Save to local UserDefaults on watchOS
    func saveLocal() {
        if let data = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(data, forKey: WidgetData.userDefaultsKey)
        }
    }
    #endif
}

struct WidgetAquarium: Codable {
    let id: String
    let name: String
    let type: String
    let healthStatus: String
    let daysSinceTest: Int?
    let keyParameters: [WidgetParameter]
    let nextTask: WidgetTask?
    let livestockCount: Int
}

struct WidgetParameter: Codable {
    let name: String
    let value: Double
    let unit: String
    let status: String
}

struct WidgetTask: Codable {
    let name: String
    let dueDate: String
    let taskType: String
    let isOverdue: Bool
}

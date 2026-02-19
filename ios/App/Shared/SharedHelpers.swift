import SwiftUI

// MARK: - Color Helpers

func healthColor(_ status: String) -> Color {
    switch status {
    case "good": return .green
    case "warning": return .orange
    case "critical": return .red
    default: return .gray
    }
}

func statusColor(_ status: String) -> Color {
    switch status {
    case "good": return .green
    case "warning": return .orange
    case "critical": return .red
    default: return .gray
    }
}

func daysColor(_ days: Int) -> Color {
    if days < 3 { return .green }
    if days <= 7 { return .orange }
    return .red
}

// MARK: - Formatting Helpers

func formatValue(_ value: Double) -> String {
    if value == value.rounded() {
        return String(format: "%.0f", value)
    }
    let s = String(format: "%.2f", value)
    if s.hasSuffix("0") { return String(s.dropLast()) }
    return s
}

func relativeDateString(_ isoDate: String, isOverdue: Bool) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    var date = formatter.date(from: isoDate)
    if date == nil {
        formatter.formatOptions = [.withInternetDateTime]
        date = formatter.date(from: isoDate)
    }
    guard let taskDate = date else { return "" }

    let calendar = Calendar.current
    let now = Date()

    let computedOverdue = calendar.startOfDay(for: taskDate) < calendar.startOfDay(for: now)
    if isOverdue || computedOverdue {
        return "Overdue"
    }

    let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: calendar.startOfDay(for: taskDate)).day ?? 0

    switch days {
    case 0: return "Today"
    case 1: return "Tomorrow"
    case 2...7: return "In \(days) days"
    default: return taskDate.formatted(.dateTime.month(.abbreviated).day())
    }
}

// MARK: - Icon Helpers

func taskIcon(_ taskType: String) -> String {
    switch taskType {
    case "water_change": return "drop.fill"
    case "filter_maintenance": return "gearshape.fill"
    case "feeding": return "leaf.fill"
    case "water_test": return "eyedropper.halffull"
    case "cleaning": return "sparkles"
    default: return "checklist"
    }
}

func aquariumIcon(_ type: String) -> String {
    switch type {
    case "pool": return "figure.pool.swim"
    case "spa", "hot_tub": return "bathtub.fill"
    case "pond": return "leaf.fill"
    default: return "fish"
    }
}

// MARK: - Gauge Gradient

func gaugeGradient(_ days: Int) -> Gradient {
    if days < 3 {
        return Gradient(colors: [.green])
    } else if days <= 7 {
        return Gradient(colors: [.green, .orange])
    } else {
        return Gradient(colors: [.green, .orange, .red])
    }
}

// MARK: - Widget Background Modifier

extension View {
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(.fill.tertiary, for: .widget)
        } else {
            self.background(Color(.systemBackground))
        }
    }
}

import SwiftUI
import WidgetKit

struct LockScreenWidgetView: View {
    let entry: AllyWidgetEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        if #available(iOS 16.0, *) {
            switch family {
            case .accessoryRectangular:
                rectangularView
            case .accessoryCircular:
                circularView
            default:
                Text("Ally")
            }
        } else {
            Text("Ally")
        }
    }

    // MARK: - Rectangular Lock Screen Widget

    @available(iOS 16.0, *)
    private var rectangularView: some View {
        Group {
            if let aquarium = entry.firstAquarium, !entry.isStale {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: aquariumIcon(aquarium.type))
                            .font(.system(size: 11))
                        Text(aquarium.name)
                            .font(.system(size: 13, weight: .semibold))
                            .lineLimit(1)
                    }

                    if let task = aquarium.nextTask {
                        HStack(spacing: 4) {
                            Image(systemName: taskIcon(task.taskType))
                                .font(.system(size: 10))
                            Text("\(task.name) \(task.isOverdue ? "(Overdue)" : relativeDateString(task.dueDate, isOverdue: false))")
                                .font(.system(size: 11))
                                .lineLimit(1)
                        }
                        .foregroundColor(task.isOverdue ? .red : .secondary)
                    } else if let days = aquarium.daysSinceTest {
                        Text("Tested \(days) day\(days == 1 ? "" : "s") ago")
                            .font(.system(size: 11))
                            .foregroundColor(daysColor(days))
                    } else {
                        Text("No recent tests")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "fish")
                            .font(.system(size: 11))
                        Text("Ally")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    Text(entry.isStale ? "Open app to refresh" : "Open app to start")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Circular Lock Screen Widget

    @available(iOS 16.0, *)
    private var circularView: some View {
        Group {
            if let aquarium = entry.firstAquarium, !entry.isStale, let days = aquarium.daysSinceTest {
                Gauge(value: Double(min(days, 10)), in: 0...10) {
                    Image(systemName: "drop.fill")
                } currentValueLabel: {
                    Text("\(days)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .gaugeStyle(.accessoryCircular)
                .tint(gaugeGradient(days))
            } else {
                ZStack {
                    AccessoryWidgetBackground()
                    Image(systemName: "fish")
                        .font(.system(size: 18))
                }
            }
        }
    }
}

// Helpers moved to Shared/SharedHelpers.swift

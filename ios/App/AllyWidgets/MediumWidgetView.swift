import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let entry: AllyWidgetEntry

    var body: some View {
        if let aquarium = entry.firstAquarium, !entry.isStale {
            contentView(aquarium: aquarium)
        } else if entry.isStale {
            staleView
        } else {
            emptyView
        }
    }

    private func contentView(aquarium: WidgetAquarium) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Top row: name + health badge
            HStack {
                HStack(spacing: 6) {
                    Circle()
                        .fill(healthColor(aquarium.healthStatus))
                        .frame(width: 8, height: 8)
                    Text(aquarium.name)
                        .font(.system(size: 14, weight: .semibold))
                        .lineLimit(1)
                }

                Spacer()

                if let days = aquarium.daysSinceTest {
                    Text("Tested \(days)d ago")
                        .font(.system(size: 11))
                        .foregroundColor(daysColor(days))
                }
            }

            // Parameter pills (up to 4)
            HStack(spacing: 6) {
                ForEach(aquarium.keyParameters.prefix(4), id: \.name) { param in
                    parameterPill(param)
                }
                Spacer()
            }

            Spacer()

            // Bottom: next task
            if let task = aquarium.nextTask {
                HStack(spacing: 6) {
                    Image(systemName: taskIcon(task.taskType))
                        .font(.system(size: 11))
                        .foregroundColor(task.isOverdue ? .red : .blue)
                    Text(task.name)
                        .font(.system(size: 11, weight: .medium))
                        .lineLimit(1)
                    Spacer()
                    Text(relativeDateString(task.dueDate, isOverdue: task.isOverdue))
                        .font(.system(size: 11))
                        .foregroundColor(task.isOverdue ? .red : .secondary)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            } else {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 11))
                        .foregroundColor(.green)
                    Text("No upcoming tasks")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(12)
        .widgetBackground()
    }

    private func parameterPill(_ param: WidgetParameter) -> some View {
        VStack(spacing: 2) {
            Text(param.name)
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(.secondary)
            Text(formatValue(param.value) + (param.unit.isEmpty ? "" : " \(param.unit)"))
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(statusColor(param.status))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(statusColor(param.status).opacity(0.1))
        .cornerRadius(8)
    }

    private var emptyView: some View {
        HStack(spacing: 12) {
            Image(systemName: "fish")
                .font(.system(size: 32))
                .foregroundColor(.blue.opacity(0.6))
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome to Ally")
                    .font(.system(size: 14, weight: .semibold))
                Text("Open the app to add your first aquatic space")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding()
        .widgetBackground()
    }

    private var staleView: some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.clockwise")
                .font(.system(size: 28))
                .foregroundColor(.orange)
            VStack(alignment: .leading, spacing: 4) {
                Text("Data needs refresh")
                    .font(.system(size: 14, weight: .semibold))
                Text("Open Ally to update your widget")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding()
        .widgetBackground()
    }
}

// Helpers moved to Shared/SharedHelpers.swift

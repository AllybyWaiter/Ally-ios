import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
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
        VStack(alignment: .leading, spacing: 6) {
            // Header: name + health dot
            HStack(spacing: 6) {
                Circle()
                    .fill(healthColor(aquarium.healthStatus))
                    .frame(width: 8, height: 8)
                Text(aquarium.name)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)
            }

            Spacer()

            // Days since test
            if let days = aquarium.daysSinceTest {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(days)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(daysColor(days))
                    Text(days == 1 ? "day since test" : "days since test")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            } else {
                Text("No tests yet")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Mini parameter badges (pH + ammonia)
            HStack(spacing: 6) {
                ForEach(aquarium.keyParameters.prefix(2), id: \.name) { param in
                    paramBadge(param)
                }
            }
        }
        .padding(12)
        .widgetBackground()
    }

    private func paramBadge(_ param: WidgetParameter) -> some View {
        HStack(spacing: 3) {
            Circle()
                .fill(statusColor(param.status))
                .frame(width: 5, height: 5)
            Text("\(param.name) \(formatValue(param.value))")
                .font(.system(size: 10, weight: .medium))
                .lineLimit(1)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(statusColor(param.status).opacity(0.12))
        .cornerRadius(8)
    }

    private var emptyView: some View {
        VStack(spacing: 8) {
            Image(systemName: "fish")
                .font(.system(size: 28))
                .foregroundColor(.blue.opacity(0.6))
            Text("Open Ally\nto get started")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .widgetBackground()
    }

    private var staleView: some View {
        VStack(spacing: 8) {
            Image(systemName: "arrow.clockwise")
                .font(.system(size: 24))
                .foregroundColor(.orange)
            Text("Open Ally to refresh")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .widgetBackground()
    }
}

// Helpers moved to Shared/SharedHelpers.swift

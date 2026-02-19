import SwiftUI

struct AquariumDetailView: View {
    let aquarium: WidgetAquarium

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                header
                parametersSection
                daysSinceTestSection
                taskSection
                livestockSection
            }
            .padding(.horizontal)
        }
        .navigationTitle(aquarium.name)
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 8) {
            Image(systemName: aquariumIcon(aquarium.type))
                .font(.system(size: 16))
                .foregroundColor(.blue)

            healthBadge
        }
    }

    private var healthBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(healthColor(aquarium.healthStatus))
                .frame(width: 8, height: 8)
            Text(aquarium.healthStatus.capitalized)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(healthColor(aquarium.healthStatus))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(healthColor(aquarium.healthStatus).opacity(0.15))
        .cornerRadius(10)
    }

    // MARK: - Parameters

    private var parametersSection: some View {
        Group {
            if !aquarium.keyParameters.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Parameters")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    ForEach(aquarium.keyParameters, id: \.name) { param in
                        parameterRow(param)
                    }
                }
            }
        }
    }

    private func parameterRow(_ param: WidgetParameter) -> some View {
        HStack {
            Text(param.name)
                .font(.system(size: 13))

            Spacer()

            Text(formatValue(param.value) + (param.unit.isEmpty ? "" : " \(param.unit)"))
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(statusColor(param.status))
        }
        .padding(.vertical, 2)
    }

    // MARK: - Days Since Test

    private var daysSinceTestSection: some View {
        Group {
            if let days = aquarium.daysSinceTest {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Last Test")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(days)")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(daysColor(days))
                        Text(days == 1 ? "day ago" : "days ago")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }

    // MARK: - Next Task

    private var taskSection: some View {
        Group {
            if let task = aquarium.nextTask {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Next Task")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    HStack(spacing: 6) {
                        Image(systemName: taskIcon(task.taskType))
                            .font(.system(size: 12))
                            .foregroundColor(task.isOverdue ? .red : .blue)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(task.name)
                                .font(.system(size: 13, weight: .medium))
                                .lineLimit(1)
                            Text(relativeDateString(task.dueDate, isOverdue: task.isOverdue))
                                .font(.system(size: 11))
                                .foregroundColor(task.isOverdue ? .red : .secondary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Livestock

    private var livestockSection: some View {
        Group {
            if aquarium.livestockCount > 0 {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Livestock")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    HStack(spacing: 4) {
                        Image(systemName: "fish")
                            .font(.system(size: 12))
                        Text("\(aquarium.livestockCount)")
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                    }
                }
            }
        }
    }
}

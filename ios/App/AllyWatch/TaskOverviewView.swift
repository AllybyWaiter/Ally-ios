import SwiftUI

struct TaskOverviewView: View {
    @EnvironmentObject var sessionManager: WatchSessionManager

    private var tasks: [(aquariumName: String, task: WidgetTask)] {
        guard let data = sessionManager.widgetData else { return [] }
        return data.aquariums
            .compactMap { aquarium in
                guard let task = aquarium.nextTask else { return nil }
                return (aquariumName: aquarium.name, task: task)
            }
            .sorted { lhs, rhs in
                // Overdue tasks first, then sort by due date
                if lhs.task.isOverdue != rhs.task.isOverdue {
                    return lhs.task.isOverdue
                }
                return lhs.task.dueDate < rhs.task.dueDate
            }
    }

    var body: some View {
        NavigationStack {
            Group {
                if tasks.isEmpty {
                    emptyState
                } else {
                    taskList
                }
            }
            .navigationTitle("Tasks")
        }
    }

    private var taskList: some View {
        List(tasks, id: \.task.name) { item in
            taskRow(aquariumName: item.aquariumName, task: item.task)
        }
    }

    private func taskRow(aquariumName: String, task: WidgetTask) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(aquariumName)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
                .lineLimit(1)

            HStack(spacing: 6) {
                Image(systemName: taskIcon(task.taskType))
                    .font(.system(size: 12))
                    .foregroundColor(task.isOverdue ? .red : .blue)

                Text(task.name)
                    .font(.system(size: 14, weight: .medium))
                    .lineLimit(1)
            }

            Text(relativeDateString(task.dueDate, isOverdue: task.isOverdue))
                .font(.system(size: 12))
                .foregroundColor(task.isOverdue ? .red : .secondary)
        }
        .padding(.vertical, 2)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 32))
                .foregroundColor(.green)
            Text("All caught up!")
                .font(.system(size: 15, weight: .medium))
            Text("No upcoming tasks")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
    }
}

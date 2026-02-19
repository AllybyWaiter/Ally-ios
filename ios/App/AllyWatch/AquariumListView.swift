import SwiftUI

struct AquariumListView: View {
    @EnvironmentObject var sessionManager: WatchSessionManager

    var body: some View {
        NavigationStack {
            Group {
                if let data = sessionManager.widgetData {
                    if data.aquariums.isEmpty {
                        emptyState
                    } else {
                        aquariumList(data: data)
                    }
                } else {
                    noDataState
                }
            }
            .navigationTitle {
                Label("Ally", systemImage: "fish")
            }
        }
    }

    private func aquariumList(data: WidgetData) -> some View {
        List {
            if data.isStale {
                staleBanner
            }

            ForEach(data.aquariums, id: \.id) { aquarium in
                NavigationLink(destination: AquariumDetailView(aquarium: aquarium)) {
                    aquariumRow(aquarium)
                }
            }
        }
    }

    private func aquariumRow(_ aquarium: WidgetAquarium) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(healthColor(aquarium.healthStatus))
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 2) {
                Text(aquarium.name)
                    .font(.system(size: 15, weight: .medium))
                    .lineLimit(1)

                if let days = aquarium.daysSinceTest {
                    Text("Tested \(days)d ago")
                        .font(.system(size: 12))
                        .foregroundColor(daysColor(days))
                }
            }
        }
    }

    private var staleBanner: some View {
        HStack(spacing: 6) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 11))
                .foregroundColor(.orange)
            Text("Open iPhone to refresh")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .listRowBackground(Color.orange.opacity(0.15))
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "fish")
                .font(.system(size: 32))
                .foregroundColor(.blue.opacity(0.6))
            Text("No aquariums yet")
                .font(.system(size: 14, weight: .medium))
            Text("Open Ally on iPhone")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
    }

    private var noDataState: some View {
        VStack(spacing: 8) {
            Image(systemName: "iphone.and.arrow.forward")
                .font(.system(size: 28))
                .foregroundColor(.blue.opacity(0.6))
            Text("Open Ally on iPhone to sync")
                .font(.system(size: 13))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

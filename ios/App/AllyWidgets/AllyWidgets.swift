import WidgetKit
import SwiftUI

struct AllyWidgetEntry: TimelineEntry {
    let date: Date
    let widgetData: WidgetData?

    var firstAquarium: WidgetAquarium? {
        widgetData?.aquariums.first
    }

    var isStale: Bool {
        widgetData?.isStale ?? false
    }
}

struct AllyTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> AllyWidgetEntry {
        AllyWidgetEntry(date: Date(), widgetData: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (AllyWidgetEntry) -> Void) {
        let data = WidgetData.load() ?? .placeholder
        completion(AllyWidgetEntry(date: Date(), widgetData: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AllyWidgetEntry>) -> Void) {
        let data = WidgetData.load()
        let entry = AllyWidgetEntry(date: Date(), widgetData: data)
        let nextUpdate = Date().addingTimeInterval(1800) // 30 minutes
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Home Screen Widgets

struct AllySmallWidget: Widget {
    let kind = "AllySmallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyTimelineProvider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("Aquarium Status")
        .description("Quick glance at your aquarium health.")
        .supportedFamilies([.systemSmall])
    }
}

struct AllyMediumWidget: Widget {
    let kind = "AllyMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyTimelineProvider()) { entry in
            MediumWidgetView(entry: entry)
        }
        .configurationDisplayName("Aquarium Details")
        .description("Key parameters and upcoming tasks.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Lock Screen Widgets (iOS 16+)

struct AllyLockScreenWidget: Widget {
    let kind = "AllyLockScreenWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyTimelineProvider()) { entry in
            LockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Ally Lock Screen")
        .description("Aquarium info on your lock screen.")
        .supportedFamilies(lockScreenFamilies)
    }

    private var lockScreenFamilies: [WidgetFamily] {
        if #available(iOS 16.0, *) {
            return [.accessoryRectangular, .accessoryCircular]
        }
        return []
    }
}

// MARK: - Widget Bundle

@main
struct AllyWidgetBundle: WidgetBundle {
    var body: some Widget {
        AllySmallWidget()
        AllyMediumWidget()
        AllyLockScreenWidget()
    }
}

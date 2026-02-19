import WidgetKit
import SwiftUI

struct AllyWatchWidgetEntry: TimelineEntry {
    let date: Date
    let widgetData: WidgetData?

    var firstAquarium: WidgetAquarium? {
        widgetData?.aquariums.first
    }

    var isStale: Bool {
        widgetData?.isStale ?? false
    }
}

struct AllyWatchTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> AllyWatchWidgetEntry {
        AllyWatchWidgetEntry(date: Date(), widgetData: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (AllyWatchWidgetEntry) -> Void) {
        let data = WidgetData.loadLocal() ?? .placeholder
        completion(AllyWatchWidgetEntry(date: Date(), widgetData: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AllyWatchWidgetEntry>) -> Void) {
        let data = WidgetData.loadLocal()
        let entry = AllyWatchWidgetEntry(date: Date(), widgetData: data)
        let nextUpdate = Date().addingTimeInterval(1800) // 30 minutes
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Circular Complication

struct AllyWatchCircularWidget: Widget {
    let kind = "AllyWatchCircularWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyWatchTimelineProvider()) { entry in
            CircularComplicationView(entry: entry)
        }
        .configurationDisplayName("Aquarium Test")
        .description("Days since last water test.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Rectangular Complication

struct AllyWatchRectangularWidget: Widget {
    let kind = "AllyWatchRectangularWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyWatchTimelineProvider()) { entry in
            RectangularComplicationView(entry: entry)
        }
        .configurationDisplayName("Aquarium Details")
        .description("Aquarium name and next task.")
        .supportedFamilies([.accessoryRectangular])
    }
}

// MARK: - Corner Complication

struct AllyWatchCornerWidget: Widget {
    let kind = "AllyWatchCornerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyWatchTimelineProvider()) { entry in
            CornerComplicationView(entry: entry)
        }
        .configurationDisplayName("Test Days")
        .description("Days since test with gauge.")
        .supportedFamilies([.accessoryCorner])
    }
}

// MARK: - Inline Complication

struct AllyWatchInlineWidget: Widget {
    let kind = "AllyWatchInlineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllyWatchTimelineProvider()) { entry in
            InlineComplicationView(entry: entry)
        }
        .configurationDisplayName("Aquarium Inline")
        .description("Quick aquarium status text.")
        .supportedFamilies([.accessoryInline])
    }
}

// MARK: - Widget Bundle

@main
struct AllyWatchWidgetBundle: WidgetBundle {
    var body: some Widget {
        AllyWatchCircularWidget()
        AllyWatchRectangularWidget()
        AllyWatchCornerWidget()
        AllyWatchInlineWidget()
    }
}

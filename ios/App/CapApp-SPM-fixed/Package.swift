// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapApp-SPM",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.0.2"),
        .package(path: "../../../node_modules/@capacitor/app"),
        .package(path: "../../../node_modules/@capacitor/geolocation"),
        .package(path: "../../../node_modules/@capacitor/push-notifications"),
        .package(path: "../../../node_modules/@revenuecat/purchases-capacitor"),
        .package(path: "../../../node_modules/@revenuecat/purchases-capacitor-ui")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "app"),
                .product(name: "CapacitorGeolocation", package: "geolocation"),
                .product(name: "CapacitorPushNotifications", package: "push-notifications"),
                .product(name: "RevenuecatPurchasesCapacitor", package: "purchases-capacitor"),
                .product(name: "RevenuecatPurchasesCapacitorUi", package: "purchases-capacitor-ui")
            ],
            path: "Sources/CapApp-SPM"
        )
    ]
)

// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.3"),
        .package(name: "CapgoCapacitorAppIntents", path: "../../../node_modules/.bun/@capgo+capacitor-app-intents@file+..+5d3eaa9226ec709a/node_modules/@capgo/capacitor-app-intents"),
        .package(name: "CapacitorSplashScreen", path: "../../../node_modules/.bun/@capacitor+splash-screen@8.0.2+9cf34ba37901b220/node_modules/@capacitor/splash-screen")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapgoCapacitorAppIntents", package: "CapgoCapacitorAppIntents"),
                .product(name: "CapacitorSplashScreen", package: "CapacitorSplashScreen")
            ]
        )
    ]
)

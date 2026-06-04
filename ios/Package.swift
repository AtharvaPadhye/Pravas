// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "PravasIOS",
    platforms: [
        .iOS(.v17), .macOS(.v14)
    ],
    products: [
        .library(name: "PravasCore", targets: ["PravasCore"])
    ],
    targets: [
        .target(name: "PravasCore"),
        .testTarget(name: "PravasCoreTests", dependencies: ["PravasCore"])
    ]
)

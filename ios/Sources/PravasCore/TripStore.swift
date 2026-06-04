import Foundation

public actor TripStore {
    private let storageURL: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(storageURL: URL) {
        self.storageURL = storageURL
        encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }

    public func save(_ draft: TripDraft) throws {
        try write(draft, to: storageURL)
    }

    public func load() throws -> TripDraft? {
        try read(TripDraft.self, from: storageURL)
    }

    public func saveDashboard(_ dashboard: TripDashboard) throws {
        try write(dashboard, to: dashboardURL)
    }

    public func loadDashboard() throws -> TripDashboard? {
        try read(TripDashboard.self, from: dashboardURL)
    }

    public func reset() throws {
        let fileManager = FileManager.default
        for url in [storageURL, dashboardURL] where fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }

    private var dashboardURL: URL {
        storageURL.deletingLastPathComponent().appendingPathComponent("dashboard.json")
    }

    private func write<Value: Encodable>(_ value: Value, to url: URL) throws {
        let directory = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try encoder.encode(value).write(to: url, options: [.atomic])
    }

    private func read<Value: Decodable>(_ type: Value.Type, from url: URL) throws -> Value? {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return nil
        }

        let data = try Data(contentsOf: url)
        return try decoder.decode(type, from: data)
    }
}

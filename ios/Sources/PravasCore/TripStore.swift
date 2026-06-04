import Foundation

public actor TripStore {
    private let storageURL: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(storageURL: URL) {
        self.storageURL = storageURL
        encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        decoder = JSONDecoder()
    }

    public func save(_ draft: TripDraft) throws {
        let directory = storageURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try encoder.encode(draft).write(to: storageURL, options: [.atomic])
    }

    public func load() throws -> TripDraft? {
        guard FileManager.default.fileExists(atPath: storageURL.path) else {
            return nil
        }

        let data = try Data(contentsOf: storageURL)
        return try decoder.decode(TripDraft.self, from: data)
    }
}

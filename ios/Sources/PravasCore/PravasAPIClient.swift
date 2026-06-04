import Foundation
#if canImport(FoundationNetworking)
@preconcurrency import FoundationNetworking
#endif

public protocol TimelineBackend: Sendable {
    func loadIntegrations() async throws -> [Integration]
    func loadDemoTimeline() async throws -> TimelineResponse
    func submitSignals(_ signals: [TravelSignal]) async throws -> TimelineResponse
}

public struct LocalTimelineBackend: TimelineBackend {
    private let engine: TimelineInferenceEngine

    public init(engine: TimelineInferenceEngine = TimelineInferenceEngine()) {
        self.engine = engine
    }

    public func loadIntegrations() async throws -> [Integration] {
        TimelineInferenceEngine.integrations
    }

    public func loadDemoTimeline() async throws -> TimelineResponse {
        engine.inferTimeline()
    }

    public func submitSignals(_ signals: [TravelSignal]) async throws -> TimelineResponse {
        engine.inferTimeline(from: signals)
    }
}

public struct RemoteTimelineBackend: TimelineBackend, @unchecked Sendable {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }

    public func loadIntegrations() async throws -> [Integration] {
        let response: IntegrationsResponse = try await get("/api/integrations")
        return response.integrations
    }

    public func loadDemoTimeline() async throws -> TimelineResponse {
        try await get("/api/demo/timeline")
    }

    public func submitSignals(_ signals: [TravelSignal]) async throws -> TimelineResponse {
        try await post("/api/signals", body: SignalsRequest(signals: signals))
    }

    private func get<Response: Decodable>(_ path: String) async throws -> Response {
        let (data, response) = try await session.data(from: baseURL.appending(path: path))
        try Self.validate(response)
        return try decoder.decode(Response.self, from: data)
    }

    private func post<Request: Encodable, Response: Decodable>(_ path: String, body: Request) async throws -> Response {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        let (data, response) = try await session.data(for: request)
        try Self.validate(response)
        return try decoder.decode(Response.self, from: data)
    }

    private static func validate(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
    }

    private struct IntegrationsResponse: Decodable {
        let integrations: [Integration]
    }

    private struct SignalsRequest: Encodable {
        let signals: [TravelSignal]
    }

    public enum APIError: Error, Equatable {
        case invalidResponse
    }
}

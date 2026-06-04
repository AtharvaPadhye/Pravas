import Foundation

public struct Integration: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let label: String
    public let signal: String
    public let permission: String

    public init(id: String, label: String, signal: String, permission: String) {
        self.id = id
        self.label = label
        self.signal = signal
        self.permission = permission
    }
}

public struct TravelSignal: Codable, Equatable, Identifiable, Sendable {
    public var id: String { "\(source)-\(capturedAt)-\(venue ?? place ?? "unknown")" }

    public let source: String
    public let capturedAt: String
    public let place: String?
    public let venue: String?
    public let category: TimelineCategory
    public let detail: String
    public let confirmation: String?
    public let dwellMinutes: Int?
    public let amount: String?
    public let confidence: Double

    public init(
        source: String,
        capturedAt: String,
        place: String?,
        venue: String?,
        category: TimelineCategory,
        detail: String,
        confirmation: String? = nil,
        dwellMinutes: Int? = nil,
        amount: String? = nil,
        confidence: Double
    ) {
        self.source = source
        self.capturedAt = capturedAt
        self.place = place
        self.venue = venue
        self.category = category
        self.detail = detail
        self.confirmation = confirmation
        self.dwellMinutes = dwellMinutes
        self.amount = amount
        self.confidence = confidence
    }
}

public enum TimelineCategory: String, Codable, CaseIterable, Equatable, Sendable {
    case hotel
    case restaurant
    case activity

    public var displayName: String {
        switch self {
        case .hotel: "Hotel"
        case .restaurant: "Restaurant"
        case .activity: "Activity"
        }
    }
}

public enum SignalReviewStatus: String, Codable, CaseIterable, Equatable, Sendable {
    case pending
    case approved
    case rejected

    public var displayName: String {
        switch self {
        case .pending: "Pending"
        case .approved: "Approved"
        case .rejected: "Rejected"
        }
    }
}

public struct SignalReviewItem: Codable, Equatable, Identifiable, Sendable {
    public let id: UUID
    public var signal: TravelSignal
    public var status: SignalReviewStatus
    public var note: String?

    public init(
        id: UUID = UUID(),
        signal: TravelSignal,
        status: SignalReviewStatus = .pending,
        note: String? = nil
    ) {
        self.id = id
        self.signal = signal
        self.status = status
        self.note = note
    }
}

public struct TimelineEvent: Codable, Equatable, Identifiable, Sendable {
    public var id: String { "\(day)-\(venue)-\(category.rawValue)" }

    public let day: String
    public let venue: String
    public let place: String
    public let category: TimelineCategory
    public let firstSeenAt: String
    public let evidence: [TravelSignal]
    public let title: String
    public let confidence: Double
    public let reason: String
}

public struct TimelineDay: Codable, Equatable, Identifiable, Sendable {
    public var id: String { day }

    public let day: String
    public let label: String
    public let events: [TimelineEvent]
}

public struct TimelineResponse: Codable, Equatable, Sendable {
    public let principle: String
    public let generatedBy: String
    public let generatedAt: String
    public let integrations: [Integration]
    public let events: [TimelineEvent]
    public let timeline: [TimelineDay]
}

public struct TripDraft: Codable, Equatable, Identifiable, Sendable {
    public let id: UUID
    public var name: String
    public var destination: String
    public var startsAt: Date
    public var endsAt: Date
    public var invitedFriends: [String]
    public var visibility: TripVisibility

    public init(
        id: UUID = UUID(),
        name: String,
        destination: String,
        startsAt: Date,
        endsAt: Date,
        invitedFriends: [String],
        visibility: TripVisibility
    ) {
        self.id = id
        self.name = name
        self.destination = destination
        self.startsAt = startsAt
        self.endsAt = endsAt
        self.invitedFriends = invitedFriends
        self.visibility = visibility
    }
}

public enum TripVisibility: String, Codable, CaseIterable, Equatable, Sendable {
    case privateTrip = "private"
    case shareable

    public var displayName: String {
        switch self {
        case .privateTrip: "Private trip"
        case .shareable: "Shareable link"
        }
    }
}

public struct TripDashboard: Codable, Equatable, Sendable {
    public var draft: TripDraft
    public var timeline: TimelineResponse
    public var reviewedSignals: [SignalReviewItem]
    public var shareURL: URL?
    public var lastUpdatedAt: Date

    public init(
        draft: TripDraft,
        timeline: TimelineResponse,
        reviewedSignals: [SignalReviewItem],
        shareURL: URL? = nil,
        lastUpdatedAt: Date = Date()
    ) {
        self.draft = draft
        self.timeline = timeline
        self.reviewedSignals = reviewedSignals
        self.shareURL = shareURL
        self.lastUpdatedAt = lastUpdatedAt
    }
}

public struct PublishedRecap: Codable, Equatable, Sendable {
    public let title: String
    public let summary: String
    public let shareURL: URL
    public let highlights: [String]

    public init(title: String, summary: String, shareURL: URL, highlights: [String]) {
        self.title = title
        self.summary = summary
        self.shareURL = shareURL
        self.highlights = highlights
    }
}

#!/usr/bin/env node
const crypto = require("node:crypto");
const http = require("node:http");

const PORT = Number(process.env.PORT || 4174);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const integrations = [
  {
    id: "apple_photos",
    label: "Apple Photos",
    signal: "geo-tagged media clusters",
    permission: "read-only album/location metadata",
    connectorType: "native",
    requires: [],
    scopes: ["photos.readonly"],
  },
  {
    id: "google_account",
    label: "Google Account",
    signal: "identity, maps, photos, Gmail, Flights, and Calendar permissions",
    permission: "OAuth scopes selected by the traveler",
    connectorType: "oauth",
    provider: "google",
    requires: [],
    scopes: ["openid", "email", "profile"],
  },
  {
    id: "google_maps",
    label: "Google Maps",
    signal: "visited places and dwell time",
    permission: "location history export or app webhook",
    connectorType: "oauth",
    provider: "google",
    requires: ["google_account"],
    scopes: ["https://www.googleapis.com/auth/maps.timeline.readonly"],
  },
  {
    id: "google_photos",
    label: "Google Photos",
    signal: "photo timestamps, albums, and location clusters",
    permission: "read-only media metadata and selected albums",
    connectorType: "oauth",
    provider: "google",
    requires: ["google_account"],
    scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
  },
  {
    id: "gmail_reservations",
    label: "Gmail / Reservations",
    signal: "hotel, restaurant, and tour confirmations",
    permission: "reservation emails only",
    connectorType: "oauth",
    provider: "google",
    requires: ["google_account"],
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  },
  {
    id: "google_flights",
    label: "Google Flights",
    signal: "flight bookings, holds, and tracked routes",
    permission: "flight itinerary metadata",
    connectorType: "oauth",
    provider: "google",
    requires: ["google_account"],
    scopes: ["https://www.googleapis.com/auth/travel.partner"],
  },
  {
    id: "calendar",
    label: "Calendar",
    signal: "trip dates, event holds, and reminders",
    permission: "travel-related calendar events",
    connectorType: "oauth",
    provider: "google",
    requires: ["google_account"],
    scopes: ["https://www.googleapis.com/auth/calendar.events.readonly"],
  },
  {
    id: "credit_card",
    label: "Credit Card",
    signal: "merchant, timestamp, and amount",
    permission: "travel merchant transactions",
    connectorType: "financial",
    requires: [],
    scopes: ["transactions.travel.readonly"],
  },
  {
    id: "airline_accounts",
    label: "Airline accounts",
    signal: "PNRs, loyalty profile, gates, and flight status",
    permission: "itinerary and flight-status access",
    connectorType: "oauth",
    requires: [],
    scopes: ["itineraries.readonly", "flight-status.readonly"],
  },
];

const demoSignals = [
  {
    source: "apple_photos",
    capturedAt: "2026-05-02T09:08:00+01:00",
    place: "Alfama",
    venue: "Memmo Alfama",
    category: "hotel",
    detail: "Apple Photos detected: Alfama",
    confidence: 0.78,
  },
  {
    source: "gmail_reservations",
    capturedAt: "2026-05-02T08:55:00+01:00",
    place: "Alfama",
    venue: "Memmo Alfama",
    category: "hotel",
    detail: "Gmail found: Memmo Alfama booking",
    confirmation: "MAL-4921",
    confidence: 0.96,
  },
  {
    source: "google_maps",
    capturedAt: "2026-05-02T09:18:00+01:00",
    place: "Alfama",
    venue: "Memmo Alfama",
    category: "hotel",
    detail: "Maps dwell: overnight stay started at 9:18 AM",
    dwellMinutes: 620,
    confidence: 0.92,
  },
  {
    source: "google_maps",
    capturedAt: "2026-05-02T13:04:00+01:00",
    place: "Cais do Sodré",
    venue: "Time Out Market",
    category: "restaurant",
    detail: "Maps visited: Time Out Market",
    dwellMinutes: 68,
    confidence: 0.9,
  },
  {
    source: "credit_card",
    capturedAt: "2026-05-02T13:22:00+01:00",
    place: "Cais do Sodré",
    venue: "Time Out Market",
    category: "restaurant",
    detail: "Card charge: €42.10 restaurant",
    amount: "€42.10",
    confidence: 0.88,
  },
];

const sourceWeights = {
  gmail_reservations: 0.34,
  google_maps: 0.28,
  credit_card: 0.22,
  apple_photos: 0.16,
};

const toDayKey = (capturedAt) => new Date(capturedAt).toISOString().slice(0, 10);

const normalizeVenueKey = (signal) =>
  `${signal.venue || signal.place || "unknown"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const getEventTitle = (event) => {
  if (event.category === "hotel") {
    return `Stayed at ${event.venue}`;
  }

  if (event.category === "restaurant") {
    return `Ate at ${event.venue}`;
  }

  return `Visited ${event.venue}`;
};

const getInferenceReason = (event) => {
  const sources = new Set(event.evidence.map((signal) => signal.source));
  const hasDwell = event.evidence.some((signal) => Number(signal.dwellMinutes) >= 45);
  const hasReservation = sources.has("gmail_reservations");
  const hasCharge = sources.has("credit_card");

  if (event.category === "hotel" && hasReservation && hasDwell) {
    return "Reservation plus overnight dwell time indicates the traveler stayed here.";
  }

  if (event.category === "restaurant" && hasCharge && hasDwell) {
    return "Map dwell time plus a same-place card charge indicates a restaurant visit.";
  }

  return "Multiple passive travel signals point to the same place and time window.";
};

const summarizeConfidence = (signals) => {
  const sourceScore = signals.reduce(
    (total, signal) => total + (sourceWeights[signal.source] || 0.1),
    0,
  );
  const averageSignalConfidence =
    signals.reduce((total, signal) => total + Number(signal.confidence || 0.7), 0) /
    Math.max(signals.length, 1);

  return Math.min(0.99, Number((sourceScore + averageSignalConfidence * 0.34).toFixed(2)));
};

function inferTimeline(signals = demoSignals) {
  const grouped = new Map();

  signals.forEach((signal) => {
    const key = `${toDayKey(signal.capturedAt)}:${normalizeVenueKey(signal)}`;
    const current = grouped.get(key) || {
      day: toDayKey(signal.capturedAt),
      venue: signal.venue || signal.place,
      place: signal.place || signal.venue,
      category: signal.category || "activity",
      firstSeenAt: signal.capturedAt,
      evidence: [],
    };

    current.firstSeenAt =
      signal.capturedAt < current.firstSeenAt ? signal.capturedAt : current.firstSeenAt;
    current.category = current.category === "activity" ? signal.category : current.category;
    current.evidence.push(signal);
    grouped.set(key, current);
  });

  const events = [...grouped.values()]
    .map((event) => ({
      ...event,
      title: getEventTitle(event),
      confidence: summarizeConfidence(event.evidence),
      reason: getInferenceReason(event),
      evidence: event.evidence.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)),
    }))
    .sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt));

  const days = events.reduce((acc, event) => {
    const day = acc.get(event.day) || [];
    day.push(event);
    acc.set(event.day, day);
    return acc;
  }, new Map());

  return {
    principle: "No manual logging — Pravas captures passive travel signals and asks only for review.",
    generatedBy: "Pravas AI Timeline Backend",
    generatedAt: new Date().toISOString(),
    integrations,
    events,
    timeline: [...days.entries()].map(([day, dayEvents], index) => ({
      day,
      label: `AI generated: Day ${index + 1} timeline`,
      events: dayEvents,
    })),
  };
}

const toPublicConnector = (connector, user) => {
  const connection = user?.connectors?.[connector.id];

  return {
    ...connector,
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt || null,
    grantedScopes: connection?.scopes || [],
    status: connection ? "connected" : "available",
  };
};

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  provider: user.provider,
  googleSubject: user.googleSubject,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createMemoryStore = () => ({
  usersById: new Map(),
  userIdsByEmail: new Map(),
  sessionsByToken: new Map(),
});

const createId = (prefix) => `${prefix}_${crypto.randomBytes(16).toString("hex")}`;

const normalizeGoogleProfile = (profile) => {
  if (!profile?.email || !profile?.sub) {
    throw Object.assign(new Error("Google credential is missing an email or subject."), {
      statusCode: 401,
      publicMessage: "Google sign-in failed. Please try again.",
    });
  }

  return {
    sub: String(profile.sub),
    email: String(profile.email).toLowerCase(),
    emailVerified: profile.email_verified === true || profile.email_verified === "true",
    name: String(profile.name || profile.given_name || profile.email).trim(),
    picture: profile.picture || "",
    aud: profile.aud || "",
  };
};

async function verifyGoogleCredential(credential, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (!credential || typeof credential !== "string") {
    throw Object.assign(new Error("Missing Google credential."), {
      statusCode: 400,
      publicMessage: "Missing Google credential.",
    });
  }

  if (credential.startsWith("test-google:") && process.env.NODE_ENV === "test") {
    return normalizeGoogleProfile(JSON.parse(Buffer.from(credential.slice(12), "base64url").toString("utf8")));
  }

  if (!fetchImpl) {
    throw Object.assign(new Error("Fetch is required to verify Google credentials."), {
      statusCode: 500,
      publicMessage: "Google sign-in is not configured on this server.",
    });
  }

  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
    credential,
  )}`;
  const googleResponse = await fetchImpl(tokenInfoUrl);

  if (!googleResponse.ok) {
    throw Object.assign(new Error(`Google rejected credential with ${googleResponse.status}.`), {
      statusCode: 401,
      publicMessage: "Google sign-in failed. Please try again.",
    });
  }

  const profile = normalizeGoogleProfile(await googleResponse.json());
  const expectedAudience = options.googleClientId || process.env.GOOGLE_CLIENT_ID;

  if (expectedAudience && profile.aud && profile.aud !== expectedAudience) {
    throw Object.assign(new Error("Google credential audience does not match this app."), {
      statusCode: 401,
      publicMessage: "Google sign-in failed. Please try again.",
    });
  }

  if (!profile.emailVerified) {
    throw Object.assign(new Error("Google account email is not verified."), {
      statusCode: 401,
      publicMessage: "Google account email must be verified.",
    });
  }

  return profile;
}

const upsertGoogleUser = (store, googleProfile) => {
  const now = new Date().toISOString();
  const existingUserId = store.userIdsByEmail.get(googleProfile.email);
  const user = existingUserId
    ? store.usersById.get(existingUserId)
    : {
        id: createId("usr"),
        email: googleProfile.email,
        createdAt: now,
        connectors: {},
      };

  user.name = googleProfile.name;
  user.avatarUrl = googleProfile.picture;
  user.provider = "google";
  user.googleSubject = googleProfile.sub;
  user.updatedAt = now;
  user.connectors.google_account = {
    id: "google_account",
    provider: "google",
    connectedAt: user.connectors.google_account?.connectedAt || now,
    scopes: integrations.find((connector) => connector.id === "google_account").scopes,
    metadata: { email: googleProfile.email, emailVerified: googleProfile.emailVerified },
  };

  store.usersById.set(user.id, user);
  store.userIdsByEmail.set(user.email, user.id);
  return user;
};

const createSession = (store, userId) => {
  const token = createId("ses");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  store.sessionsByToken.set(token, { token, userId, createdAt: new Date().toISOString(), expiresAt });
  return { token, expiresAt, type: "Bearer" };
};

const getBearerToken = (request) => {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
};

const getAuthenticatedUser = (request, store) => {
  const token = getBearerToken(request);
  const session = token ? store.sessionsByToken.get(token) : null;

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return store.usersById.get(session.userId) || null;
};

const requireAuthenticatedUser = (request, store) => {
  const user = getAuthenticatedUser(request, store);

  if (!user) {
    throw Object.assign(new Error("Authentication required."), {
      statusCode: 401,
      publicMessage: "Authentication required.",
    });
  }

  return user;
};

const getConnectorById = (connectorId) => integrations.find((connector) => connector.id === connectorId);

const connectUserConnector = (user, connectorId, body = {}) => {
  const connector = getConnectorById(connectorId);

  if (!connector) {
    throw Object.assign(new Error(`Unknown connector: ${connectorId}`), {
      statusCode: 404,
      publicMessage: "Connector not found.",
    });
  }

  const missingRequirement = connector.requires.find((requiredId) => !user.connectors[requiredId]);

  if (missingRequirement) {
    throw Object.assign(new Error(`${connectorId} requires ${missingRequirement}.`), {
      statusCode: 409,
      publicMessage: `${connector.label} requires ${getConnectorById(missingRequirement).label} first.`,
    });
  }

  const requestedScopes = Array.isArray(body.scopes) && body.scopes.length ? body.scopes : connector.scopes;
  user.connectors[connectorId] = {
    id: connectorId,
    provider: connector.provider || connector.connectorType,
    connectedAt: user.connectors[connectorId]?.connectedAt || new Date().toISOString(),
    scopes: requestedScopes,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  };
  user.updatedAt = new Date().toISOString();
  return toPublicConnector(connector, user);
};

const disconnectUserConnector = (user, connectorId) => {
  const connector = getConnectorById(connectorId);

  if (!connector) {
    throw Object.assign(new Error(`Unknown connector: ${connectorId}`), {
      statusCode: 404,
      publicMessage: "Connector not found.",
    });
  }

  delete user.connectors[connectorId];

  integrations
    .filter((candidate) => candidate.requires.includes(connectorId))
    .forEach((dependent) => {
      delete user.connectors[dependent.id];
    });

  user.updatedAt = new Date().toISOString();
  return toPublicConnector(connector, user);
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(JSON.stringify(body, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

const sendError = (response, error) => {
  sendJson(response, error.statusCode || 500, {
    error: error.publicMessage || "Unexpected backend error.",
  });
};

function createServer(options = {}) {
  const store = options.store || createMemoryStore();
  const googleVerifier = options.verifyGoogleCredential || ((credential) => verifyGoogleCredential(credential));

  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "pravas-ai-backend" });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/integrations") {
      sendJson(response, 200, { integrations });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/demo/timeline") {
      sendJson(response, 200, inferTimeline(demoSignals));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/signals") {
      try {
        const body = await readBody(request);
        const signals = Array.isArray(body.signals) ? body.signals : [];
        sendJson(response, 201, inferTimeline(signals));
      } catch (error) {
        sendJson(response, 400, { error: "Invalid JSON body" });
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/google") {
      try {
        const body = await readBody(request);
        const googleProfile = await googleVerifier(body.credential);
        const user = upsertGoogleUser(store, googleProfile);
        const session = createSession(store, user.id);
        sendJson(response, 201, {
          user: toPublicUser(user),
          session,
          connectors: integrations.map((connector) => toPublicConnector(connector, user)),
        });
      } catch (error) {
        sendError(response, error);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/me") {
      try {
        const user = requireAuthenticatedUser(request, store);
        sendJson(response, 200, {
          user: toPublicUser(user),
          connectors: integrations.map((connector) => toPublicConnector(connector, user)),
        });
      } catch (error) {
        sendError(response, error);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/connectors") {
      const user = getAuthenticatedUser(request, store);
      sendJson(response, 200, {
        connectors: integrations.map((connector) => toPublicConnector(connector, user)),
      });
      return;
    }

    const connectorMatch = requestUrl.pathname.match(/^\/api\/connectors\/([^/]+)$/);
    if (connectorMatch && request.method === "POST") {
      try {
        const user = requireAuthenticatedUser(request, store);
        const body = await readBody(request);
        const connector = connectUserConnector(user, decodeURIComponent(connectorMatch[1]), body);
        sendJson(response, 200, {
          connector,
          connectors: integrations.map((candidate) => toPublicConnector(candidate, user)),
        });
      } catch (error) {
        sendError(response, error);
      }
      return;
    }

    if (connectorMatch && request.method === "DELETE") {
      try {
        const user = requireAuthenticatedUser(request, store);
        const connector = disconnectUserConnector(user, decodeURIComponent(connectorMatch[1]));
        sendJson(response, 200, {
          connector,
          connectors: integrations.map((candidate) => toPublicConnector(candidate, user)),
        });
      } catch (error) {
        sendError(response, error);
      }
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Pravas AI backend listening on http://localhost:${PORT}`);
  });
}

module.exports = {
  connectUserConnector,
  createMemoryStore,
  createServer,
  demoSignals,
  disconnectUserConnector,
  inferTimeline,
  integrations,
  verifyGoogleCredential,
};

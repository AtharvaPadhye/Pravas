const assert = require("node:assert/strict");
const test = require("node:test");
const { demoSignals, inferTimeline } = require("../backend");

test("infers Lisbon hotel stay and restaurant visit from passive signals", () => {
  const result = inferTimeline(demoSignals);

  assert.equal(result.principle.includes("No manual logging"), true);
  assert.equal(result.timeline.length, 1);
  assert.equal(result.timeline[0].label, "AI generated: Day 1 timeline");

  const hotel = result.events.find((event) => event.category === "hotel");
  const restaurant = result.events.find((event) => event.category === "restaurant");

  assert.equal(hotel.venue, "Memmo Alfama");
  assert.equal(hotel.evidence.length, 3);
  assert.ok(hotel.confidence >= 0.9);
  assert.equal(restaurant.venue, "Time Out Market");
  assert.equal(restaurant.evidence.some((signal) => signal.source === "credit_card"), true);
});

test("accepts custom signals and groups them into daily timeline events", () => {
  const result = inferTimeline([
    {
      source: "google_maps",
      capturedAt: "2026-07-12T20:00:00-04:00",
      place: "West Village",
      venue: "Via Carota",
      category: "restaurant",
      dwellMinutes: 75,
      confidence: 0.91,
    },
    {
      source: "credit_card",
      capturedAt: "2026-07-12T21:10:00-04:00",
      place: "West Village",
      venue: "Via Carota",
      category: "restaurant",
      amount: "$118.42",
      confidence: 0.89,
    },
  ]);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, "Ate at Via Carota");
  assert.equal(result.events[0].evidence.length, 2);
});

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });

const close = (server) => new Promise((resolve) => server.close(resolve));

const requestJson = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
};

test("signs users in with a verified Google credential and creates a session", async () => {
  const { createMemoryStore, createServer } = require("../backend");
  const server = createServer({
    store: createMemoryStore(),
    verifyGoogleCredential: async (credential) => {
      assert.equal(credential, "google-id-token");
      return {
        sub: "google-sub-123",
        email: "maya@example.com",
        emailVerified: true,
        name: "Maya Chen",
        picture: "https://example.com/maya.png",
      };
    },
  });
  const baseUrl = await listen(server);

  try {
    const { response, body } = await requestJson(baseUrl, "/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: "google-id-token" }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.user.email, "maya@example.com");
    assert.equal(body.user.provider, "google");
    assert.equal(body.session.type, "Bearer");
    assert.ok(body.session.token.startsWith("ses_"));
    assert.equal(
      body.connectors.find((connector) => connector.id === "google_account").connected,
      true,
    );
  } finally {
    await close(server);
  }
});

test("authenticated users can connect and disconnect Google-backed connectors", async () => {
  const { createMemoryStore, createServer } = require("../backend");
  const server = createServer({
    store: createMemoryStore(),
    verifyGoogleCredential: async () => ({
      sub: "google-sub-456",
      email: "leo@example.com",
      emailVerified: true,
      name: "Leo Martinez",
      picture: "",
    }),
  });
  const baseUrl = await listen(server);

  try {
    const signIn = await requestJson(baseUrl, "/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: "google-id-token" }),
    });
    const authHeaders = { Authorization: `Bearer ${signIn.body.session.token}` };

    const connect = await requestJson(baseUrl, "/api/connectors/google_photos", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"] }),
    });

    assert.equal(connect.response.status, 200);
    assert.equal(connect.body.connector.id, "google_photos");
    assert.equal(connect.body.connector.connected, true);
    assert.deepEqual(connect.body.connector.grantedScopes, [
      "https://www.googleapis.com/auth/photoslibrary.readonly",
    ]);

    const me = await requestJson(baseUrl, "/api/me", { headers: authHeaders });
    assert.equal(me.response.status, 200);
    assert.equal(
      me.body.connectors.find((connector) => connector.id === "google_photos").connected,
      true,
    );

    const disconnect = await requestJson(baseUrl, "/api/connectors/google_account", {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(disconnect.response.status, 200);
    assert.equal(
      disconnect.body.connectors.find((connector) => connector.id === "google_photos").connected,
      false,
    );
  } finally {
    await close(server);
  }
});

test("connector mutations require authentication and Google prerequisites", async () => {
  const {
    connectUserConnector,
    createMemoryStore,
    createServer,
  } = require("../backend");
  const server = createServer({ store: createMemoryStore() });
  const baseUrl = await listen(server);

  try {
    const unauthenticated = await requestJson(baseUrl, "/api/connectors/google_photos", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert.equal(unauthenticated.response.status, 401);

    assert.throws(
      () =>
        connectUserConnector(
          {
            id: "usr_local",
            connectors: {},
          },
          "google_photos",
        ),
      /requires google_account/,
    );
  } finally {
    await close(server);
  }
});

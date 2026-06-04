#!/usr/bin/env node
const http = require("node:http");

const PORT = Number(process.env.PORT || 4174);

const integrations = [
  {
    id: "apple_photos",
    label: "Apple Photos",
    signal: "geo-tagged media clusters",
    permission: "read-only album/location metadata",
  },
  {
    id: "google_maps",
    label: "Google Maps",
    signal: "visited places and dwell time",
    permission: "location history export or app webhook",
  },
  {
    id: "gmail_reservations",
    label: "Gmail / Reservations",
    signal: "hotel and restaurant confirmations",
    permission: "reservation emails only",
  },
  {
    id: "credit_card",
    label: "Credit Card",
    signal: "merchant, timestamp, and amount",
    permission: "travel merchant transactions",
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

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true, service: "pravas-ai-backend" });
      return;
    }

    if (request.method === "GET" && request.url === "/api/integrations") {
      sendJson(response, 200, { integrations });
      return;
    }

    if (request.method === "GET" && request.url === "/api/demo/timeline") {
      sendJson(response, 200, inferTimeline(demoSignals));
      return;
    }

    if (request.method === "POST" && request.url === "/api/signals") {
      try {
        const body = await readBody(request);
        const signals = Array.isArray(body.signals) ? body.signals : [];
        sendJson(response, 201, inferTimeline(signals));
      } catch (error) {
        sendJson(response, 400, { error: "Invalid JSON body" });
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

module.exports = { createServer, demoSignals, inferTimeline, integrations };

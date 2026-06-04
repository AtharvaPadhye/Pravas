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

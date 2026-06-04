# Pravas

Pravas is an early SaaS concept for automatic vacation tracking: a social trip dashboard that records hotels, restaurants, activities, and day-by-day memories as travelers move through the world.

## Run locally

The home page is a dependency-free static site. Serve the repository root with any static web server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Native iOS app

The repository now includes a native SwiftUI app scaffold in `ios/` that mirrors the website product proof and adds reusable backend logic for mobile:

- `ios/App/PravasApp` — Start Trip, Timeline, and Signals tabs for the iOS frontend.
- `ios/Sources/PravasCore` — local timeline inference, remote API client, trip draft models, and persistence helpers.
- `ios/Tests/PravasCoreTests` — Swift tests for the on-device timeline backend.

Run the iOS backend tests with:

```bash
cd ios
swift test
```

See `ios/README.md` for Xcode setup notes.


## AI capture backend

Pravas now includes a zero-dependency Node backend that turns passive user signals into an AI-ready travel timeline. It is designed around the product wedge of **no manual logging**: users can still review or correct moments, but hotels, restaurants, and day-by-day timelines are inferred from consented integrations.

### Run the backend

```bash
npm start
```

The API listens on `http://localhost:4174` by default.

### API surface

- `GET /health` — service status.
- `GET /api/integrations` — the supported passive data sources: Apple Photos, Google Maps, Gmail/Reservations, and Credit Card.
- `GET /api/demo/timeline` — Lisbon product-proof demo that produces: Apple Photos detected Alfama, Gmail found the Memmo Alfama booking, Maps visited Time Out Market, Card charge €42.10 restaurant, and an AI-generated Day 1 timeline.
- `POST /api/signals` — submit an array of consented app, movement, reservation, and card signals and receive inferred timeline events with confidence, category, evidence, and reasoning.

### Test

```bash
npm test
```

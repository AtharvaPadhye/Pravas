# Pravas iOS app

This folder contains the native iOS implementation of the Pravas product proof. It translates the website flow into a SwiftUI app and moves the backend timeline inference into reusable Swift code.

## What is included

- `App/PravasApp` — SwiftUI frontend with Start Trip, Signal Inbox, Timeline, Recap, and Signals tabs.
- `Sources/PravasCore` — backend-style functions for timeline inference, API access, trip drafts, dashboard persistence, recap publishing, and local on-device planning.
- `Tests/PravasCoreTests` — Swift tests for inference rules, trip planning, recap generation, and on-disk persistence.

## App architecture

The app uses `PravasCore` as its backend boundary:

- `LocalTimelineBackend` runs the AI-ready timeline grouping on-device for demos and offline use.
- `RemoteTimelineBackend` can call the existing Node API (`/api/integrations`, `/api/demo/timeline`, and `/api/signals`) when a hosted backend is configured.
- `TimelineInferenceEngine` mirrors the website proof: Apple Photos + Gmail + Maps infer a hotel stay, while Maps + card charge infer a restaurant visit.
- `TripPlanner` converts reviewed signal inbox items into a `TripDashboard`, excludes rejected signals, creates share links for public trips, and publishes recap highlights.
- `TripStore` persists trip drafts and generated dashboards in the app documents directory so the app can restore state on launch.

## Product flow

1. Start a trip with dates, destination, friends, and private/shareable visibility.
2. Review passive signals in the inbox; approve, hide, keep pending, or add a manual moment.
3. Generate the timeline from approved and pending signals using the local Swift backend.
4. Publish a recap with a share URL and generated highlights.
5. Inspect consented signal sources and switch to the remote backend when a hosted API is available.

## Open in Xcode

1. Open Xcode 16 or newer.
2. Create a new iOS App project named `PravasApp` with an iOS 17+ deployment target.
3. Add the `ios` folder as a local Swift package dependency so the app can import `PravasCore`.
4. Drag the files in `ios/App/PravasApp` into the app target.
5. Run on an iOS 17+ simulator.

## Run tests

```bash
cd ios
swift test
```

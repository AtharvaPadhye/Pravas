# Pravas iOS app

This folder contains the first native iOS implementation of the Pravas product proof. It translates the current website flow into a SwiftUI app and moves the backend timeline inference into reusable Swift code.

## What is included

- `App/PravasApp` — SwiftUI frontend with Start Trip, Timeline, and Signals tabs.
- `Sources/PravasCore` — backend-style functions for timeline inference, API access, trip drafts, data models, and a local on-device backend.
- `Tests/PravasCoreTests` — Swift tests for the inference rules used by the iOS backend.

## App architecture

The app uses `PravasCore` as its backend boundary:

- `LocalTimelineBackend` runs the AI-ready timeline grouping on-device for demos and offline use.
- `RemoteTimelineBackend` can call the existing Node API (`/api/integrations`, `/api/demo/timeline`, and `/api/signals`) when a hosted backend is configured.
- `TimelineInferenceEngine` mirrors the website proof: Apple Photos + Gmail + Maps infer a hotel stay, while Maps + card charge infer a restaurant visit.

## Open in Xcode

1. Open Xcode 16 or newer.
2. Create a new iOS App project named `PravasApp`.
3. Add the `ios` folder as a local Swift package dependency so the app can import `PravasCore`.
4. Drag the files in `ios/App/PravasApp` into the app target.
5. Run on an iOS 17+ simulator.

## Run tests

```bash
cd ios
swift test
```

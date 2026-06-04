import SwiftUI
import PravasCore

struct StartTripView: View {
    @EnvironmentObject private var model: AppModel
    @State private var friendName = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    HeroCard(
                        eyebrow: "No manual logging",
                        title: "Create the shared travel hub before anyone packs.",
                        body: "Set the destination, invite friends, and decide whether your dashboard stays private or becomes a polished share link."
                    )

                    VStack(alignment: .leading, spacing: 16) {
                        Text("Trip builder")
                            .font(.title2.bold())
                        TextField("Trip name", text: $model.draft.name)
                            .textFieldStyle(.roundedBorder)
                        TextField("Destination", text: $model.draft.destination)
                            .textFieldStyle(.roundedBorder)
                        DatePicker("Starts", selection: $model.draft.startsAt, displayedComponents: .date)
                        DatePicker("Ends", selection: $model.draft.endsAt, displayedComponents: .date)

                        Picker("Visibility", selection: $model.draft.visibility) {
                            ForEach(TripVisibility.allCases, id: \.self) { visibility in
                                Text(visibility.displayName).tag(visibility)
                            }
                        }
                        .pickerStyle(.segmented)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Invite friends")
                                .font(.headline)
                            FlowLayout(items: model.draft.invitedFriends) { friend in
                                Text(friend)
                                    .font(.caption.weight(.semibold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(.orange.opacity(0.14), in: Capsule())
                            }
                            HStack {
                                TextField("Add a friend", text: $friendName)
                                    .textFieldStyle(.roundedBorder)
                                Button("Add") {
                                    model.addFriend(named: friendName)
                                    friendName = ""
                                }
                            }
                        }

                        Button {
                            Task { await model.createTrip() }
                        } label: {
                            Label("Create trip", systemImage: "plus.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)

                        Text(model.statusMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(20)
                    .background(.background, in: RoundedRectangle(cornerRadius: 28))
                    .shadow(color: .black.opacity(0.08), radius: 24, y: 10)
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Pravas")
        }
    }
}

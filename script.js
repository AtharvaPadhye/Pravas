const livePill = document.querySelector(".live-pill");

if (livePill) {
  const updateLivePulse = () => {
    livePill.animate(
      [
        {
          transform: "scale(1)",
          boxShadow: "0 0 0 0 rgba(15, 118, 110, 0.24)",
        },
        {
          transform: "scale(1.04)",
          boxShadow: "0 0 0 12px rgba(15, 118, 110, 0)",
        },
      ],
      {
        duration: 1600,
        easing: "ease-out",
      },
    );
  };

  updateLivePulse();
  window.setInterval(updateLivePulse, 2600);
}

const tripNameInput = document.querySelector("#trip-name");
const builderTitle = document.querySelector(".builder-header h2");
const addFriendButton = document.querySelector(".add-friend-button");
const inviteComposer = document.querySelector(".invite-composer");
const draftPill = document.querySelector(".draft-pill");
const privacyInputs = document.querySelectorAll('input[name="visibility"]');
const suggestedFriends = ["Ari", "Sam", "Priya", "Jules"];
let suggestedFriendIndex = 0;

if (tripNameInput && builderTitle) {
  tripNameInput.addEventListener("input", () => {
    builderTitle.textContent = tripNameInput.value.trim() || "Untitled trip";
  });
}

if (addFriendButton && inviteComposer) {
  addFriendButton.addEventListener("click", () => {
    const friendChip = document.createElement("span");
    friendChip.className = "friend-chip";
    friendChip.textContent = suggestedFriends[suggestedFriendIndex];
    suggestedFriendIndex = (suggestedFriendIndex + 1) % suggestedFriends.length;
    inviteComposer.insertBefore(friendChip, addFriendButton);
  });
}

if (draftPill && privacyInputs.length) {
  privacyInputs.forEach((input, index) => {
    input.addEventListener("change", () => {
      draftPill.textContent = index === 0 ? "Private draft" : "Shareable draft";
    });
  });
}

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

const tripBuilderForm = document.querySelector("#trip-builder-form");
const tripNameInput = document.querySelector("#trip-name");
const tripStartInput = document.querySelector("#trip-start");
const tripEndInput = document.querySelector("#trip-end");
const builderTitle = document.querySelector(".builder-header h2");
const addFriendButton = document.querySelector(".add-friend-button");
const friendNameInput = document.querySelector("#friend-name");
const friendList = document.querySelector(".friend-list");
const draftPill = document.querySelector(".draft-pill");
const privacyInputs = document.querySelectorAll('input[name="visibility"]');
const tripSubmit = document.querySelector(".trip-submit");
const tripBuilderStatus = document.querySelector("#trip-builder-status");
const draftPreview = document.querySelector("#draft-preview");
const previewName = document.querySelector("#preview-name");
const previewDates = document.querySelector("#preview-dates");
const previewFriends = document.querySelector("#preview-friends");
const previewVisibility = document.querySelector("#preview-visibility");
const previewLink = document.querySelector("#preview-link");

const defaultFriends = ["Maya", "Leo", "Nora"];
let invitedFriends = [...defaultFriends];

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Choose dates";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getVisibility = () => {
  const selected = document.querySelector('input[name="visibility"]:checked');
  return selected?.value || "private";
};

const getShareUrl = (tripName) => {
  const slug = (tripName || "untitled-trip")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `https://pravas.app/t/${slug || "untitled-trip"}`;
};

const setStatus = (message, type = "info") => {
  if (!tripBuilderStatus) {
    return;
  }

  tripBuilderStatus.textContent = message;
  tripBuilderStatus.dataset.type = type;
};

const updateBuilderTitle = () => {
  if (!tripNameInput || !builderTitle) {
    return;
  }

  builderTitle.textContent = tripNameInput.value.trim() || "Untitled trip";
};

const updateVisibilityUI = () => {
  if (!draftPill) {
    return;
  }

  const visibility = getVisibility();
  draftPill.textContent =
    visibility === "private" ? "Private draft" : "Shareable draft";

  privacyInputs.forEach((input) => {
    input
      .closest(".privacy-option")
      ?.classList.toggle("is-selected", input.checked);
  });
};

const renderFriends = () => {
  if (!friendList) {
    return;
  }

  friendList.innerHTML = "";

  invitedFriends.forEach((friend, index) => {
    const chip = document.createElement("button");
    chip.className = "friend-chip";
    chip.type = "button";
    chip.dataset.friendIndex = String(index);
    chip.setAttribute("aria-label", `Remove ${friend} from this trip`);
    chip.innerHTML = `<span>${friend}</span><span aria-hidden="true">×</span>`;
    friendList.append(chip);
  });
};

const addFriend = () => {
  if (!friendNameInput) {
    return;
  }

  const nextFriend = friendNameInput.value.trim();

  if (!nextFriend) {
    setStatus("Type a friend's name before adding them.", "error");
    friendNameInput.focus();
    return;
  }

  const alreadyInvited = invitedFriends.some(
    (friend) => friend.toLowerCase() === nextFriend.toLowerCase(),
  );

  if (alreadyInvited) {
    setStatus(`${nextFriend} is already invited.`, "error");
    friendNameInput.select();
    return;
  }

  invitedFriends.push(nextFriend);
  friendNameInput.value = "";
  renderFriends();
  setStatus(`${nextFriend} was added to the draft.`, "success");
  friendNameInput.focus();
};

const removeFriend = (index) => {
  const [removedFriend] = invitedFriends.splice(index, 1);
  renderFriends();
  setStatus(`${removedFriend} was removed from the invite list.`, "info");
};

const validateTrip = () => {
  if (!tripNameInput?.value.trim()) {
    setStatus("Add a trip name to create a draft.", "error");
    tripNameInput?.focus();
    return false;
  }

  if (!tripStartInput?.value || !tripEndInput?.value) {
    setStatus("Choose both start and end dates.", "error");
    (!tripStartInput?.value ? tripStartInput : tripEndInput)?.focus();
    return false;
  }

  if (tripEndInput.value < tripStartInput.value) {
    setStatus("The trip end date must be after the start date.", "error");
    tripEndInput.focus();
    return false;
  }

  return true;
};

const updateDraftPreview = (draft) => {
  if (!draftPreview) {
    return;
  }

  previewName.textContent = draft.name;
  previewDates.textContent = `${formatDate(draft.startsAt)} → ${formatDate(
    draft.endsAt,
  )}`;
  previewFriends.textContent = draft.friends.length
    ? draft.friends.join(", ")
    : "No friends invited yet";
  previewVisibility.textContent =
    draft.visibility === "private"
      ? "Private trip · invited travelers can view and add moments"
      : "Shareable link · read-only dashboard is ready for followers";

  if (draft.visibility === "shareable") {
    previewLink.hidden = false;
    previewLink.href = draft.shareUrl;
    previewLink.textContent = draft.shareUrl;
  } else {
    previewLink.hidden = true;
    previewLink.removeAttribute("href");
    previewLink.textContent = "";
  }

  draftPreview.hidden = false;
};

if (tripBuilderForm) {
  renderFriends();
  updateBuilderTitle();
  updateVisibilityUI();

  tripNameInput?.addEventListener("input", updateBuilderTitle);
  privacyInputs.forEach((input) =>
    input.addEventListener("change", updateVisibilityUI),
  );

  addFriendButton?.addEventListener("click", addFriend);
  friendNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFriend();
    }
  });

  friendList?.addEventListener("click", (event) => {
    const chip = event.target.closest(".friend-chip");

    if (!chip) {
      return;
    }

    removeFriend(Number(chip.dataset.friendIndex));
  });

  tripBuilderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateTrip()) {
      return;
    }

    const tripDraft = {
      name: tripNameInput.value.trim(),
      startsAt: tripStartInput.value,
      endsAt: tripEndInput.value,
      friends: [...invitedFriends],
      visibility: getVisibility(),
      createdAt: new Date().toISOString(),
    };

    tripDraft.shareUrl =
      tripDraft.visibility === "shareable" ? getShareUrl(tripDraft.name) : "";

    window.localStorage.setItem("pravasTripDraft", JSON.stringify(tripDraft));
    updateDraftPreview(tripDraft);
    setStatus("Trip draft created and saved in this browser.", "success");

    tripSubmit.textContent = "Draft saved";
    window.setTimeout(() => {
      tripSubmit.textContent = "Create trip draft";
    }, 1800);
  });
}

const TRIP_DRAFT_STORAGE_KEY = "pravasTripDraft";

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

const dashboardCard = document.querySelector("#home-trip-dashboard");
const dashboardName = document.querySelector("[data-dashboard-name]");
const dashboardSummary = document.querySelector("[data-dashboard-summary]");
const dashboardPill = document.querySelector("[data-dashboard-pill]");
const dashboardDays = document.querySelector("[data-dashboard-days]");
const dashboardFriends = document.querySelector("[data-dashboard-friends]");
const dashboardVisibility = document.querySelector("[data-dashboard-visibility]");
const dashboardDateLabel = document.querySelector("[data-dashboard-date-label]");
const dashboardDateDetail = document.querySelector("[data-dashboard-date-detail]");
const dashboardCrew = document.querySelector("[data-dashboard-crew]");
const dashboardShare = document.querySelector("[data-dashboard-share]");
const yourTripsGrid = document.querySelector("[data-your-trips]");
const emptyYourTrips = document.querySelector("[data-empty-your-trips]");
const yourTripCount = document.querySelector("[data-your-trip-count]");
const friendTripsGrid = document.querySelector("[data-friend-trips]");
const friendTripCount = document.querySelector("[data-friend-trip-count]");

const defaultFriends = ["Maya", "Leo", "Nora"];
let invitedFriends = [...defaultFriends];

const friendTrips = [
  {
    name: "Maya's Kyoto spring",
    owner: "Maya Chen",
    startsAt: "2026-04-08",
    endsAt: "2026-04-15",
    friends: ["Ari", "Sam", "Priya"],
    visibility: "shareable",
    status: "Live now",
    highlight: "Tea houses, temple walks, and a cherry blossom food crawl.",
  },
  {
    name: "Leo's Patagonia trek",
    owner: "Leo Martinez",
    startsAt: "2026-11-03",
    endsAt: "2026-11-12",
    friends: ["Nora", "Ben"],
    visibility: "private",
    status: "Planning",
    highlight: "Shared prep list for refugios, viewpoints, and rest days.",
  },
  {
    name: "Nora's New Orleans eats",
    owner: "Nora Patel",
    startsAt: "2026-07-18",
    endsAt: "2026-07-21",
    friends: ["Maya", "Leo", "You"],
    visibility: "shareable",
    status: "Shared",
    highlight: "A long weekend dashboard for jazz clubs and dinner plans.",
  },
];

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

const getTripLength = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) {
    return 0;
  }

  const start = new Date(`${startsAt}T00:00:00`);
  const end = new Date(`${endsAt}T00:00:00`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((end - start) / millisecondsPerDay) + 1;

  return Math.max(days, 1);
};

const getStoredTripDraft = () => {
  const storedDraft = window.localStorage.getItem(TRIP_DRAFT_STORAGE_KEY);

  if (!storedDraft) {
    return null;
  }

  try {
    return JSON.parse(storedDraft);
  } catch {
    window.localStorage.removeItem(TRIP_DRAFT_STORAGE_KEY);
    return null;
  }
};

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getTripDateRange = (trip) =>
  `${formatDate(trip.startsAt)} → ${formatDate(trip.endsAt)}`;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
    setStatus("Add a trip name to create your trip.", "error");
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

const createDashboardTripCard = (trip, options = {}) => {
  const tripLength = getTripLength(trip.startsAt, trip.endsAt);
  const friendCount = trip.friends?.length || 0;
  const card = document.createElement("article");
  card.className = `dashboard-trip-card${
    options.isOwner ? " is-owner-trip" : ""
  }`;

  const visibilityLabel =
    trip.visibility === "shareable" ? "Shareable" : "Private";
  const peopleLabel = trip.friends?.length
    ? trip.friends.join(", ")
    : "No friends invited yet";
  const ownerLabel = options.isOwner
    ? "Created by you"
    : `Shared by ${trip.owner}`;
  const statusLabel = options.isOwner
    ? trip.visibility === "shareable"
      ? "Shared"
      : "Private"
    : trip.status;

  const safeTripName = escapeHtml(trip.name);

  card.innerHTML = `
    <div class="dashboard-trip-card-header">
      <div>
        <span>${escapeHtml(ownerLabel)}</span>
        <h3>${safeTripName}</h3>
      </div>
      <strong>${escapeHtml(statusLabel)}</strong>
    </div>
    <p>${escapeHtml(
      trip.highlight || "Your itinerary, invite list, and trip dates are ready.",
    )}</p>
    <div class="dashboard-trip-meta" aria-label="${safeTripName} trip details">
      <span>${escapeHtml(pluralize(tripLength, "day"))}</span>
      <span>${escapeHtml(pluralize(friendCount, "friend"))}</span>
      <span>${escapeHtml(visibilityLabel)}</span>
    </div>
    <div class="dashboard-trip-detail">
      <span>Dates</span>
      <strong>${escapeHtml(getTripDateRange(trip))}</strong>
    </div>
    <div class="dashboard-trip-detail">
      <span>Travel crew</span>
      <strong>${escapeHtml(peopleLabel)}</strong>
    </div>
  `;

  if (options.isOwner && trip.shareUrl) {
    const link = document.createElement("a");
    link.className = "dashboard-share-link";
    link.href = trip.shareUrl;
    link.textContent = `Share dashboard: ${trip.shareUrl}`;
    card.append(link);
  }

  return card;
};

const renderDashboardPage = () => {
  if (!yourTripsGrid && !friendTripsGrid) {
    return;
  }

  const tripDraft = getStoredTripDraft();

  if (yourTripsGrid) {
    if (tripDraft) {
      emptyYourTrips?.remove();
      yourTripsGrid.prepend(
        createDashboardTripCard(tripDraft, { isOwner: true }),
      );
    }

    if (yourTripCount) {
      yourTripCount.textContent = pluralize(tripDraft ? 1 : 0, "trip");
    }
  }

  if (friendTripsGrid) {
    friendTripsGrid.innerHTML = "";
    friendTrips.forEach((trip) => {
      friendTripsGrid.append(createDashboardTripCard(trip));
    });
  }

  if (friendTripCount) {
    friendTripCount.textContent = pluralize(friendTrips.length, "trip");
  }
};

const renderHomeDashboard = () => {
  if (!dashboardCard) {
    return;
  }

  const tripDraft = getStoredTripDraft();

  if (!tripDraft) {
    return;
  }

  const tripLength = getTripLength(tripDraft.startsAt, tripDraft.endsAt);
  const friendCount = tripDraft.friends?.length || 0;
  const visibilityLabel =
    tripDraft.visibility === "shareable" ? "Shared" : "Private";
  const crewLabel = friendCount
    ? tripDraft.friends.join(", ")
    : "No friends invited yet";

  dashboardCard.classList.add("has-created-trip");
  dashboardName.textContent = tripDraft.name;
  dashboardSummary.textContent = `${pluralize(tripLength, "day")} · ${pluralize(
    friendCount,
    "friend",
  )}`;
  dashboardPill.textContent = "Created";
  dashboardDays.textContent = String(tripLength);
  dashboardFriends.textContent = String(friendCount);
  dashboardVisibility.textContent = visibilityLabel;
  dashboardDateLabel.textContent = "Trip dates";
  dashboardDateDetail.textContent = `${formatDate(tripDraft.startsAt)} → ${formatDate(
    tripDraft.endsAt,
  )}`;
  dashboardCrew.textContent = crewLabel;

  if (tripDraft.shareUrl) {
    dashboardShare.hidden = false;
    dashboardShare.href = tripDraft.shareUrl;
    dashboardShare.textContent = `Share dashboard: ${tripDraft.shareUrl}`;
  } else {
    dashboardShare.hidden = true;
    dashboardShare.removeAttribute("href");
    dashboardShare.textContent = "";
  }
};

renderHomeDashboard();
renderDashboardPage();

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

    window.localStorage.setItem(
      TRIP_DRAFT_STORAGE_KEY,
      JSON.stringify(tripDraft),
    );
    updateDraftPreview(tripDraft);
    setStatus("Trip created. Opening your dashboard…", "success");

    tripSubmit.textContent = "Opening dashboard";
    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 650);
  });
}

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
const tripAiDetails = document.querySelector("[data-trip-ai-details]");
const tripAiTitle = document.querySelector("[data-trip-ai-title]");
const tripAiSummary = document.querySelector("[data-trip-ai-summary]");
const tripAiSignals = document.querySelector("[data-trip-ai-signals]");
const tripAiHotels = document.querySelector("[data-trip-ai-hotels]");
const tripAiRestaurants = document.querySelector("[data-trip-ai-restaurants]");
const tripAiSights = document.querySelector("[data-trip-ai-sights]");
const tripAiMoments = document.querySelector("[data-trip-ai-moments]");
const tripAiClose = document.querySelector("[data-trip-ai-close]");
const dashboardTripsById = new Map();

const defaultFriends = ["Maya", "Leo", "Nora"];
let invitedFriends = [...defaultFriends];

const friendTrips = [
  {
    name: "Lisbon product proof",
    owner: "Pravas AI Backend",
    startsAt: "2026-05-02",
    endsAt: "2026-05-02",
    friends: ["Apple Photos", "Google Maps", "Gmail", "Credit Card"],
    visibility: "shareable",
    status: "Auto-captured",
    highlight: "No manual logging: passive signals prove a hotel stay, restaurant visit, and Day 1 timeline.",
    aiDetails: {
      summary:
        "Pravas AI fused Apple Photos, Google Maps, Gmail reservations, and a card charge into a Lisbon Day 1 timeline without a traveler typing a journal entry.",
      hotels: [
        "Apple Photos detected: Alfama · geo-tagged media cluster at 9:08 AM",
        "Gmail found: Memmo Alfama booking · confirmation MAL-4921",
        "Google Maps dwell: overnight stay started at Memmo Alfama",
      ],
      restaurants: [
        "Maps visited: Time Out Market · 68 minute dwell in Cais do Sodré",
        "Card charge: €42.10 restaurant · matched to Time Out Market",
      ],
      sights: [
        "Alfama neighborhood · inferred from photo location and hotel reservation",
        "Cais do Sodré · inferred from maps visit and restaurant charge",
      ],
      moments: [
        "AI generated: Day 1 timeline from five passive travel signals.",
        "Stayed at Memmo Alfama because reservation and overnight movement data agree.",
        "Ate at Time Out Market because map dwell and card charge matched the same place.",
      ],
    },
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
    aiDetails: {
      summary:
        "Pravas AI is ready to turn Leo's check-ins, trail logs, and shared prep notes into a trek dossier.",
      hotels: [
        "Hotel Las Torres Patagonia · planned arrival base",
        "Refugio Grey · reserved glacier-side overnight",
        "EcoCamp Patagonia · planned recovery night after the loop",
      ],
      restaurants: [
        "Base camp boxed lunches · trail meal plan",
        "Cervecería Baguales · Puerto Natales celebration dinner",
        "The Singular Restaurant · post-trek seafood reservation",
      ],
      sights: [
        "Mirador Base Torres · sunrise objective",
        "Grey Glacier lookout · boat and hike day",
        "French Valley · weather-dependent viewpoint",
      ],
      moments: [
        "AI will summarize GPS breadcrumbs into daily mileage and elevation notes.",
        "Packing messages are being organized into a shared gear checklist.",
        "Weather alerts and rest-day notes will be attached to the live itinerary.",
      ],
    },
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
    aiDetails: {
      summary:
        "Pravas AI turned Nora's saved places into an eats-first New Orleans weekend guide.",
      hotels: [
        "Hotel Peter & Paul · Marigny check-in",
        "The Chloe · Uptown pool afternoon saved as a stop",
      ],
      restaurants: [
        "Café du Monde · beignets after the riverfront walk",
        "Turkey and the Wolf · lunch pin from Leo",
        "Compère Lapin · dinner reservation and shared notes",
      ],
      sights: [
        "Frenchmen Street · jazz-club route",
        "Garden District · self-guided architecture walk",
        "City Park · sculpture garden and coffee detour",
      ],
      moments: [
        "AI grouped every restaurant receipt into a 'best bites' list.",
        "Late-night music venues were pulled from calendar holds and chat mentions.",
        "Photo locations became a shareable map of the weekend's favorite corners.",
      ],
    },
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

const getSlug = (value, fallback = "untitled-trip") => {
  const slug = (value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
};

const getTripId = (trip, prefix) => `${prefix}-${getSlug(trip.name)}`;

const getDefaultAiDetails = (trip) => ({
  summary: `Pravas AI is collecting ${trip.name}'s app signals, movement data, reservations, card charges, and optional notes into one live trip story.`,
  hotels: [
    "Arrival hotel · inferred when reservation data matches overnight movement dwell",
    "Second stay · saved automatically when maps, photos, or booking data agree",
  ],
  restaurants: [
    "First dinner · card merchant and map dwell become a meal recap",
    "Cafe stop · mapped from location history and photo timestamps",
    "Celebration meal · reservation, spend, and favorites grouped automatically",
  ],
  sights: [
    "Opening viewpoint · photos will be clustered into a highlight card",
    "Neighborhood walk · map pins and captions will become a route",
    "Final-day landmark · AI will keep tips for the next traveler",
  ],
  moments: [
    "As the trip happens, AI turns passive signals into a chronological travel log.",
    "Restaurants, hotels, and sightseeing stops are grouped by category automatically.",
    "Manual notes remain optional review context instead of required logging.",
  ],
});

const getAiDetails = (trip) => trip.aiDetails || getDefaultAiDetails(trip);

const renderListItems = (list, items) => {
  if (!list) {
    return;
  }

  list.innerHTML = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
};

const openTripAiDetails = (tripId) => {
  const trip = dashboardTripsById.get(tripId);

  if (!trip || !tripAiDetails) {
    return;
  }

  const details = getAiDetails(trip);
  const tripLength = getTripLength(trip.startsAt, trip.endsAt);

  tripAiTitle.textContent = trip.name;
  tripAiSummary.textContent = details.summary;
  tripAiSignals.innerHTML = [
    getTripDateRange(trip),
    pluralize(tripLength, "day"),
    pluralize(details.hotels.length, "hotel"),
    pluralize(details.restaurants.length, "restaurant"),
    pluralize(details.sights.length, "sight"),
  ]
    .map((signal) => `<span>${escapeHtml(signal)}</span>`)
    .join("");

  renderListItems(tripAiHotels, details.hotels);
  renderListItems(tripAiRestaurants, details.restaurants);
  renderListItems(tripAiSights, details.sights);

  if (tripAiMoments) {
    tripAiMoments.innerHTML = details.moments
      .map((moment) => `<li>${escapeHtml(moment)}</li>`)
      .join("");
  }

  tripAiDetails.hidden = false;
  tripAiDetails.scrollIntoView({ behavior: "smooth", block: "start" });
};

const closeTripAiDetails = () => {
  if (tripAiDetails) {
    tripAiDetails.hidden = true;
  }
};

const getVisibility = () => {
  const selected = document.querySelector('input[name="visibility"]:checked');
  return selected?.value || "private";
};

const getShareUrl = (tripName) =>
  `https://pravas.app/t/${getSlug(tripName)}`;

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

  if (options.tripId) {
    card.dataset.tripId = options.tripId;
  }

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
    <button class="dashboard-trip-open" type="button" data-trip-detail-trigger>
      View AI trip details
    </button>
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
  dashboardTripsById.clear();

  if (yourTripsGrid) {
    if (tripDraft) {
      const tripId = getTripId(tripDraft, "your");
      dashboardTripsById.set(tripId, tripDraft);
      emptyYourTrips?.remove();
      yourTripsGrid.prepend(
        createDashboardTripCard(tripDraft, { isOwner: true, tripId }),
      );
    }

    if (yourTripCount) {
      yourTripCount.textContent = pluralize(tripDraft ? 1 : 0, "trip");
    }
  }

  if (friendTripsGrid) {
    friendTripsGrid.innerHTML = "";
    friendTrips.forEach((trip) => {
      const tripId = getTripId(trip, "friend");
      dashboardTripsById.set(tripId, trip);
      friendTripsGrid.append(createDashboardTripCard(trip, { tripId }));
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

[yourTripsGrid, friendTripsGrid].forEach((grid) => {
  grid?.addEventListener("click", (event) => {
    const card = event.target.closest(".dashboard-trip-card");

    if (!card || event.target.closest("a")) {
      return;
    }

    openTripAiDetails(card.dataset.tripId);
  });
});

tripAiClose?.addEventListener("click", closeTripAiDetails);

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
    setStatus("Trip created. Opening Step 02 so you can add moments…", "success");

    tripSubmit.textContent = "Opening Step 02";
    window.setTimeout(() => {
      window.location.href = "move-naturally.html";
    }, 650);
  });
}

const TRIP_MOMENTS_STORAGE_KEY = "pravasTripMoments";
const momentCaptureForm = document.querySelector("#moment-capture-form");
const momentTripTitle = document.querySelector("[data-moment-trip-title]");
const momentCount = document.querySelector("[data-moment-count]");
const noTripCallout = document.querySelector("[data-no-trip-callout]");
const momentTypeInput = document.querySelector("#moment-type");
const momentTitleInput = document.querySelector("#moment-title");
const momentPlaceInput = document.querySelector("#moment-place");
const momentTimeInput = document.querySelector("#moment-time");
const momentNoteInput = document.querySelector("#moment-note");
const momentCaptureStatus = document.querySelector("#moment-capture-status");
const momentTimeline = document.querySelector("[data-moment-timeline]");
const quickMomentButtons = document.querySelectorAll("[data-quick-moment]");
const recapTitle = document.querySelector("[data-recap-title]");
const recapTripLabel = document.querySelector("[data-recap-trip-label]");
const recapSummary = document.querySelector("[data-recap-summary]");
const recapDays = document.querySelector("[data-recap-days]");
const recapPlaces = document.querySelector("[data-recap-places]");
const recapFriends = document.querySelector("[data-recap-friends]");
const recapBestList = document.querySelector("[data-recap-best-list]");
const recapFollowup = document.querySelector("[data-recap-followup]");
const recapTimeline = document.querySelector("[data-recap-timeline]");
const copyRecapButton = document.querySelector("[data-copy-recap]");
const recapStatus = document.querySelector("[data-recap-status]");

const momentTemplates = {
  hotel: {
    title: "Checked into the Ace Hotel",
    place: "Portland",
    note: "Reservation confirmed and the lobby coffee bar is worth saving.",
  },
  restaurant: {
    title: "Dinner at Kann",
    place: "Southeast Portland",
    note: "Add to best bites: smoky mushrooms, plantains, and a table everyone loved.",
  },
  sight: {
    title: "Walked the Japanese Garden",
    place: "Washington Park",
    note: "Quiet morning stop with the best group photo of the day.",
  },
  activity: {
    title: "Sunset bike ride",
    place: "Waterfront Park",
    note: "Easy loop, golden-hour skyline, and a route worth recommending.",
  },
};

const momentIcons = {
  hotel: "🏨",
  restaurant: "🍽️",
  sight: "📍",
  activity: "✨",
};

const getStoredMoments = () => {
  const storedMoments = window.localStorage.getItem(TRIP_MOMENTS_STORAGE_KEY);

  if (!storedMoments) {
    return [];
  }

  try {
    const moments = JSON.parse(storedMoments);
    return Array.isArray(moments) ? moments : [];
  } catch {
    window.localStorage.removeItem(TRIP_MOMENTS_STORAGE_KEY);
    return [];
  }
};

const saveStoredMoments = (moments) => {
  window.localStorage.setItem(TRIP_MOMENTS_STORAGE_KEY, JSON.stringify(moments));
};

const getMomentDateTimeValue = (tripDraft) => {
  const date = tripDraft?.startsAt || new Date().toISOString().slice(0, 10);
  return `${date}T09:00`;
};

const setMomentStatus = (message, type = "info") => {
  if (!momentCaptureStatus) {
    return;
  }

  momentCaptureStatus.textContent = message;
  momentCaptureStatus.dataset.type = type;
};

const formatMomentDay = (dateTime) => {
  if (!dateTime) {
    return "Unscheduled";
  }

  return formatDate(dateTime.slice(0, 10));
};

const formatMomentTime = (dateTime) => {
  if (!dateTime) {
    return "Anytime";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
};

const getMomentsForCurrentTrip = () => {
  const tripDraft = getStoredTripDraft();
  const moments = getStoredMoments();

  if (!tripDraft) {
    return [];
  }

  const tripSlug = getSlug(tripDraft.name);
  return moments.filter((moment) => moment.tripSlug === tripSlug);
};

const renderMomentTimeline = () => {
  if (!momentTimeline) {
    return;
  }

  const tripMoments = getMomentsForCurrentTrip().sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime),
  );

  if (momentCount) {
    momentCount.textContent = pluralize(tripMoments.length, "moment");
  }

  if (!tripMoments.length) {
    momentTimeline.innerHTML = `
      <div class="timeline-empty">
        <p>Add your first hotel, meal, sight, or activity and Pravas will start sorting the trip by day.</p>
      </div>
    `;
    return;
  }

  const momentsByDay = tripMoments.reduce((groups, moment) => {
    const day = formatMomentDay(moment.dateTime);
    groups[day] = groups[day] || [];
    groups[day].push(moment);
    return groups;
  }, {});

  momentTimeline.innerHTML = Object.entries(momentsByDay)
    .map(
      ([day, moments]) => `
        <section class="timeline-day" aria-label="${escapeHtml(day)} moments">
          <h3>${escapeHtml(day)}</h3>
          ${moments
            .map(
              (moment) => `
                <article class="moment-row">
                  <span class="moment-icon" aria-hidden="true">${momentIcons[moment.type] || "✦"}</span>
                  <div>
                    <h4>${escapeHtml(moment.title)}</h4>
                    <p>${escapeHtml(moment.place)} · ${escapeHtml(moment.note || "Ready for photos, receipts, and group notes.")}</p>
                  </div>
                  <span class="moment-time-label">${escapeHtml(formatMomentTime(moment.dateTime))}</span>
                </article>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");
};

const initializeMomentPage = () => {
  if (!momentCaptureForm && !momentTimeline) {
    return;
  }

  const tripDraft = getStoredTripDraft();

  if (momentTripTitle) {
    momentTripTitle.textContent = tripDraft?.name || "Plan a trip first";
  }

  if (noTripCallout) {
    noTripCallout.hidden = Boolean(tripDraft);
  }

  if (momentTimeInput && !momentTimeInput.value) {
    momentTimeInput.value = getMomentDateTimeValue(tripDraft);
  }

  renderMomentTimeline();
};

const applyMomentTemplate = (type) => {
  const template = momentTemplates[type];

  if (!template) {
    return;
  }

  if (momentTypeInput) {
    momentTypeInput.value = type;
  }
  if (momentTitleInput) {
    momentTitleInput.value = template.title;
  }
  if (momentPlaceInput) {
    momentPlaceInput.value = template.place;
  }
  if (momentNoteInput) {
    momentNoteInput.value = template.note;
  }

  momentTitleInput?.focus();
};

quickMomentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyMomentTemplate(button.dataset.quickMoment);
  });
});

momentCaptureForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const tripDraft = getStoredTripDraft();

  if (!tripDraft) {
    setMomentStatus("Create a trip first so this moment has somewhere to live.", "error");
    return;
  }

  if (!momentTitleInput?.value.trim() || !momentPlaceInput?.value.trim()) {
    setMomentStatus("Add what happened and where it happened.", "error");
    (!momentTitleInput?.value.trim() ? momentTitleInput : momentPlaceInput)?.focus();
    return;
  }

  const moments = getStoredMoments();
  const moment = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tripSlug: getSlug(tripDraft.name),
    type: momentTypeInput?.value || "activity",
    title: momentTitleInput.value.trim(),
    place: momentPlaceInput.value.trim(),
    dateTime: momentTimeInput?.value || getMomentDateTimeValue(tripDraft),
    note: momentNoteInput?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };

  moments.push(moment);
  saveStoredMoments(moments);
  renderMomentTimeline();
  setMomentStatus(`${moment.title} was added to the trip timeline.`, "success");
  applyMomentTemplate(moment.type);
});

const getRecapUrl = (tripDraft) =>
  tripDraft?.shareUrl || `https://pravas.app/recap/${getSlug(tripDraft?.name)}`;

const renderRecapPage = () => {
  if (!recapTitle) {
    return;
  }

  const tripDraft = getStoredTripDraft();
  const tripMoments = getMomentsForCurrentTrip().sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime),
  );
  const uniquePlaces = new Set(tripMoments.map((moment) => moment.place));

  if (!tripDraft) {
    if (recapBestList) {
      recapBestList.innerHTML = `<li>Start a trip and add a few moments to generate the best-of list.</li>`;
    }
    if (recapTimeline) {
      recapTimeline.innerHTML = `<li>Your day-by-day recap will appear here.</li>`;
    }
    return;
  }

  const tripLength = getTripLength(tripDraft.startsAt, tripDraft.endsAt);
  const friendCount = tripDraft.friends?.length || 0;
  const recapUrl = getRecapUrl(tripDraft);

  recapTripLabel.textContent = tripDraft.visibility === "shareable" ? "Shareable recap" : "Private recap";
  recapTitle.textContent = `${tripDraft.name} recap`;
  recapSummary.textContent = tripMoments.length
    ? `${pluralize(tripMoments.length, "moment")} from ${tripDraft.name} are organized into a polished story for the crew.`
    : "Add moments during the trip and Pravas will transform them into a polished story for the crew.";
  recapDays.textContent = String(tripLength);
  recapPlaces.textContent = String(uniquePlaces.size);
  recapFriends.textContent = String(friendCount);

  if (recapBestList) {
    const bestMoments = tripMoments.slice(0, 5);
    recapBestList.innerHTML = bestMoments.length
      ? bestMoments
          .map((moment) => `<li>${escapeHtml(moment.title)} · ${escapeHtml(moment.place)}</li>`)
          .join("")
      : `<li>Add a restaurant, sight, or activity in Step 02 to create recommendations.</li>`;
  }

  if (recapFollowup) {
    const friends = friendCount ? tripDraft.friends.join(", ") : "your invited travelers";
    recapFollowup.textContent = `Send ${friends} one link after the trip: ${recapUrl}. They can revisit favorite stops, copy recommendations, and keep the shared memory in one place.`;
  }

  if (recapTimeline) {
    recapTimeline.innerHTML = tripMoments.length
      ? tripMoments
          .slice(0, 6)
          .map(
            (moment) =>
              `<li>${escapeHtml(formatMomentDay(moment.dateTime))}: ${escapeHtml(moment.title)}</li>`,
          )
          .join("")
      : `<li>Add moments in Step 02 and the recap timeline will build itself.</li>`;
  }
};

copyRecapButton?.addEventListener("click", async () => {
  const tripDraft = getStoredTripDraft();

  if (!tripDraft) {
    recapStatus.textContent = "Start a trip before copying a recap link.";
    recapStatus.dataset.type = "error";
    return;
  }

  const recapUrl = getRecapUrl(tripDraft);

  try {
    await navigator.clipboard.writeText(recapUrl);
    recapStatus.textContent = "Recap link copied for your follow-up message.";
    recapStatus.dataset.type = "success";
  } catch {
    recapStatus.textContent = `Copy this recap link: ${recapUrl}`;
    recapStatus.dataset.type = "info";
  }
});

initializeMomentPage();
renderRecapPage();

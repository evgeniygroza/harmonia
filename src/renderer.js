const audio = document.getElementById("audio");
const root = document.documentElement;
const appShell = document.getElementById("appShell");
const licenseGate = document.getElementById("licenseGate");
const licenseGateForm = document.getElementById("licenseGateForm");
const licenseGateInput = document.getElementById("licenseGateInput");
const licenseGateSubmit = document.getElementById("licenseGateSubmit");
const licenseGateMessage = document.getElementById("licenseGateMessage");
const viewRoot = document.getElementById("viewRoot");
const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");
const topbarControls = document.getElementById("topbarControls");
const backButton = document.getElementById("backButton");
const globalSearch = document.getElementById("globalSearch");
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const navGroupToggles = Array.from(document.querySelectorAll("[data-sidebar-toggle]"));
const themeIconImages = Array.from(document.querySelectorAll("[data-theme-icon='app']"));
const toast = document.getElementById("toast");

const panelFavorite = document.getElementById("panelFavorite");
const panelCover = document.getElementById("panelCover");
const panelTitle = document.getElementById("panelTitle");
const panelArtist = document.getElementById("panelArtist");
const panelAlbum = document.getElementById("panelAlbum");
const panelQuality = document.getElementById("panelQuality");
const panelCurrentTime = document.getElementById("panelCurrentTime");
const panelDuration = document.getElementById("panelDuration");
const panelProgressFill = document.getElementById("panelProgressFill");
const panelInfoBody = document.getElementById("panelInfoBody");
const showCurrentInFinder = document.getElementById("showCurrentInFinder");
const miniHealthScore = document.getElementById("miniHealthScore");

const barCover = document.getElementById("barCover");
const barTitle = document.getElementById("barTitle");
const barArtist = document.getElementById("barArtist");
const barQuality = document.getElementById("barQuality");
const playPauseButton = document.getElementById("playPauseButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const shuffleButton = document.getElementById("shuffleButton");
const repeatButton = document.getElementById("repeatButton");
const seekInput = document.getElementById("seekInput");
const currentTime = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const volumeInput = document.getElementById("volumeInput");
const outputStatus = document.getElementById("outputStatus");
const queueButton = document.getElementById("queueButton");

const VALID_VIEWS = new Set([
  "albums",
  "artists",
  "tracks",
  "genres",
  "composers",
  "years",
  "recentlyAdded",
  "recentlyPlayed",
  "favorites",
  "playlists",
  "health",
  "duplicates",
  "scanner",
  "general",
  "advanced"
]);

const VIEW_TITLES = {
  albums: "Albums",
  artists: "Artists",
  tracks: "Tracks",
  genres: "Genres",
  composers: "Composers",
  years: "Years",
  recentlyAdded: "Recently Added",
  recentlyPlayed: "Recently Played",
  favorites: "Favorites",
  playlists: "Playlists",
  health: "Library Health",
  duplicates: "Duplicates",
  scanner: "File Scanner",
  general: "General",
  advanced: "Advanced"
};

const fallbackApi = {
  loadLibrary: async () => ({ tracks: [], playlists: [], currentId: "" }),
  saveLibrary: async () => ({ ok: true }),
  saveLibrarySync: () => ({ ok: true }),
  chooseLibraryFolder: async () => ({ ok: false, canceled: true }),
  scanLibrary: async () => ({ ok: false, reason: "electron-api-unavailable" }),
  cancelLibraryScan: async () => ({ ok: false }),
  getTracks: async () => [],
  getLibraryStats: async () => null,
  getProblemTracks: async () => [],
  getPotentialDuplicates: async () => [],
  showItemInFolder: async () => ({ ok: false }),
  activateLicense: async () => ({ success: false, code: "SERVER_ERROR", message: "Server unavailable" }),
  validateLicense: async () => ({ success: false, code: "SERVER_ERROR", message: "Server unavailable" }),
  getLicenseState: async () => ({ active: false, status: "inactive" }),
  setAppIconTheme: async () => ({ ok: false }),
  onFlacScanProgress: () => {},
  onFlacScanComplete: () => {},
  onImportedTracks: () => {},
  onDroppedFiles: () => {},
  onPlaybackCommand: () => {},
  onOpenSettings: () => {},
  supportedExtensions: async () => ["FLAC", "MP3", "M4A", "WAV", "OGG"]
};

const api = window.playerApi || fallbackApi;
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_OPTIONS = new Set(["dark", "light", "system"]);
const ACCENT_COLORS = {
  graphite: {
    label: "Graphite",
    dark: { hex: "#a8adb5", rgb: "168, 173, 181" },
    light: { hex: "#666d76", rgb: "102, 109, 118" }
  },
  blue: {
    label: "Blue",
    dark: { hex: "#0a84ff", rgb: "10, 132, 255" },
    light: { hex: "#007aff", rgb: "0, 122, 255" }
  },
  purple: {
    label: "Purple",
    dark: { hex: "#bf5af2", rgb: "191, 90, 242" },
    light: { hex: "#af52de", rgb: "175, 82, 222" }
  },
  pink: {
    label: "Pink",
    dark: { hex: "#ff375f", rgb: "255, 55, 95" },
    light: { hex: "#ff2d55", rgb: "255, 45, 85" }
  },
  red: {
    label: "Red",
    dark: { hex: "#ff453a", rgb: "255, 69, 58" },
    light: { hex: "#ff3b30", rgb: "255, 59, 48" }
  },
  orange: {
    label: "Orange",
    dark: { hex: "#ff9f0a", rgb: "255, 159, 10" },
    light: { hex: "#ff9500", rgb: "255, 149, 0" }
  },
  yellow: {
    label: "Yellow",
    dark: { hex: "#ffd60a", rgb: "255, 214, 10" },
    light: { hex: "#ffcc00", rgb: "255, 204, 0" }
  },
  green: {
    label: "Green",
    dark: { hex: "#30d158", rgb: "48, 209, 88" },
    light: { hex: "#34c759", rgb: "52, 199, 89" }
  }
};
const ACCENT_COLOR_OPTIONS = Object.entries(ACCENT_COLORS).map(([value, color]) => [value, color.label]);
const SIDEBAR_GROUP_VIEWS = {
  collection: new Set(["genres", "composers", "years", "recentlyAdded", "recentlyPlayed"]),
  tools: new Set(["health", "duplicates", "scanner"])
};

function normalizedTheme(value) {
  return THEME_OPTIONS.has(value) ? value : "dark";
}

function normalizedAccentColor(value) {
  return ACCENT_COLORS[value] ? value : "graphite";
}

function normalizedRepeatMode(value) {
  return value === "one" ? "one" : "off";
}

function normalizedView(value) {
  if (value === "accent") {
    return "general";
  }
  return VALID_VIEWS.has(value) ? value : "albums";
}

const state = {
  view: normalizedView(localStorage.getItem("workspaceView")),
  resolvedTheme: "",
  query: "",
  pendingQuery: "",
  tracks: [],
  scannedTracks: [],
  libraryStats: null,
  problemTracks: [],
  duplicateGroups: [],
  playlists: readJson("playlists", []),
  favoriteTracks: new Set(readJson("favoriteTracks", [])),
  favoriteAlbums: new Set(readJson("favoriteAlbums", [])),
  recentPlays: readJson("recentPlays", []),
  reviewedDuplicates: new Set(readJson("reviewedDuplicates", [])),
  sidebarGroups: {
    collection: readJson("sidebarGroups", {}).collection === true,
    tools: readJson("sidebarGroups", {}).tools === true
  },
  settings: {
    theme: normalizedTheme(readJson("settings", {}).theme),
    accentColor: normalizedAccentColor(readJson("settings", {}).accentColor),
    startup: readJson("settings", {}).startup || "restore"
  },
  license: {
    active: false,
    status: "inactive",
    licenseType: "",
    activationsAllowed: 0,
    activationsUsed: 0,
    activatedAt: "",
    lastValidatedAt: "",
    maskedLicenseKey: "",
    offline: false
  },
  gate: {
    status: "checking",
    message: "Checking access key...",
    key: ""
  },
  albumDetailKey: "",
  artistDetailKey: "",
  playlistDetailId: "",
  activeFilter: null,
  selectedTrackId: "",
  albumLayout: localStorage.getItem("albumLayout") || "grid",
  albumSort: localStorage.getItem("albumSort") || "recent",
  trackSort: localStorage.getItem("trackSort") || "title",
  trackSortDirection: localStorage.getItem("trackSortDirection") || "asc",
  queueIds: readJson("queueIds", []),
  currentIndex: -1,
  isPlaying: false,
  isSeeking: false,
  isImporting: false,
  isRestoring: false,
  shuffle: localStorage.getItem("shuffle") === "true",
  repeat: normalizedRepeatMode(localStorage.getItem("repeat")),
  scan: {
    running: false,
    rootPath: "",
    selectedPath: "",
    phase: "",
    processed: 0,
    total: 0,
    failed: 0,
    discoveredFiles: 0,
    currentPath: "",
    completedAt: "",
    error: ""
  }
};

let persistTimer = 0;
let queryTimer = 0;
let toastTimer = 0;
let renderFrame = 0;
let scanRenderTimer = 0;
let lastVisibleTrackIds = [];

audio.volume = Number(localStorage.getItem("volume") || 0.8);
volumeInput.value = String(audio.volume);

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveSettings() {
  writeJson("settings", state.settings);
}

function saveCollections() {
  writeJson("playlists", state.playlists);
  writeJson("favoriteTracks", Array.from(state.favoriteTracks));
  writeJson("favoriteAlbums", Array.from(state.favoriteAlbums));
  writeJson("recentPlays", state.recentPlays);
  writeJson("reviewedDuplicates", Array.from(state.reviewedDuplicates));
  writeJson("queueIds", state.queueIds);
}

function librarySnapshot() {
  return {
    currentId: getCurrentTrack()?.id || "",
    tracks: state.tracks,
    playlists: state.playlists
  };
}

function persistLibraryNow() {
  saveCollections();
  window.clearTimeout(persistTimer);

  if (state.isRestoring) {
    return Promise.resolve({ ok: false, reason: "restoring" });
  }

  return api.saveLibrary(librarySnapshot()).catch(() => ({ ok: false }));
}

function persistLibrarySync() {
  saveCollections();
  window.clearTimeout(persistTimer);

  if (state.isRestoring) {
    return { ok: false, reason: "restoring" };
  }

  return api.saveLibrarySync?.(librarySnapshot()) || { ok: false };
}

function persistLibrarySoon() {
  saveCollections();
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => persistLibraryNow(), 220);
}

function scheduleRender() {
  if (renderFrame) {
    return;
  }

  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

function makeNode(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function iconButton(label, pathData, className = "icon-button") {
  const button = makeNode("button", className);
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${pathData}</svg>`;
  return button;
}

const ICON_PLAY = '<path d="M8 5v14l11-7L8 5Z"></path>';
const ICON_PAUSE = '<path d="M8 5h3v14H8zM13 5h3v14h-3z"></path>';
const ICON_HEART = '<path d="M12 21s-7-4.35-9.2-8.45C1 9.2 3.3 5 7.1 5c2.1 0 3.6 1.2 4.9 2.7C13.3 6.2 14.8 5 16.9 5c3.8 0 6.1 4.2 4.3 7.55C19 16.65 12 21 12 21Z"></path>';
const ICON_FOLDER = '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z"></path><path d="M9 13h6"></path>';
const ICON_EDIT = '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path>';

function normalized(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function readable(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function getTitle(track) {
  return readable(track?.title || track?.fileName, "Untitled Track");
}

function getArtist(track) {
  return readable(track?.artist, "Unknown Artist");
}

function getAlbum(track) {
  return readable(track?.album, "Unknown Album");
}

function getGenre(track) {
  const value = Array.isArray(track?.genre) ? track.genre[0] : track?.genre;
  return readable(value, "Unknown Genre");
}

function getComposer(track) {
  return readable(track?.composer, "Unknown Composer");
}

function getYear(track) {
  const raw = track?.year || track?.date || "";
  const match = String(raw).match(/\d{4}/);
  return match ? match[0] : "Unknown Year";
}

function trackPath(track) {
  return track?.path || track?.absolutePath || track?.id || "";
}

function trackAddedAt(track) {
  return track?.addedAt || track?.lastScannedAt || track?.updatedAt || "";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = String(rounded % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0 min";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function formatSampleRate(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} kHz` : `${value} Hz`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function countLabel(count, singular = "track", plural = "tracks") {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function isProActive() {
  return state.license.active === true;
}

function licenseStatusLabel() {
  if (state.license.active && state.license.offline) {
    return "Active / offline grace";
  }
  return state.license.active ? "Active" : "Inactive";
}

function activationErrorMessage(result) {
  return ({
    INVALID_LICENSE: "Invalid license key",
    ACTIVATION_LIMIT_REACHED: "Activation limit reached",
    REVOKED_LICENSE: "License revoked",
    SERVER_ERROR: "Server unavailable"
  })[result?.code] || result?.message || "Server unavailable";
}

function trackQualityLabel(track) {
  const parts = [track?.extension || "FLAC"];
  if (track?.bitDepth) {
    parts.push(`${track.bitDepth}-bit`);
  }
  if (track?.sampleRate) {
    parts.push(formatSampleRate(track.sampleRate));
  }
  return parts.join(" / ");
}

function stableHash(seed) {
  let hash = 2166136261;
  const text = String(seed || "Harmonia");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function coverColors(seed) {
  const hue = stableHash(seed) % 360;
  return {
    a: `hsl(${hue} 42% 34%)`,
    b: `hsl(${(hue + 44) % 360} 38% 58%)`,
    c: `hsl(${(hue + 118) % 360} 42% 28%)`
  };
}

function coverInitials(primary, secondary = "") {
  const words = `${primary || ""} ${secondary || ""}`.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "H";
  }
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function createCover({ imageUrl = "", title = "", subtitle = "", seed = "", className = "cover" }) {
  const cover = makeNode("div", className);
  const colors = coverColors(seed || `${title} ${subtitle}`);
  cover.style.setProperty("--cover-a", colors.a);
  cover.style.setProperty("--cover-b", colors.b);
  cover.style.setProperty("--cover-c", colors.c);

  if (imageUrl) {
    const image = new Image();
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.src = imageUrl;
    image.addEventListener("error", () => {
      image.remove();
      cover.textContent = coverInitials(title, subtitle);
      cover.classList.add("fallback");
    }, { once: true });
    cover.append(image);
  } else {
    cover.classList.add("fallback");
    cover.textContent = coverInitials(title, subtitle);
  }

  return cover;
}

function applyCoverToBox(box, track, fallbackTitle = "H") {
  const title = track ? getTitle(track) : fallbackTitle;
  const artist = track ? getArtist(track) : "";
  const colors = coverColors(`${title} ${artist}`);
  box.style.setProperty("--cover-a", colors.a);
  box.style.setProperty("--cover-b", colors.b);
  box.style.setProperty("--cover-c", colors.c);
  box.style.backgroundImage = "";
  box.textContent = track ? coverInitials(title, artist) : "H";

  if (track?.artworkUrl) {
    box.textContent = "";
    box.style.backgroundImage = `url("${track.artworkUrl}")`;
  }
}

function normalizeTrack(track) {
  const path = trackPath(track);
  const id = track?.id || path;
  return {
    ...track,
    id,
    path,
    url: track?.url || (path ? `file://${path}` : ""),
    title: getTitle(track),
    artist: track?.artist || "",
    album: track?.album || "",
    genre: Array.isArray(track?.genre) ? track.genre[0] || "" : track?.genre || "",
    composer: Array.isArray(track?.composer) ? track.composer.join(", ") : track?.composer || "",
    year: track?.year || "",
    date: track?.date || "",
    tagEdited: track?.tagEdited === true,
    fileSize: Number(track?.fileSize || 0),
    extension: track?.extension || (path.split(".").pop() || "FLAC").toUpperCase(),
    addedAt: trackAddedAt(track) || new Date().toISOString()
  };
}

function playableTrackFromScan(track) {
  return normalizeTrack({
    ...track,
    id: track.absolutePath,
    path: track.absolutePath,
    url: track.url,
    source: "flac-scan",
    title: track.title || track.fileName,
    artist: track.artist || "",
    album: track.album || "",
    extension: "FLAC",
    folder: track.folderPath,
    artworkUrl: track.artworkUrl || "",
    artworkMime: track.artworkMime || "",
    addedAt: track.lastScannedAt || track.updatedAt || new Date().toISOString()
  });
}

function mergeTracks(incomingTracks) {
  if (!Array.isArray(incomingTracks) || incomingTracks.length === 0) {
    return 0;
  }

  const byId = new Map(state.tracks.map((track, index) => [track.id, index]));
  let added = 0;

  for (const rawTrack of incomingTracks) {
    const track = normalizeTrack(rawTrack);
    if (!track.id) {
      continue;
    }

    const index = byId.get(track.id);
    if (index === undefined) {
      byId.set(track.id, state.tracks.length);
      state.tracks.push(track);
      added += 1;
      continue;
    }

    const existing = state.tracks[index];
    const preservesEditedTags = existing.tagEdited === true;
    state.tracks[index] = {
      ...state.tracks[index],
      ...track,
      genre: preservesEditedTags ? existing.genre : track.genre,
      composer: preservesEditedTags ? existing.composer : track.composer,
      year: preservesEditedTags ? existing.year : track.year,
      date: preservesEditedTags ? existing.date : track.date,
      tagEdited: preservesEditedTags || track.tagEdited === true,
      artworkUrl: existing.artworkUrl || track.artworkUrl || "",
      artworkPath: existing.artworkPath || track.artworkPath || "",
      addedAt: existing.addedAt || track.addedAt
    };
  }

  if (state.currentIndex === -1 && state.tracks.length > 0) {
    state.currentIndex = 0;
    loadCurrentTrack(false, false);
  }

  if (added > 0) {
    persistLibraryNow();
  } else {
    persistLibrarySoon();
  }
  scheduleRender();
  renderPlayer();
  return added;
}

function removeUnavailableScannedTracks(rootPath, playableTracks) {
  if (!rootPath) {
    return;
  }
  const playablePaths = new Set(playableTracks.map((track) => track.path));
  state.tracks = state.tracks.filter((track) => {
    const path = trackPath(track);
    const isScanned = track.source === "flac-scan" || path.toLowerCase().endsWith(".flac");
    return !isScanned || !path.startsWith(rootPath) || playablePaths.has(path);
  });
}

function applyScannedPayload(payload) {
  state.scannedTracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
  state.libraryStats = payload?.stats || state.libraryStats;
  state.problemTracks = Array.isArray(payload?.problemTracks) ? payload.problemTracks : [];
  state.duplicateGroups = Array.isArray(payload?.duplicateGroups) ? payload.duplicateGroups : [];

  const playableTracks = state.scannedTracks
    .filter((track) => track.scanStatus !== "error")
    .map(playableTrackFromScan);

  removeUnavailableScannedTracks(payload?.rootPath || "", playableTracks);
  mergeTracks(playableTracks);
}

function trackMatchesQuery(track, query = state.query) {
  if (!query) {
    return true;
  }
  const haystack = [
    getTitle(track),
    getArtist(track),
    getAlbum(track),
    getGenre(track),
    getComposer(track),
    getYear(track),
    track.extension,
    track.path
  ].map(normalized).join(" ");
  return haystack.includes(normalized(query));
}

function trackMatchesFilter(track) {
  if (!state.activeFilter) {
    return true;
  }
  const { type, value } = state.activeFilter;
  if (type === "genre") {
    return getGenre(track) === value;
  }
  if (type === "composer") {
    return getComposer(track) === value;
  }
  if (type === "year") {
    return getYear(track) === value;
  }
  if (type === "issue") {
    const flags = track.qualityFlags || problemFlagsForPath(track.path);
    return Boolean(flags?.[value]);
  }
  return true;
}

function problemFlagsForPath(path) {
  const problem = state.problemTracks.find((track) => track.absolutePath === path || track.path === path);
  return problem?.qualityFlags || {};
}

function getFilteredTracks(source = state.tracks) {
  return source.filter((track) => trackMatchesQuery(track) && trackMatchesFilter(track));
}

function albumKey(track) {
  return [
    normalized(getAlbum(track)),
    normalized(getArtist(track)),
    normalized(track.album ? "" : track.folder || track.path)
  ].join("|");
}

function getAlbums(source = state.tracks) {
  const groups = new Map();
  for (const track of source) {
    const key = albumKey(track);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: getAlbum(track),
        artist: getArtist(track),
        year: getYear(track),
        genre: getGenre(track),
        tracks: [],
        duration: 0,
        size: 0,
        addedAt: trackAddedAt(track),
        artworkTrack: track.artworkUrl ? track : null
      });
    }
    const album = groups.get(key);
    album.tracks.push(track);
    album.duration += Number(track.duration || 0);
    album.size += Number(track.fileSize || 0);
    if (!album.artworkTrack && track.artworkUrl) {
      album.artworkTrack = track;
    }
    if (!album.addedAt || trackAddedAt(track) > album.addedAt) {
      album.addedAt = trackAddedAt(track);
    }
  }

  const albums = Array.from(groups.values()).map((album) => {
    album.tracks.sort(compareByTrackNumber);
    album.artworkTrack ||= album.tracks[0] || null;
    return album;
  });

  albums.sort((a, b) => {
    if (state.albumSort === "artist") {
      return a.artist.localeCompare(b.artist, undefined, { numeric: true }) || a.title.localeCompare(b.title, undefined, { numeric: true });
    }
    if (state.albumSort === "release") {
      return String(b.year).localeCompare(String(a.year), undefined, { numeric: true }) || a.title.localeCompare(b.title, undefined, { numeric: true });
    }
    if (state.albumSort === "recent") {
      return String(b.addedAt).localeCompare(String(a.addedAt));
    }
    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });

  return albums;
}

function compareByTrackNumber(a, b) {
  const left = Number.isFinite(a.trackNumber) ? a.trackNumber : 9999;
  const right = Number.isFinite(b.trackNumber) ? b.trackNumber : 9999;
  return left - right || getTitle(a).localeCompare(getTitle(b), undefined, { numeric: true });
}

function getArtists(source = state.tracks) {
  return groupTracks(source, getArtist, "artist").sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}

function groupTracks(source, getValue, type) {
  const groups = new Map();
  for (const track of source) {
    const title = getValue(track);
    const key = `${type}:${normalized(title)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        type,
        title,
        tracks: [],
        albums: new Set(),
        duration: 0,
        artworkTrack: track.artworkUrl ? track : null
      });
    }
    const group = groups.get(key);
    group.tracks.push(track);
    group.albums.add(albumKey(track));
    group.duration += Number(track.duration || 0);
    if (!group.artworkTrack && track.artworkUrl) {
      group.artworkTrack = track;
    }
  }
  return Array.from(groups.values());
}

function getCurrentTrack() {
  return state.tracks[state.currentIndex] || null;
}

function setView(view) {
  if (!isProActive()) {
    showLicenseGate("Enter a valid access key to continue.");
    return;
  }
  if (!VALID_VIEWS.has(view)) {
    return;
  }
  state.view = view;
  state.albumDetailKey = "";
  state.artistDetailKey = "";
  state.playlistDetailId = "";
  state.activeFilter = null;
  localStorage.setItem("workspaceView", view);
  viewRoot.scrollTop = 0;
  render();
}

function goBack() {
  if (state.albumDetailKey) {
    state.albumDetailKey = "";
  } else if (state.artistDetailKey) {
    state.artistDetailKey = "";
  } else if (state.playlistDetailId) {
    state.playlistDetailId = "";
  } else if (state.activeFilter) {
    state.activeFilter = null;
  }
  render();
}

function render() {
  updateTheme();
  renderLicenseGate();
  if (!isProActive()) {
    return;
  }
  updateSidebar();
  updateHeader();
  viewRoot.replaceChildren();
  topbarControls.replaceChildren();

  if (state.albumDetailKey) {
    renderAlbumDetail();
  } else if (state.artistDetailKey) {
    renderArtistDetail();
  } else if (state.playlistDetailId) {
    renderPlaylistDetail();
  } else {
    renderCurrentView();
  }

  renderPlayer();
  renderNowPanel();
  updateActiveTrackRows();
}

function showLicenseGate(message = "Enter your access key to unlock Harmonia.") {
  state.gate.status = state.gate.status === "validating" ? "validating" : "idle";
  state.gate.message = message;
  renderLicenseGate();
}

function hideLicenseGate() {
  state.gate.status = "unlocked";
  state.gate.key = "";
  state.gate.message = "";
  renderLicenseGate();
}

function renderLicenseGate() {
  const unlocked = isProActive();
  const checking = state.gate.status === "checking";
  document.body.classList.toggle("license-loading", checking && !unlocked);
  document.body.classList.toggle("license-pending", !checking && !unlocked);
  document.body.classList.toggle("license-unlocked", unlocked);

  if (appShell) {
    appShell.hidden = !unlocked;
    appShell.setAttribute("aria-hidden", String(!unlocked));
  }

  if (!licenseGate || !licenseGateForm || !licenseGateInput || !licenseGateSubmit || !licenseGateMessage) {
    return;
  }

  licenseGate.hidden = unlocked || checking;
  licenseGate.setAttribute("aria-hidden", String(unlocked || checking));
  licenseGateForm.hidden = checking;
  licenseGateInput.disabled = state.gate.status === "validating";
  licenseGateSubmit.disabled = state.gate.status === "validating";
  licenseGateSubmit.textContent = state.gate.status === "validating" ? "Checking..." : "Unlock";
  licenseGateMessage.textContent = state.gate.message || "Enter your access key to unlock Harmonia.";

  if (!unlocked && document.activeElement === document.body && state.gate.status !== "checking") {
    licenseGateInput.focus();
  }
}

function updateTheme() {
  const resolved = state.settings.theme === "system"
    ? systemPrefersDark.matches ? "dark" : "light"
    : normalizedTheme(state.settings.theme);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  applyAccentColor(resolved);
  updateThemeIcons(resolved);
  notifyAppIconTheme(resolved);
}

function applyAccentColor(theme) {
  const selected = ACCENT_COLORS[normalizedAccentColor(state.settings.accentColor)];
  const color = selected[theme === "light" ? "light" : "dark"];
  root.dataset.accent = normalizedAccentColor(state.settings.accentColor);
  root.style.setProperty("--accent", color.hex);
  root.style.setProperty("--accent-rgb", color.rgb);
  root.style.setProperty("--accent-soft", `rgba(${color.rgb}, ${theme === "light" ? "0.14" : "0.16"})`);
}

function updateThemeIcons(theme) {
  const iconPath = theme === "light" ? "./brand-icon-light.png" : "./brand-icon.png";
  for (const image of themeIconImages) {
    if (image.getAttribute("src") !== iconPath) {
      image.setAttribute("src", iconPath);
    }
  }
}

function notifyAppIconTheme(theme) {
  if (state.resolvedTheme === theme) {
    return;
  }

  state.resolvedTheme = theme;
  api.setAppIconTheme?.(theme).catch(() => {});
}

function updateSidebar() {
  for (const item of navItems) {
    const active = item.dataset.view === state.view || (item.dataset.view === "general" && state.view === "advanced");
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  }

  for (const toggle of navGroupToggles) {
    const group = toggle.dataset.sidebarToggle;
    const containsActiveView = SIDEBAR_GROUP_VIEWS[group]?.has(state.view) === true;
    const expanded = state.sidebarGroups[group] === true || containsActiveView;
    const section = toggle.closest(".nav-group");
    const panel = document.querySelector(`[data-sidebar-panel="${group}"]`);
    toggle.setAttribute("aria-expanded", String(expanded));
    section?.classList.toggle("expanded", expanded);
    if (panel) {
      panel.hidden = !expanded;
    }
  }
}

function updateHeader() {
  const detailTitle = detailViewTitle();
  viewTitle.textContent = detailTitle || VIEW_TITLES[state.view] || "Library";
  viewSubtitle.textContent = subtitleForCurrentView();
  backButton.hidden = !(state.albumDetailKey || state.artistDetailKey || state.playlistDetailId || state.activeFilter);
}

function detailViewTitle() {
  if (state.albumDetailKey) {
    return getAlbums().find((album) => album.key === state.albumDetailKey)?.title || "Album";
  }
  if (state.artistDetailKey) {
    return getArtists().find((artist) => artist.key === state.artistDetailKey)?.title || "Artist";
  }
  if (state.playlistDetailId) {
    return state.playlists.find((playlist) => playlist.id === state.playlistDetailId)?.title || "Playlist";
  }
  return "";
}

function subtitleForCurrentView() {
  const albums = getAlbums(state.tracks);
  const totalSize = state.tracks.reduce((sum, track) => sum + Number(track.fileSize || 0), 0);
  if (state.activeFilter) {
    return `${state.activeFilter.label} / ${countLabel(getFilteredTracks().length)}`;
  }
  if (state.albumDetailKey) {
    const album = getAlbums().find((item) => item.key === state.albumDetailKey);
    return album ? `${album.artist} / ${countLabel(album.tracks.length)} / ${formatDuration(album.duration)}` : "";
  }
  if (state.artistDetailKey) {
    const artist = getArtists().find((item) => item.key === state.artistDetailKey);
    return artist ? `${countLabel(artist.albums.size, "album", "albums")} / ${countLabel(artist.tracks.length)}` : "";
  }
  if (state.view === "albums") {
    return `${countLabel(albums.length, "album", "albums")} / ${countLabel(state.tracks.length)} / ${formatBytes(totalSize)}`;
  }
  if (state.view === "tracks") {
    return `${countLabel(getFilteredTracks().length)} in library`;
  }
  if (state.view === "health") {
    return healthScoreText().subtitle;
  }
  if (state.view === "scanner") {
    return state.scan.running ? "Scanning your lossless library" : "Choose a folder and scan local FLAC files";
  }
  return `${countLabel(state.tracks.length)} / ${countLabel(albums.length, "album", "albums")}`;
}

function renderCurrentView() {
  switch (state.view) {
    case "albums":
      renderAlbums();
      break;
    case "artists":
      renderArtists();
      break;
    case "tracks":
      renderTracks();
      break;
    case "genres":
      renderFacetCards("genre", getGenre, "Genre");
      break;
    case "composers":
      renderFacetCards("composer", getComposer, "Composer");
      break;
    case "years":
      renderFacetCards("year", getYear, "Year");
      break;
    case "recentlyAdded":
      renderRecentlyAdded();
      break;
    case "recentlyPlayed":
      renderRecentlyPlayed();
      break;
    case "favorites":
      renderFavorites();
      break;
    case "playlists":
      renderPlaylists();
      break;
    case "health":
      renderHealth();
      break;
    case "duplicates":
      renderDuplicates();
      break;
    case "scanner":
      renderScanner();
      break;
    case "general":
    case "advanced":
      renderSettings(state.view);
      break;
    default:
      renderAlbums();
  }
}

function renderAlbums() {
  renderAlbumControls();
  const tracks = getFilteredTracks();
  const albums = getAlbums(tracks);

  if (albums.length === 0) {
    renderEmptyState({
      title: state.tracks.length ? "No albums match" : "Your library is quiet",
      message: state.tracks.length ? "Try a different search or clear the active filter." : "Scan a music folder to build your local lossless workspace.",
      actionLabel: "Scan Music Folder",
      action: () => setView("scanner")
    });
    return;
  }

  const grid = makeNode("div", state.albumLayout === "list" ? "album-list" : "album-grid");
  for (const album of albums) {
    grid.append(createAlbumCard(album));
  }
  viewRoot.append(grid);
}

function renderAlbumControls() {
  const layout = makeSegmented([
    ["grid", "Grid"],
    ["list", "List"]
  ], state.albumLayout, (value) => {
    state.albumLayout = value;
    localStorage.setItem("albumLayout", value);
    render();
  });
  const sort = makeSelect("Sort albums", [
    ["recent", "Recently Added"],
    ["release", "Release Date"],
    ["artist", "Artist"],
    ["title", "Title"]
  ], state.albumSort, (value) => {
    state.albumSort = value;
    localStorage.setItem("albumSort", value);
    render();
  });
  topbarControls.append(layout, sort);
}

function createAlbumCard(album) {
  const card = makeNode("button", "album-card");
  const cover = createCover({
    imageUrl: album.artworkTrack?.artworkUrl || "",
    title: album.title,
    subtitle: album.artist,
    seed: `${album.title} ${album.artist}`,
    className: "album-cover"
  });
  const title = makeNode("strong", "", album.title);
  const artist = makeNode("span", "", album.artist);
  const meta = makeNode("small", "", `${album.year} / ${countLabel(album.tracks.length)} / ${formatDuration(album.duration)}`);

  card.type = "button";
  card.classList.toggle("active", album.tracks.some((track) => getCurrentTrack()?.id === track.id));
  card.append(cover, title, artist, meta);
  card.addEventListener("click", () => {
    state.albumDetailKey = album.key;
    render();
  });
  card.addEventListener("dblclick", () => playAlbum(album));
  return card;
}

function renderAlbumDetail() {
  const album = getAlbums().find((item) => item.key === state.albumDetailKey);
  if (!album) {
    state.albumDetailKey = "";
    renderAlbums();
    return;
  }

  const detail = makeNode("div", "album-detail page-fade");
  const cover = createCover({
    imageUrl: album.artworkTrack?.artworkUrl || "",
    title: album.title,
    subtitle: album.artist,
    seed: `${album.title} ${album.artist}`,
    className: "detail-cover"
  });
  const hero = makeNode("section", "album-detail-hero glass-panel");
  const copy = makeNode("div", "detail-copy");
  const actions = makeNode("div", "action-row");
  const albumIsPlaying = isAlbumPlaying(album);
  const albumIsFavorite = state.favoriteAlbums.has(album.key);
  const play = iconButton(albumIsPlaying ? "Pause Album" : "Play Album", albumIsPlaying ? ICON_PAUSE : ICON_PLAY, "album-action-button album-play-action primary-action");
  const favorite = iconButton(
    albumIsFavorite ? "Remove from Favorites" : "Favorite",
    ICON_HEART,
    "album-action-button album-favorite-action secondary-action"
  );
  const finder = iconButton("Show in Finder", ICON_FOLDER, "album-action-button secondary-action");
  const tagRow = createChipRow([album.genre, trackQualityLabel(album.tracks[0]), formatBytes(album.size)].filter(Boolean));
  const editTags = iconButton("Edit album tags", ICON_EDIT, "chip-edit-button");

  play.classList.toggle("active", albumIsPlaying);
  favorite.classList.toggle("active", albumIsFavorite);
  play.addEventListener("click", () => toggleAlbumPlayback(album));
  favorite.addEventListener("click", () => toggleAlbumFavorite(album.key));
  finder.addEventListener("click", () => showPathInFinder(album.tracks[0]));
  editTags.addEventListener("click", () => openAlbumTagEditor(album));
  tagRow.append(editTags);

  copy.append(
    makeNode("span", "eyebrow", "Album"),
    makeNode("h2", "", album.title),
    makeNode("p", "", `${album.artist} / ${album.year} / ${countLabel(album.tracks.length)} / ${formatDuration(album.duration)}`),
    tagRow
  );
  actions.append(play, favorite, finder);
  copy.append(actions);
  hero.append(cover, copy);
  detail.append(hero, renderTrackTable(album.tracks, { compact: false, context: album.tracks }));
  viewRoot.append(detail);
}

function openAlbumTagEditor(album) {
  const overlay = makeNode("div", "modal-overlay");
  const dialog = makeNode("section", "tag-editor-modal glass-panel");
  const form = makeNode("form", "tag-editor-form");
  const genreInput = tagEditorInput("Genre", album.genre === "Unknown Genre" ? "" : album.genre, "Genre");
  const yearInput = tagEditorInput("Year", album.year === "Unknown Year" ? "" : album.year, "Year");
  const composerValue = getComposer(album.tracks.find((track) => getComposer(track) !== "Unknown Composer") || album.tracks[0]);
  const composerInput = tagEditorInput("Composer", composerValue === "Unknown Composer" ? "" : composerValue, "Composer");
  const cancel = makeNode("button", "secondary-action", "Cancel");
  const save = makeNode("button", "primary-action", "Save");
  const actions = makeNode("div", "tag-editor-actions");

  cancel.type = "button";
  save.type = "submit";
  cancel.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateAlbumTags(album.key, {
      genre: genreInput.querySelector("input").value.trim(),
      year: yearInput.querySelector("input").value.trim(),
      composer: composerInput.querySelector("input").value.trim()
    });
    overlay.remove();
  });

  actions.append(cancel, save);
  form.append(genreInput, yearInput, composerInput, actions);
  dialog.append(makeNode("h2", "", "Edit Album Tags"), makeNode("p", "", album.title), form);
  overlay.append(dialog);
  document.body.append(overlay);
  genreInput.querySelector("input").focus();
}

function tagEditorInput(label, value, placeholder) {
  const wrapper = makeNode("label", "tag-editor-field");
  const input = document.createElement("input");
  input.type = "text";
  input.value = value || "";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.spellcheck = false;
  wrapper.append(makeNode("span", "", label), input);
  return wrapper;
}

function updateAlbumTags(albumKeyValue, tags) {
  const safeYear = String(tags.year || "").match(/\d{4}/)?.[0] || "";
  for (const track of state.tracks) {
    if (albumKey(track) !== albumKeyValue) {
      continue;
    }
    track.genre = tags.genre || "";
    track.year = safeYear;
    track.date = safeYear;
    track.composer = tags.composer || "";
    track.tagEdited = true;
  }
  persistLibrarySoon();
  showToast("Album tags updated.");
  render();
}

function renderArtists() {
  const artists = getArtists(getFilteredTracks());
  if (artists.length === 0) {
    renderEmptyState({ title: "No artists found", message: "Artist names will appear after scanning tagged audio files.", actionLabel: "Scan Music Folder", action: () => setView("scanner") });
    return;
  }
  const grid = makeNode("div", "artist-grid");
  for (const artist of artists) {
    const card = makeNode("button", "artist-card glass-panel");
    const avatar = createCover({
      imageUrl: artist.artworkTrack?.artworkUrl || "",
      title: artist.title,
      subtitle: "",
      seed: artist.title,
      className: "artist-avatar"
    });
    card.type = "button";
    card.append(
      avatar,
      makeNode("strong", "", artist.title),
      makeNode("span", "", `${countLabel(artist.albums.size, "album", "albums")} / ${countLabel(artist.tracks.length)}`)
    );
    card.addEventListener("click", () => {
      state.artistDetailKey = artist.key;
      render();
    });
    grid.append(card);
  }
  viewRoot.append(grid);
}

function renderArtistDetail() {
  const artist = getArtists().find((item) => item.key === state.artistDetailKey);
  if (!artist) {
    state.artistDetailKey = "";
    renderArtists();
    return;
  }
  const albumKeys = new Set(artist.tracks.map(albumKey));
  const albums = getAlbums().filter((album) => albumKeys.has(album.key));
  const detail = makeNode("div", "artist-detail page-fade");
  const hero = makeNode("section", "artist-detail-hero glass-panel");
  const avatar = createCover({
    imageUrl: artist.artworkTrack?.artworkUrl || "",
    title: artist.title,
    seed: artist.title,
    className: "artist-avatar large"
  });
  const play = makeNode("button", "primary-action", "Play Artist");
  play.type = "button";
  play.addEventListener("click", () => playTrackList(artist.tracks));
  const copy = makeNode("div", "detail-copy");
  copy.append(makeNode("span", "eyebrow", "Artist"), makeNode("h2", "", artist.title), makeNode("p", "", `${countLabel(albums.length, "album", "albums")} / ${countLabel(artist.tracks.length)} / ${formatDuration(artist.duration)}`), play);
  hero.append(avatar, copy);
  const grid = makeNode("div", "album-grid");
  albums.forEach((album) => grid.append(createAlbumCard(album)));
  detail.append(hero, grid);
  viewRoot.append(detail);
}

function renderTracks(tracks = getFilteredTracks()) {
  renderTrackControls();
  if (tracks.length === 0) {
    renderEmptyState({ title: "No tracks found", message: "Search covers title, artist, album, genre, year and file path.", actionLabel: "Clear Search", action: clearSearchAndFilter });
    return;
  }
  viewRoot.append(renderTrackTable(sortTracks(tracks), { context: sortTracks(tracks) }));
}

function renderTrackControls() {
  const sort = makeSelect("Sort tracks", [
    ["title", "Title"],
    ["artist", "Artist"],
    ["album", "Album"],
    ["dateAdded", "Date Added"],
    ["duration", "Duration"]
  ], state.trackSort, (value) => {
    state.trackSort = value;
    localStorage.setItem("trackSort", value);
    render();
  });
  const direction = makeSegmented([
    ["asc", "Asc"],
    ["desc", "Desc"]
  ], state.trackSortDirection, (value) => {
    state.trackSortDirection = value;
    localStorage.setItem("trackSortDirection", value);
    render();
  });
  topbarControls.append(sort, direction);
}

function sortTracks(tracks) {
  const sorted = [...tracks].sort((a, b) => {
    let result = 0;
    if (state.trackSort === "artist") {
      result = getArtist(a).localeCompare(getArtist(b), undefined, { numeric: true });
    } else if (state.trackSort === "album") {
      result = getAlbum(a).localeCompare(getAlbum(b), undefined, { numeric: true }) || compareByTrackNumber(a, b);
    } else if (state.trackSort === "dateAdded") {
      result = String(trackAddedAt(a)).localeCompare(String(trackAddedAt(b)));
    } else if (state.trackSort === "duration") {
      result = Number(a.duration || 0) - Number(b.duration || 0);
    } else {
      result = getTitle(a).localeCompare(getTitle(b), undefined, { numeric: true });
    }
    return state.trackSortDirection === "desc" ? -result : result;
  });
  return sorted;
}

function renderTrackTable(tracks, { context = tracks } = {}) {
  lastVisibleTrackIds = context.map((track) => track.id);
  const table = makeNode("div", "track-table glass-panel");
  const header = makeNode("div", "track-row track-header");
  ["#", "Title", "Artist", "Album", "Duration", "Format", "Sample Rate", "Bit Depth", "Date Added"].forEach((label) => header.append(makeNode("span", "", label)));
  table.append(header);
  tracks.forEach((track, index) => table.append(createTrackRow(track, index, context)));
  return table;
}

function createTrackRow(track, index, context) {
  const row = makeNode("button", "track-row");
  row.type = "button";
  row.dataset.trackId = track.id;
  row.classList.toggle("active", getCurrentTrack()?.id === track.id);
  row.classList.toggle("selected", state.selectedTrackId === track.id);
  row.append(
    makeNode("span", "track-number", String(track.trackNumber || index + 1)),
    trackTitleCell(track),
    makeNode("span", "", getArtist(track)),
    makeNode("span", "", getAlbum(track)),
    makeNode("span", "", formatTime(track.duration)),
    makeNode("span", "", track.extension || "FLAC"),
    makeNode("span", "", formatSampleRate(track.sampleRate)),
    makeNode("span", "", track.bitDepth ? `${track.bitDepth}-bit` : "-"),
    makeNode("span", "", formatDate(trackAddedAt(track)))
  );
  row.addEventListener("click", () => {
    state.selectedTrackId = track.id;
    renderNowPanel();
    updateActiveTrackRows();
  });
  row.addEventListener("dblclick", () => playTrackById(track.id, context));
  return row;
}

function trackTitleCell(track) {
  const cell = makeNode("span", "track-title-cell");
  const fav = makeNode("span", state.favoriteTracks.has(track.id) ? "favorite-dot active" : "favorite-dot", "♥");
  cell.append(fav, makeNode("strong", "", getTitle(track)));
  return cell;
}

function renderFacetCards(type, getter, singular) {
  const groups = groupTracks(getFilteredTracks(), getter, type).sort((a, b) => {
    if (type === "year") {
      return String(b.title).localeCompare(String(a.title), undefined, { numeric: true });
    }
    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });
  if (groups.length === 0) {
    renderEmptyState({ title: `No ${singular.toLowerCase()} data`, message: "This section will fill in as metadata becomes available.", actionLabel: "Scan Music Folder", action: () => setView("scanner") });
    return;
  }
  const grid = makeNode("div", type === "year" ? "year-timeline" : "facet-grid");
  for (const group of groups) {
    const card = makeNode("button", `${type === "year" ? "year-card" : "facet-card"} glass-panel`);
    card.type = "button";
    card.append(
      makeNode("strong", "", group.title),
      makeNode("span", "", `${countLabel(group.albums.size, "album", "albums")} / ${countLabel(group.tracks.length)}`)
    );
    card.addEventListener("click", () => {
      state.activeFilter = { type, value: group.title, label: `${singular}: ${group.title}` };
      state.view = "tracks";
      render();
    });
    grid.append(card);
  }
  viewRoot.append(grid);
}

function renderRecentlyAdded() {
  const tracks = getFilteredTracks().sort((a, b) => String(trackAddedAt(b)).localeCompare(String(trackAddedAt(a)))).slice(0, 80);
  if (tracks.length === 0) {
    renderEmptyState({ title: "Nothing added yet", message: "Scanned and imported tracks will appear here by date.", actionLabel: "Scan Music Folder", action: () => setView("scanner") });
    return;
  }
  viewRoot.append(renderTrackTable(tracks, { context: tracks }));
}

function renderRecentlyPlayed() {
  const tracks = state.recentPlays
    .map((item) => state.tracks.find((track) => track.id === item.id))
    .filter(Boolean)
    .filter((track) => trackMatchesQuery(track));
  if (tracks.length === 0) {
    renderEmptyState({ title: "No playback history", message: "Play a track and it will join the last 50 plays here.", actionLabel: "Play First Track", action: () => playTrackList(getFilteredTracks()) });
    return;
  }
  viewRoot.append(renderTrackTable(tracks, { context: tracks }));
}

function renderFavorites() {
  const favoriteTracks = getFilteredTracks().filter((track) => state.favoriteTracks.has(track.id));
  const favoriteAlbumKeys = new Set(Array.from(state.favoriteAlbums));
  const favoriteAlbums = getAlbums(getFilteredTracks()).filter((album) => favoriteAlbumKeys.has(album.key));
  const screen = makeNode("div", "favorites-screen");
  if (favoriteAlbums.length > 0) {
    const section = makeNode("section", "stack-section");
    section.append(makeNode("h2", "", "Favorite Albums"));
    const grid = makeNode("div", "album-grid");
    favoriteAlbums.forEach((album) => grid.append(createAlbumCard(album)));
    section.append(grid);
    screen.append(section);
  }
  if (favoriteTracks.length > 0) {
    const section = makeNode("section", "stack-section");
    section.append(makeNode("h2", "", "Favorite Tracks"));
    section.append(renderTrackTable(favoriteTracks, { context: favoriteTracks }));
    screen.append(section);
  }
  if (!favoriteTracks.length && !favoriteAlbums.length) {
    renderEmptyState({ title: "No favorites yet", message: "Use the heart in Now Playing or album detail to build a personal shelf.", actionLabel: "Go to Albums", action: () => setView("albums") });
    return;
  }
  viewRoot.append(screen);
}

function renderPlaylists() {
  const screen = makeNode("div", "playlist-screen");
  screen.append(createPlaylistCreator());
  if (state.playlists.length === 0) {
    screen.append(createInlineEmpty("No playlists yet", "Create a playlist for local listening sessions."));
  } else {
    const grid = makeNode("div", "playlist-grid");
    for (const playlist of state.playlists) {
      grid.append(createPlaylistCard(playlist));
    }
    screen.append(grid);
  }
  viewRoot.append(screen);
}

function createPlaylistCreator() {
  const form = makeNode("form", "playlist-creator glass-panel");
  const input = document.createElement("input");
  const button = makeNode("button", "primary-action", "Create Playlist");
  input.placeholder = "Playlist name";
  input.spellcheck = false;
  button.type = "submit";
  form.append(input, button);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const playlist = {
      id: crypto.randomUUID(),
      title: input.value.trim() || "New Playlist",
      trackIds: []
    };
    state.playlists.unshift(playlist);
    state.playlistDetailId = playlist.id;
    persistLibrarySoon();
    render();
  });
  return form;
}

function createPlaylistCard(playlist) {
  const card = makeNode("button", "playlist-card glass-panel");
  const tracks = playlist.trackIds.map((id) => state.tracks.find((track) => track.id === id)).filter(Boolean);
  card.type = "button";
  card.append(
    createCover({ title: playlist.title, seed: playlist.title, className: "playlist-cover" }),
    makeNode("strong", "", playlist.title),
    makeNode("span", "", countLabel(tracks.length))
  );
  card.addEventListener("click", () => {
    state.playlistDetailId = playlist.id;
    render();
  });
  return card;
}

function renderPlaylistDetail() {
  const playlist = state.playlists.find((item) => item.id === state.playlistDetailId);
  if (!playlist) {
    state.playlistDetailId = "";
    renderPlaylists();
    return;
  }
  const screen = makeNode("div", "playlist-detail page-fade");
  const editor = makeNode("section", "playlist-editor glass-panel");
  const titleInput = document.createElement("input");
  titleInput.value = playlist.title;
  titleInput.addEventListener("input", () => {
    playlist.title = titleInput.value.trim() || "New Playlist";
    persistLibrarySoon();
    updateHeader();
  });
  const addCurrent = makeNode("button", "secondary-action", "Add Current Track");
  addCurrent.type = "button";
  addCurrent.addEventListener("click", () => {
    const track = getCurrentTrack() || selectedTrack();
    if (track && !playlist.trackIds.includes(track.id)) {
      playlist.trackIds.push(track.id);
      persistLibrarySoon();
      render();
    } else {
      showToast("Select or play a track first.");
    }
  });
  editor.append(createCover({ title: playlist.title, seed: playlist.title, className: "playlist-cover large" }), titleInput, addCurrent);
  screen.append(editor);
  const tracks = playlist.trackIds.map((id) => state.tracks.find((track) => track.id === id)).filter(Boolean);
  if (tracks.length) {
    screen.append(renderTrackTable(tracks, { context: tracks }));
  } else {
    screen.append(createInlineEmpty("No tracks in this playlist", "Use Add Current Track after selecting or playing something."));
  }
  viewRoot.append(screen);
}

function renderHealth() {
  const score = calculateHealthScore();
  const screen = makeNode("div", "health-screen page-fade");
  const hero = makeNode("section", "health-hero glass-panel");
  const scoreCard = makeNode("div", "health-score-card");
  scoreCard.append(makeNode("strong", "", score.label), makeNode("span", "", score.status));
  const action = makeNode("button", "primary-action", "Scan Library");
  action.type = "button";
  action.addEventListener("click", () => setView("scanner"));
  hero.append(scoreCard, makeNode("p", "", score.summary), action);

  const stats = statsForHealth();
  const cards = makeNode("div", "health-card-grid");
  [
    ["Cover Quality", `${stats.coveredTracks}/${stats.totalTracks || 0}`],
    ["Metadata", `${Math.max(0, stats.totalTracks * 3 - stats.missingMetadataParts)} fields ok`],
    ["Audio Files", `${stats.unreadableBrokenFiles || 0} broken`],
    ["Total Tracks", String(stats.totalTracks || 0)],
    ["Total Albums", String(getAlbums().length)],
    ["Total Size", formatBytes(stats.totalLibrarySize || 0)],
    ["Last Scan", latestScanDate()]
  ].forEach(([label, value]) => cards.append(makeStatCard(label, value)));

  const issues = makeNode("section", "issues-table glass-panel");
  issues.append(makeNode("h2", "", "Issues"));
  for (const issue of healthIssues(stats)) {
    issues.append(createIssueRow(issue));
  }

  const details = makeNode("section", "scan-details glass-panel");
  details.append(
    makeNode("h2", "", "Scan Details"),
    createKeyValueGrid([
      ["Files scanned", String(state.scannedTracks.length || state.tracks.length)],
      ["Scan root", state.scan.rootPath || "Not selected"],
      ["Scan state", state.scan.running ? "Running" : state.scan.completedAt ? "Completed" : "Idle"],
      ["Scan progress", state.scan.total ? `${state.scan.processed}/${state.scan.total}` : "-"]
    ])
  );
  screen.append(hero, cards, issues, details);
  viewRoot.append(screen);
}

function statsForHealth() {
  const base = state.libraryStats || {};
  const tracks = state.tracks;
  const missingTitle = base.missingTitle ?? tracks.filter((track) => !track.title).length;
  const missingArtist = base.missingArtist ?? tracks.filter((track) => !track.artist).length;
  const missingAlbum = base.missingAlbum ?? tracks.filter((track) => !track.album).length;
  const missingCovers = base.missingCovers ?? tracks.filter((track) => !track.artworkUrl && !track.hasEmbeddedCover).length;
  const totalTracks = base.totalTracks ?? tracks.length;
  return {
    totalTracks,
    totalLibrarySize: base.totalLibrarySize ?? tracks.reduce((sum, track) => sum + Number(track.fileSize || 0), 0),
    unreadableBrokenFiles: base.unreadableBrokenFiles ?? tracks.filter((track) => track.failed || track.scanStatus === "error").length,
    missingTitle,
    missingArtist,
    missingAlbum,
    missingMetadataParts: missingTitle + missingArtist + missingAlbum,
    missingCovers,
    coveredTracks: Math.max(0, totalTracks - missingCovers),
    potentialDuplicates: base.potentialDuplicates ?? state.duplicateGroups.reduce((sum, group) => sum + group.tracks.length, 0)
  };
}

function calculateHealthScore() {
  const stats = statsForHealth();
  if (!stats.totalTracks) {
    return {
      value: null,
      label: "Needs scan",
      status: "Needs scan",
      subtitle: "Scan a library to calculate health",
      summary: "No precision theater here: the score appears after there is enough library data."
    };
  }
  const total = Math.max(1, stats.totalTracks);
  const metadataPenalty = Math.min(28, (stats.missingMetadataParts / (total * 3)) * 28);
  const coverPenalty = Math.min(18, (stats.missingCovers / total) * 18);
  const brokenPenalty = Math.min(34, (stats.unreadableBrokenFiles / total) * 42);
  const duplicatePenalty = Math.min(16, (stats.potentialDuplicates / total) * 16);
  const value = Math.max(0, Math.round(100 - metadataPenalty - coverPenalty - brokenPenalty - duplicatePenalty));
  const status = value >= 92 ? "Excellent" : value >= 78 ? "Good" : value >= 55 ? "Needs Attention" : "Critical";
  return {
    value,
    label: `${value}%`,
    status,
    subtitle: `${status} / ${countLabel(total)}`,
    summary: "Score weighs broken files heavily, then missing metadata, missing covers and duplicate candidates."
  };
}

function healthScoreText() {
  return calculateHealthScore();
}

function healthIssues(stats) {
  return [
    { title: "Duplicate Tracks", count: state.duplicateGroups.length, severity: "medium", action: () => setView("duplicates") },
    { title: "Missing Album Covers", count: stats.missingCovers, severity: "low", action: () => reviewIssue("missingCover", "Missing covers") },
    { title: "Missing Metadata", count: stats.missingMetadataParts, severity: "medium", action: () => reviewIssue("missingMetadata", "Missing metadata") },
    { title: "Unplayable Files", count: stats.unreadableBrokenFiles, severity: "high", action: () => reviewIssue("unreadableFile", "Unplayable files") },
    { title: "Suspicious Quality", count: state.problemTracks.filter((track) => track.qualityFlags?.lowBitDepth || track.qualityFlags?.lowSampleRate || track.qualityFlags?.missingTechnicalInfo).length, severity: "medium", action: () => reviewIssue("missingTechnicalInfo", "Suspicious quality") }
  ];
}

function createIssueRow(issue) {
  const row = makeNode("div", "issue-row");
  const review = makeNode("button", "secondary-action compact", isProActive() ? "Review" : "Activate");
  review.type = "button";
  review.addEventListener("click", () => {
    if (!isProActive()) {
      showLicenseGate("Enter a valid access key to continue.");
      return;
    }
    issue.action();
  });
  row.append(
    makeNode("strong", "", issue.title),
    makeNode("span", "", String(issue.count)),
    makeNode("span", `severity ${issue.severity}`, issue.severity),
    review
  );
  return row;
}

function reviewIssue(flag, label) {
  state.activeFilter = { type: "issue", value: flag, label };
  state.view = "tracks";
  render();
}

function renderProLockedState(title, message) {
  const screen = makeNode("div", "settings-screen page-fade");
  const panel = makeNode("section", "pro-locked glass-panel");
  const badge = makeNode("span", "quality-badge", "Harmonia Pro");
  const action = makeNode("button", "primary-action", "Enter License");
  action.type = "button";
  action.addEventListener("click", () => showLicenseGate("Enter a valid access key to continue."));
  panel.append(
    badge,
    makeNode("h2", "", title),
    makeNode("p", "", message),
    action
  );
  screen.append(panel);
  viewRoot.append(screen);
}

function renderDuplicates() {
  if (!isProActive()) {
    renderProLockedState("Duplicates", "Duplicate review tools are available with Harmonia Pro.");
    return;
  }

  const groups = state.duplicateGroups.filter((group) => !state.reviewedDuplicates.has(group.key));
  if (state.duplicateGroups.length === 0) {
    renderEmptyState({ title: "No duplicate candidates", message: "Potential duplicates will appear after a scan finds matching artist, title and duration buckets.", actionLabel: "Scan Library", action: () => setView("scanner"), showArt: false });
    return;
  }
  const screen = makeNode("div", "duplicates-screen page-fade");
  const left = makeNode("section", "duplicate-list");
  for (const [index, group] of groups.entries()) {
    left.append(createDuplicateGroup(group, index));
  }
  if (groups.length === 0) {
    left.append(createInlineEmpty("All duplicate groups reviewed", "Reviewed groups stay safe and hidden from the active review list."));
  }
  screen.append(left, renderDuplicatePreview(groups[0] || state.duplicateGroups[0]));
  viewRoot.append(screen);
}

function createDuplicateGroup(group, index) {
  const card = makeNode("section", "duplicate-group glass-panel");
  const bestPath = bestDuplicateCandidatePath(group.tracks);
  const header = makeNode("div", "duplicate-head");
  header.append(makeNode("strong", "", `Group ${index + 1}`), makeNode("span", "", `${group.tracks.length} items`));
  card.append(header);
  for (const track of group.tracks) {
    const row = makeNode("div", "duplicate-row");
    const isBest = track.absolutePath === bestPath;
    row.classList.toggle("best", isBest);
    const finder = makeNode("button", "secondary-action compact", "Finder");
    finder.type = "button";
    finder.addEventListener("click", () => showPathInFinder({ path: track.absolutePath }));
    row.append(
      makeNode("strong", "", track.title || track.fileName || "Untitled Track"),
      makeNode("span", "", track.artist || "Unknown Artist"),
      makeNode("span", "", track.album || "Unknown Album"),
      makeNode("span", "", track.extension || "FLAC"),
      makeNode("span", "", formatSampleRate(track.sampleRate)),
      makeNode("span", "", track.bitDepth ? `${track.bitDepth}-bit` : "-"),
      makeNode("span", "", formatBytes(track.fileSize)),
      makeNode("code", "", track.absolutePath),
      makeNode("span", isBest ? "candidate-badge best" : "candidate-badge", isBest ? "Best" : "Good"),
      finder
    );
    card.append(row);
  }
  const reviewed = makeNode("button", "secondary-action", "Mark as reviewed");
  reviewed.type = "button";
  reviewed.addEventListener("click", () => {
    state.reviewedDuplicates.add(group.key);
    saveCollections();
    render();
  });
  card.append(reviewed);
  return card;
}

function renderDuplicatePreview(group) {
  const panel = makeNode("aside", "duplicate-preview glass-panel");
  if (!group) {
    panel.append(createInlineEmpty("No group selected", "Duplicate metadata will appear here."));
    return panel;
  }
  const bestPath = bestDuplicateCandidatePath(group.tracks);
  const best = group.tracks.find((track) => track.absolutePath === bestPath) || group.tracks[0];
  panel.append(
    createCover({ title: best.title || best.fileName, subtitle: best.artist, seed: best.absolutePath, className: "detail-cover" }),
    makeNode("h2", "", best.title || best.fileName || "Untitled Track"),
    makeNode("p", "", `${best.artist || "Unknown Artist"} / ${best.album || "Unknown Album"}`),
    createKeyValueGrid([
      ["Format", best.extension || "FLAC"],
      ["Sample Rate", formatSampleRate(best.sampleRate)],
      ["Bit Depth", best.bitDepth ? `${best.bitDepth}-bit` : "-"],
      ["File Size", formatBytes(best.fileSize)],
      ["Path", best.absolutePath || "-"]
    ])
  );
  const actions = makeNode("div", "action-column");
  const finder = makeNode("button", "secondary-action", "Show in Finder");
  finder.type = "button";
  finder.addEventListener("click", () => showPathInFinder({ path: best.absolutePath }));
  actions.append(finder);
  panel.append(actions);
  return panel;
}

function bestDuplicateCandidatePath(tracks) {
  const [best] = [...tracks].sort((a, b) => {
    const left = Number(a.sampleRate || 0) * 10 + Number(a.bitDepth || 0) * 1000 + Number(a.fileSize || 0) / 1000000;
    const right = Number(b.sampleRate || 0) * 10 + Number(b.bitDepth || 0) * 1000 + Number(b.fileSize || 0) / 1000000;
    return right - left;
  });
  return best?.absolutePath || "";
}

function renderScanner() {
  const screen = makeNode("div", "scanner-screen page-fade");
  const drop = makeNode("section", "scanner-drop glass-panel");
  const choose = makeNode("button", "secondary-action", "Choose Folder");
  const start = makeNode("button", "primary-action", state.scan.running ? "Scanning..." : "Scan Library");
  choose.type = "button";
  start.type = "button";
  start.disabled = state.scan.running;
  choose.addEventListener("click", chooseScanFolder);
  start.addEventListener("click", startScan);
  drop.append(
    makeNode("h2", "", "Drop into your local archive"),
    makeNode("p", "", state.scan.selectedPath || state.scan.rootPath || "Choose a folder with FLAC albums. Existing scanner runs async and keeps the UI responsive."),
    createChipRow(["FLAC scanner", "Metadata", "Covers", "Duplicates"]),
    choose,
    start
  );

  const progress = makeNode("section", "scanner-progress glass-panel");
  const progressBar = makeNode("div", "progress-bar");
  const fill = makeNode("span", "");
  const percent = state.scan.total ? Math.round((state.scan.processed / state.scan.total) * 100) : state.scan.running ? 12 : 0;
  fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  progressBar.append(fill);
  const cancel = makeNode("button", "secondary-action compact", "Cancel");
  cancel.type = "button";
  cancel.disabled = !state.scan.running;
  cancel.addEventListener("click", cancelScan);
  progress.append(
    makeNode("h2", "", state.scan.running ? "Scan in progress" : "Scan status"),
    makeNode("p", "", state.scan.currentPath || state.scan.error || state.scan.completedAt || "Ready"),
    progressBar,
    makeNode("span", "muted", state.scan.total ? `${state.scan.processed}/${state.scan.total} scanned / ${state.scan.failed || 0} failed` : `${state.scan.discoveredFiles || 0} discovered`),
    cancel
  );

  const log = makeNode("section", "scan-log glass-panel");
  log.append(
    makeNode("h2", "", "Scan Log"),
    createInlineEmpty(
      state.scan.error ? "Scanner reported an error" : "No warnings yet",
      state.scan.error || "Warnings and failed files will appear here during a scan."
    )
  );
  screen.append(drop, progress, log);
  viewRoot.append(screen);
}

async function chooseScanFolder() {
  const result = await api.chooseLibraryFolder?.();
  if (result?.ok && result.path) {
    state.scan.selectedPath = result.path;
    render();
  } else if (!result?.canceled) {
    showToast(result?.error || "Folder chooser is unavailable.");
  }
}

async function startScan() {
  state.scan.running = true;
  state.scan.error = "";
  state.scan.phase = "starting";
  render();
  const result = state.scan.selectedPath
    ? await api.scanLibrary?.(state.scan.selectedPath)
    : await api.scanLibrary?.();
  if (!result?.ok) {
    state.scan.running = false;
    state.scan.error = result?.canceled ? "Scan cancelled" : result?.error || result?.reason || "Scanner unavailable";
    render();
    return;
  }
  state.scan.rootPath = result.rootPath || state.scan.selectedPath || "";
  state.scan.running = true;
  render();
}

async function cancelScan() {
  await api.cancelLibraryScan?.();
  state.scan.running = false;
  render();
}

function updateScanProgress(progress) {
  state.scan = {
    ...state.scan,
    ...progress,
    running: !["complete", "cancelled", "error"].includes(progress.phase)
  };
  if (state.view !== "scanner") {
    return;
  }
  if (scanRenderTimer) {
    return;
  }
  scanRenderTimer = window.setTimeout(() => {
    scanRenderTimer = 0;
    render();
  }, 140);
}

function finishScan(result) {
  state.scan.running = false;
  state.scan.completedAt = result?.cancelled ? "Scan cancelled" : "Scan complete";
  state.scan.error = result?.error || "";
  state.scan.processed = result?.processed ?? state.scan.processed;
  state.scan.total = result?.total ?? state.scan.total;
  state.scan.failed = result?.failed ?? state.scan.failed;
  applyScannedPayload(result || {});
  showToast(result?.cancelled ? "Scan cancelled." : "Library scan complete.");
  render();
}

function licenseStatusRows() {
  return [
    settingReadout("Harmonia Pro", licenseStatusLabel()),
    settingReadout("License type", state.license.licenseType || "-"),
    settingReadout("License key", state.license.maskedLicenseKey || "-"),
    settingReadout("Activations used", state.license.activationsAllowed ? `${state.license.activationsUsed}/${state.license.activationsAllowed}` : "-"),
    settingReadout("Last validated", formatDateTime(state.license.lastValidatedAt))
  ];
}

function licenseStatusPanel() {
  return settingsPanel("License Status", licenseStatusRows());
}

function applyLicenseState(result) {
  const active = result?.active === true;
  state.license = {
    ...state.license,
    active,
    status: result?.status || (active ? "active" : "inactive"),
    licenseType: active ? result?.licenseType || state.license.licenseType || "" : result?.licenseType || "",
    activationsAllowed: Number(result?.activationsAllowed || 0),
    activationsUsed: Number(result?.activationsUsed || 0),
    activatedAt: active ? result?.activatedAt || state.license.activatedAt || "" : result?.activatedAt || "",
    lastValidatedAt: active ? result?.lastValidatedAt || state.license.lastValidatedAt || "" : result?.lastValidatedAt || "",
    maskedLicenseKey: active ? result?.maskedLicenseKey || state.license.maskedLicenseKey || "" : result?.maskedLicenseKey || "",
    offline: result?.offline === true
  };
}

async function activateLicenseFromGate() {
  const key = state.gate.key.trim();

  if (!key) {
    state.gate.status = "error";
    state.gate.message = "Enter a valid access key to continue.";
    renderLicenseGate();
    return;
  }

  state.gate.status = "validating";
  state.gate.message = "Checking access key...";
  renderLicenseGate();

  const result = await api.activateLicense?.(key).catch(() => ({
    success: false,
    code: "SERVER_ERROR",
    message: "Server unavailable"
  }));

  if (result?.success) {
    applyLicenseState(result);
    hideLicenseGate();
    showToast("Harmonia unlocked.");
    await restoreAfterUnlock();
    render();
    return;
  }

  applyLicenseState(result);
  state.gate.status = "error";
  state.gate.message = activationErrorMessage(result);
  renderLicenseGate();
}

function renderSettings(view) {
  const screen = makeNode("div", "settings-screen page-fade");
  if (view === "general") {
    screen.append(settingsPanel("Preferences", [
      settingSegment("Theme", [["dark", "Dark"], ["light", "Light"], ["system", "System"]], state.settings.theme, (value) => {
        state.settings.theme = normalizedTheme(value);
        saveSettings();
        render();
      }),
      settingSelect("Startup behavior", [["restore", "Restore last library"], ["silent", "Open empty workspace"]], state.settings.startup, (value) => {
        state.settings.startup = value;
        saveSettings();
      }),
      settingReadout("Library summary", `${countLabel(state.tracks.length)} / ${countLabel(getAlbums().length, "album", "albums")}`),
      settingButton("Reset UI state", "Reset", () => {
        ["workspaceView", "albumLayout", "albumSort", "trackSort", "trackSortDirection"].forEach((key) => localStorage.removeItem(key));
        showToast("UI state reset. Restart the app to apply all defaults.");
      })
    ]), settingsPanel("Accent Color", [
      settingAccentPicker(),
      settingReadout("Selected", ACCENT_COLORS[state.settings.accentColor]?.label || ACCENT_COLORS.graphite.label),
      settingButton("Default accent", "Graphite", () => {
        state.settings.accentColor = "graphite";
        saveSettings();
        render();
      })
    ]), licenseStatusPanel(), settingsPanel("Advanced", [
      settingNavigationButton("Maintenance and diagnostics", "Open", "advanced")
    ]));
  } else {
    screen.append(settingsPanel("Maintenance", [
      settingNavigationButton("General settings", "Open", "general"),
      settingButton("Rebuild library index", "Rebuild", () => refreshScannedLibrary().then(() => showToast("Library index refreshed."))),
      settingReadout("Audio Path", "Chromium/Electron system mixer"),
      settingReadout("Diagnostics", `Electron renderer / ${navigator.platform}`)
    ]));
  }
  viewRoot.append(screen);
}

function settingsPanel(title, rows) {
  const panel = makeNode("section", "settings-card glass-panel");
  panel.append(makeNode("h2", "", title), ...rows);
  return panel;
}

function settingSegment(label, options, value, onChange) {
  const row = makeNode("div", "setting-row");
  row.append(makeNode("span", "", label), makeSegmented(options, value, onChange));
  return row;
}

function settingSelect(label, options, value, onChange) {
  const row = makeNode("label", "setting-row");
  row.append(makeNode("span", "", label), makeSelect(label, options, value, onChange));
  return row;
}

function settingReadout(label, value) {
  const row = makeNode("div", "setting-row");
  row.append(makeNode("span", "", label), makeNode("strong", "", value));
  return row;
}

function settingButton(label, buttonLabel, onClick) {
  const row = makeNode("div", "setting-row");
  const button = makeNode("button", "secondary-action", buttonLabel);
  button.type = "button";
  button.addEventListener("click", onClick);
  row.append(makeNode("span", "", label), button);
  return row;
}

function settingNavigationButton(label, buttonLabel, view) {
  return settingButton(label, buttonLabel, () => setView(view));
}

function settingAccentPicker() {
  const row = makeNode("div", "setting-row accent-setting-row");
  const grid = makeNode("div", "accent-color-grid");

  for (const [value, label] of ACCENT_COLOR_OPTIONS) {
    const selected = value === state.settings.accentColor;
    const color = ACCENT_COLORS[value];
    const swatch = makeNode("button", selected ? "accent-swatch active" : "accent-swatch");
    swatch.type = "button";
    swatch.setAttribute("aria-pressed", String(selected));
    swatch.setAttribute("aria-label", label);
    swatch.style.setProperty("--swatch", color.light.hex);
    swatch.append(makeNode("span", "accent-swatch-dot"), makeNode("strong", "", label));
    swatch.addEventListener("click", () => {
      state.settings.accentColor = normalizedAccentColor(value);
      saveSettings();
      render();
    });
    grid.append(swatch);
  }

  row.append(makeNode("span", "", "Accent color"), grid);
  return row;
}

function makeSegmented(options, value, onChange) {
  const control = makeNode("div", "segmented-control");
  for (const [optionValue, label] of options) {
    const button = makeNode("button", optionValue === value ? "active" : "", label);
    button.type = "button";
    button.addEventListener("click", () => onChange(optionValue));
    control.append(button);
  }
  return control;
}

function makeSelect(label, options, value, onChange) {
  const select = document.createElement("select");
  select.className = "select-control";
  select.setAttribute("aria-label", label);
  for (const [optionValue, optionLabel] of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionLabel;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function makeStatCard(label, value) {
  const card = makeNode("div", "stat-card glass-panel");
  card.append(makeNode("span", "", label), makeNode("strong", "", value));
  return card;
}

function createChipRow(items) {
  const row = makeNode("div", "chip-row");
  for (const item of items) {
    row.append(makeNode("span", "chip", String(item || "-")));
  }
  return row;
}

function createKeyValueGrid(items) {
  const grid = makeNode("dl", "key-value-grid");
  for (const [key, value] of items) {
    grid.append(makeNode("dt", "", key), makeNode("dd", "", String(value || "-")));
  }
  return grid;
}

function renderEmptyState({ title, message, actionLabel, action, showArt = true }) {
  const empty = makeNode("section", "empty-state glass-panel page-fade");
  const actionButton = makeNode("button", "primary-action", actionLabel);
  actionButton.type = "button";
  actionButton.addEventListener("click", action);
  if (showArt) {
    empty.append(makeNode("div", "empty-art", "H"));
  }
  empty.append(makeNode("h2", "", title), makeNode("p", "", message), actionButton);
  viewRoot.append(empty);
}

function createInlineEmpty(title, message) {
  const empty = makeNode("div", "inline-empty");
  empty.append(makeNode("strong", "", title), makeNode("span", "", message));
  return empty;
}

function clearSearchAndFilter() {
  state.query = "";
  state.pendingQuery = "";
  state.activeFilter = null;
  globalSearch.value = "";
  render();
}

function selectedTrack() {
  return state.tracks.find((track) => track.id === state.selectedTrackId) || null;
}

function isCurrentAlbum(album) {
  const currentId = getCurrentTrack()?.id || "";
  return Boolean(currentId && album?.tracks?.some((track) => track.id === currentId));
}

function isAlbumPlaying(album) {
  return state.isPlaying && isCurrentAlbum(album);
}

function toggleAlbumPlayback(album) {
  if (isAlbumPlaying(album)) {
    audio.pause();
    return;
  }
  playAlbum(album);
}

function playAlbum(album) {
  playTrackList(album.tracks);
}

function playTrackList(tracks) {
  const playable = tracks.filter((track) => track?.url || track?.path);
  if (playable.length === 0) {
    showToast("No playable tracks in this list.");
    return;
  }
  state.queueIds = playable.map((track) => track.id);
  saveCollections();
  playTrackById(playable[0].id, playable);
}

function playTrackById(id, context = null) {
  const index = state.tracks.findIndex((track) => track.id === id);
  if (index === -1) {
    return;
  }
  if (context?.length) {
    state.queueIds = context.map((track) => track.id);
    saveCollections();
  } else if (!state.queueIds.includes(id)) {
    state.queueIds = lastVisibleTrackIds.length ? [...lastVisibleTrackIds] : state.tracks.map((track) => track.id);
    saveCollections();
  }
  state.currentIndex = index;
  loadCurrentTrack(true);
}

function loadCurrentTrack(autoplay, shouldPersist = true) {
  const track = getCurrentTrack();
  if (!track) {
    audio.removeAttribute("src");
    state.isPlaying = false;
    renderPlayer();
    return;
  }
  audio.loop = state.repeat === "one";
  audio.src = track.url;
  audio.load();
  audio.currentTime = 0;
  state.selectedTrackId = track.id;
  if (autoplay) {
    audio.play().catch(() => {
      state.isPlaying = false;
      showToast("This file could not be played.");
      renderPlayer();
    });
  } else {
    state.isPlaying = false;
  }
  if (shouldPersist) {
    persistLibrarySoon();
  }
  renderPlayer();
  updateActiveTrackRows();
}

function togglePlay() {
  const track = getCurrentTrack();
  if (!track && state.tracks.length > 0) {
    playTrackList(getFilteredTracks().length ? getFilteredTracks() : state.tracks);
    return;
  }
  if (!track) {
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => {
      state.isPlaying = false;
      showToast("Playback failed.");
      renderPlayer();
    });
  } else {
    audio.pause();
  }
}

function queueTracks() {
  const queue = state.queueIds.map((id) => state.tracks.find((track) => track.id === id)).filter(Boolean);
  return queue.length ? queue : state.tracks;
}

function nextTrack() {
  const queue = queueTracks();
  if (queue.length === 0) {
    return;
  }
  const current = getCurrentTrack();
  let next = queue[0];
  if (state.shuffle && queue.length > 1) {
    do {
      next = queue[Math.floor(Math.random() * queue.length)];
    } while (next.id === current?.id);
  } else {
    const index = Math.max(0, queue.findIndex((track) => track.id === current?.id));
    if (index < queue.length - 1) {
      next = queue[index + 1];
    } else {
      audio.pause();
      audio.currentTime = 0;
      state.isPlaying = false;
      renderPlayer();
      return;
    }
  }
  playTrackById(next.id, queue);
}

function previousTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const queue = queueTracks();
  const current = getCurrentTrack();
  const index = Math.max(0, queue.findIndex((track) => track.id === current?.id));
  const previous = queue[index > 0 ? index - 1 : queue.length - 1];
  if (previous) {
    playTrackById(previous.id, queue);
  }
}

function applyRepeatMode() {
  state.repeat = normalizedRepeatMode(state.repeat);
  audio.loop = state.repeat === "one";
  repeatButton.classList.toggle("active", state.repeat === "one");
  repeatButton.classList.toggle("repeat-one", state.repeat === "one");
  repeatButton.setAttribute("aria-label", state.repeat === "one" ? "Repeat Track On" : "Repeat Track");
  repeatButton.title = state.repeat === "one" ? "Repeat track is on" : "Repeat track";
}

function renderPlayer() {
  const track = getCurrentTrack();
  playPauseButton.classList.toggle("is-playing", state.isPlaying);
  playPauseButton.setAttribute("aria-label", state.isPlaying ? "Pause" : "Play");
  shuffleButton.classList.toggle("active", state.shuffle);
  applyRepeatMode();
  outputStatus.textContent = track ? `${track.extension || "FLAC"}${track.sampleRate ? ` / ${formatSampleRate(track.sampleRate)}` : ""}` : "FLAC";

  if (!track) {
    applyCoverToBox(barCover, null);
    barTitle.textContent = "No track selected";
    barArtist.textContent = state.tracks.length ? "Choose a track to play" : "Scan Music Folder";
    barQuality.textContent = "Ready";
    renderPlaybackProgress(null);
    renderNowPanel();
    return;
  }

  applyCoverToBox(barCover, track);
  barTitle.textContent = getTitle(track);
  barArtist.textContent = `${getArtist(track)}${track.album ? ` / ${getAlbum(track)}` : ""}`;
  barQuality.textContent = trackQualityLabel(track);
  renderPlaybackProgress(track);
  renderNowPanel();
}

function renderPlaybackProgress(track = getCurrentTrack()) {
  const duration = track ? audio.duration || track.duration || 0 : 0;
  const current = track ? audio.currentTime || 0 : 0;
  durationTime.textContent = formatTime(duration);
  currentTime.textContent = formatTime(current);
  panelDuration.textContent = formatTime(duration);
  panelCurrentTime.textContent = formatTime(current);
  panelProgressFill.style.width = duration > 0 ? `${Math.min(100, current / duration * 100)}%` : "0%";
  if (!state.isSeeking) {
    seekInput.value = duration > 0 ? String((current / duration) * 1000) : "0";
  }
}

function renderNowPanel() {
  const track = getCurrentTrack() || selectedTrack();
  const score = calculateHealthScore();
  miniHealthScore.textContent = score.value === null ? "Needs scan" : `${score.value}% / ${score.status}`;
  panelFavorite.classList.toggle("active", Boolean(track && state.favoriteTracks.has(track.id)));
  panelFavorite.setAttribute("aria-label", track && state.favoriteTracks.has(track.id) ? "Remove from Favorites" : "Favorite");
  showCurrentInFinder.disabled = !track;

  if (!track) {
    applyCoverToBox(panelCover, null);
    document.getElementById("nowPanelHeading").textContent = "No track selected";
    panelTitle.textContent = "No track selected";
    panelArtist.textContent = "Scan or open music to begin.";
    panelAlbum.textContent = "";
    panelQuality.textContent = "Ready";
    panelInfoBody.replaceChildren(createInlineEmpty("Nothing playing", "Metadata and file details appear here after selection."));
    return;
  }

  applyCoverToBox(panelCover, track);
  document.getElementById("nowPanelHeading").textContent = getTitle(track);
  panelTitle.textContent = getTitle(track);
  panelArtist.textContent = getArtist(track);
  panelAlbum.textContent = getAlbum(track);
  panelQuality.textContent = trackQualityLabel(track);
  renderPanelTab(track);
}

function renderPanelTab(track) {
  panelInfoBody.replaceChildren();
  panelInfoBody.append(createKeyValueGrid([
    ["Title", getTitle(track)],
    ["Artist", getArtist(track)],
    ["Album", getAlbum(track)],
    ["Format", track.extension || "FLAC"],
    ["Sample Rate", formatSampleRate(track.sampleRate)],
    ["Bit Depth", track.bitDepth ? `${track.bitDepth}-bit` : "-"],
    ["Duration", formatTime(track.duration)],
    ["Path", track.path || "-"]
  ]));
}

function updateActiveTrackRows() {
  const currentId = getCurrentTrack()?.id || "";
  for (const row of document.querySelectorAll("[data-track-id]")) {
    row.classList.toggle("active", row.dataset.trackId === currentId);
    row.classList.toggle("selected", row.dataset.trackId === state.selectedTrackId);
  }
}

function toggleTrackFavorite(track = getCurrentTrack() || selectedTrack()) {
  if (!track) {
    showToast("Select a track first.");
    return;
  }
  if (state.favoriteTracks.has(track.id)) {
    state.favoriteTracks.delete(track.id);
  } else {
    state.favoriteTracks.add(track.id);
  }
  saveCollections();
  render();
}

function toggleAlbumFavorite(key) {
  if (state.favoriteAlbums.has(key)) {
    state.favoriteAlbums.delete(key);
  } else {
    state.favoriteAlbums.add(key);
  }
  saveCollections();
  render();
}

async function showPathInFinder(track = getCurrentTrack() || selectedTrack()) {
  const path = trackPath(track);
  if (!path) {
    showToast("No local file path is available.");
    return;
  }
  const result = await api.showItemInFolder?.(path);
  if (!result?.ok) {
    showToast(result?.error || "Show in Finder is unavailable.");
  }
}

function recordRecentPlay(track) {
  if (!track) {
    return;
  }
  state.recentPlays = [
    { id: track.id, playedAt: new Date().toISOString() },
    ...state.recentPlays.filter((item) => item.id !== track.id)
  ].slice(0, 50);
  saveCollections();
}

function latestScanDate() {
  const dates = state.scannedTracks.map((track) => track.lastScannedAt).filter(Boolean).sort();
  return dates.length ? formatDate(dates[dates.length - 1]) : "Needs scan";
}

async function refreshScannedLibrary() {
  const [tracks, stats, problemTracks, duplicateGroups] = await Promise.all([
    api.getTracks?.().catch(() => []),
    api.getLibraryStats?.().catch(() => null),
    api.getProblemTracks?.().catch(() => []),
    api.getPotentialDuplicates?.().catch(() => [])
  ]);
  applyScannedPayload({ tracks, stats, problemTracks, duplicateGroups });
}

async function refreshLicenseState() {
  const cached = await api.getLicenseState?.().catch(() => null);
  if (cached) {
    applyLicenseState(cached);
  }
}

async function restoreLibrary() {
  state.isRestoring = true;
  try {
    const saved = await api.loadLibrary();
    state.tracks = Array.isArray(saved.tracks) ? saved.tracks.map(normalizeTrack) : [];
    state.playlists = Array.isArray(saved.playlists) ? saved.playlists : state.playlists;
    const index = state.tracks.findIndex((track) => track.id === saved.currentId);
    state.currentIndex = index >= 0 ? index : state.tracks.length ? 0 : -1;
    if (state.currentIndex >= 0) {
      loadCurrentTrack(false, false);
    }
  } finally {
    state.isRestoring = false;
    render();
  }
}

function wireEvents() {
  licenseGateForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    activateLicenseFromGate();
  });
  licenseGateInput?.addEventListener("input", () => {
    state.gate.key = licenseGateInput.value;
    if (state.gate.status !== "validating") {
      state.gate.status = "idle";
      state.gate.message = "Enter your access key to unlock Harmonia.";
      renderLicenseGate();
    }
  });
  licenseGateInput?.addEventListener("paste", () => {
    window.setTimeout(() => {
      state.gate.key = licenseGateInput.value;
      if (state.gate.status !== "validating") {
        state.gate.status = "idle";
        state.gate.message = "Access key pasted. Press Unlock to continue.";
        renderLicenseGate();
      }
    }, 0);
  });

  navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
  navGroupToggles.forEach((toggle) => toggle.addEventListener("click", () => {
    const group = toggle.dataset.sidebarToggle;
    state.sidebarGroups[group] = !(state.sidebarGroups[group] === true);
    writeJson("sidebarGroups", state.sidebarGroups);
    updateSidebar();
  }));
  backButton.addEventListener("click", goBack);
  globalSearch.addEventListener("input", () => {
    state.pendingQuery = globalSearch.value.trim();
    window.clearTimeout(queryTimer);
    queryTimer = window.setTimeout(() => {
      state.query = state.pendingQuery;
      render();
    }, 160);
  });

  playPauseButton.addEventListener("click", togglePlay);
  previousButton.addEventListener("click", previousTrack);
  nextButton.addEventListener("click", nextTrack);
  shuffleButton.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    localStorage.setItem("shuffle", String(state.shuffle));
    renderPlayer();
  });
  repeatButton.addEventListener("click", () => {
    state.repeat = state.repeat === "one" ? "off" : "one";
    localStorage.setItem("repeat", state.repeat);
    renderPlayer();
  });
  queueButton.addEventListener("click", () => setView("tracks"));
  panelFavorite.addEventListener("click", () => toggleTrackFavorite());
  showCurrentInFinder.addEventListener("click", () => showPathInFinder());
  document.querySelector("[data-jump-view='health']").addEventListener("click", () => setView("health"));

  const handleSystemThemeChange = () => {
    if (state.settings.theme === "system") {
      render();
    }
  };
  if (typeof systemPrefersDark.addEventListener === "function") {
    systemPrefersDark.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemPrefersDark.addListener === "function") {
    systemPrefersDark.addListener(handleSystemThemeChange);
  }

  volumeInput.addEventListener("input", () => {
    audio.volume = Number(volumeInput.value);
    localStorage.setItem("volume", String(audio.volume));
  });
  seekInput.addEventListener("input", () => {
    state.isSeeking = true;
    const duration = audio.duration || 0;
    currentTime.textContent = formatTime((Number(seekInput.value) / 1000) * duration);
  });
  seekInput.addEventListener("change", () => {
    const duration = audio.duration || 0;
    if (duration > 0) {
      audio.currentTime = (Number(seekInput.value) / 1000) * duration;
    }
    state.isSeeking = false;
  });

  audio.addEventListener("play", () => {
    state.isPlaying = true;
    recordRecentPlay(getCurrentTrack());
    if (state.albumDetailKey) {
      render();
    } else {
      renderPlayer();
      updateActiveTrackRows();
    }
  });
  audio.addEventListener("pause", () => {
    state.isPlaying = false;
    if (state.albumDetailKey) {
      render();
    } else {
      renderPlayer();
    }
  });
  audio.addEventListener("timeupdate", () => renderPlaybackProgress());
  audio.addEventListener("durationchange", () => renderPlaybackProgress());
  audio.addEventListener("ended", () => {
    if (state.repeat === "one") {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    nextTrack();
  });
  audio.addEventListener("error", () => {
    const track = getCurrentTrack();
    if (track) {
      track.failed = true;
    }
    showToast("Playback error. Moving to the next safe track.");
    if (queueTracks().length > 1) {
      window.setTimeout(nextTrack, 650);
    }
    updateActiveTrackRows();
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (isTyping) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.code === "ArrowRight") {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (event.code === "ArrowLeft") {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  });

  window.addEventListener("beforeunload", () => {
    if (isProActive()) {
      persistLibrarySync();
    }
  });

  api.onFlacScanProgress?.(updateScanProgress);
  api.onFlacScanComplete?.(finishScan);
  api.onImportedTracks?.((tracks) => mergeTracks(tracks));
  api.onDroppedFiles?.((tracks) => {
    state.isImporting = false;
    mergeTracks(tracks);
  });
  api.onPlaybackCommand?.((command) => {
    if (command === "toggle") {
      togglePlay();
    } else if (command === "next") {
      nextTrack();
    } else if (command === "previous") {
      previousTrack();
    }
  });
  api.onOpenSettings?.(() => setView("general"));
}

async function initializeApp() {
  wireEvents();
  updateTheme();
  renderLicenseGate();
  await refreshLicenseState().catch(() => {});

  if (!isProActive()) {
    state.gate.status = "idle";
    state.gate.message = "Enter a valid access key to continue.";
    renderLicenseGate();
    return;
  }

  hideLicenseGate();
  await restoreAfterUnlock();
}

async function restoreAfterUnlock() {
  await restoreLibrary();
  await refreshScannedLibrary().catch(() => {});
  render();
  api.supportedExtensions?.().then((extensions) => {
    if (Array.isArray(extensions) && extensions.length) {
      document.querySelector(".brand span").textContent = `${extensions.slice(0, 4).join(", ")} workspace`;
    }
  }).catch(() => {});
}

initializeApp();

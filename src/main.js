const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const crypto = require("node:crypto");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createLibraryStore } = require("./services/libraryStore");
const { scanFlacLibrary } = require("./services/flacScanner");
const { createLicenseManager } = require("./services/licenseManager");

const APP_NAME = "Harmonia";

const AUDIO_EXTENSIONS = new Set([
  ".aac",
  ".aif",
  ".aiff",
  ".alac",
  ".flac",
  ".m4a",
  ".m4b",
  ".mp3",
  ".mp4",
  ".oga",
  ".ogg",
  ".opus",
  ".wav",
  ".webm"
]);

const AUDIO_FILTER = {
  name: "Audio",
  extensions: Array.from(AUDIO_EXTENSIONS, (ext) => ext.slice(1))
};

app.setName(APP_NAME);
app.setPath("userData", path.join(app.getPath("appData"), "local-player"));

const flacLibraryStore = createLibraryStore(path.join(app.getPath("userData"), "flac-library.json"));
const licenseManager = createLicenseManager({
  userDataPath: app.getPath("userData"),
  appVersion: app.getVersion()
});
const appIconPath = path.join(__dirname, "..", "build", "app-icon.png");

const ARTWORK_FILENAMES = [
  "cover",
  "folder",
  "front",
  "album",
  "artwork"
];

const ARTWORK_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

let parseFile;
let activeFlacScan = null;

async function getMetadataParser() {
  if (!parseFile) {
    ({ parseFile } = await import("music-metadata"));
  }

  return parseFile;
}

function createWindow() {
  const hasDevIcon = fsSync.existsSync(appIconPath);

  if (process.platform === "darwin" && !app.isPackaged && hasDevIcon) {
    app.dock.setIcon(appIconPath);
  }

  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#241f1b",
    ...(hasDevIcon ? { icon: appIconPath } : {}),
    title: APP_NAME,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.webContents.on("before-input-event", (event, input) => {
    const closesWindow = input.key?.toLowerCase() === "w" && (process.platform === "darwin" ? input.meta : input.control);

    if (closesWindow && !input.alt && !input.shift) {
      event.preventDefault();
      win.close();
    }
  });
  createNativeMenu(win);
}

function createNativeMenu(win) {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "File",
      submenu: [
        {
          label: "Open Files",
          accelerator: "CmdOrCtrl+O",
          click: () => openFilesForWindow(win)
        },
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => openFolderForWindow(win)
        },
        {
          label: "Scan FLAC Library",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => chooseAndStartFlacScan(win)
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => win.webContents.send("settings:open")
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" }
      ]
    },
    {
      label: "Playback",
      submenu: [
        { label: "Play / Pause", accelerator: "Space", click: () => win.webContents.send("playback:toggle") },
        { label: "Next", accelerator: "CmdOrCtrl+Right", click: () => win.webContents.send("playback:next") },
        { label: "Previous", accelerator: "CmdOrCtrl+Left", click: () => win.webContents.send("playback:previous") }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "close" },
        { type: "separator" },
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendToWindow(win, channel, payload) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

function isAbsolutePath(value) {
  return typeof value === "string" && path.isAbsolute(value);
}

async function validateDirectory(inputPath) {
  if (!isAbsolutePath(inputPath)) {
    throw new Error("Path must be absolute");
  }

  const realPath = await fs.realpath(inputPath);
  const stats = await fs.stat(realPath);

  if (!stats.isDirectory()) {
    throw new Error("Path must be a directory");
  }

  return realPath;
}

async function scannedLibraryPayload() {
  const [tracks, stats, problemTracks, duplicateGroups] = await Promise.all([
    flacLibraryStore.getTracks(),
    flacLibraryStore.getLibraryStats(),
    flacLibraryStore.getProblemTracks(),
    flacLibraryStore.getPotentialDuplicates()
  ]);

  return {
    tracks,
    stats,
    problemTracks,
    duplicateGroups
  };
}

async function chooseAndStartFlacScan(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Scan FLAC library",
    properties: ["openDirectory"]
  });

  if (canceled || !filePaths[0]) {
    return {
      ok: false,
      canceled: true
    };
  }

  return startFlacScan(win, filePaths[0]);
}

async function chooseFlacLibraryFolder(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Choose music library folder",
    properties: ["openDirectory"]
  });

  if (canceled || !filePaths[0]) {
    return {
      ok: false,
      canceled: true
    };
  }

  try {
    const folderPath = await validateDirectory(filePaths[0]);
    return {
      ok: true,
      path: folderPath
    };
  } catch (error) {
    return {
      ok: false,
      reason: "invalid-path",
      error: error.message
    };
  }
}

async function startFlacScan(win, folderPath) {
  if (activeFlacScan && !activeFlacScan.cancelled) {
    return {
      ok: false,
      reason: "scan-in-progress"
    };
  }

  let rootPath;

  try {
    rootPath = await validateDirectory(folderPath);
  } catch (error) {
    return {
      ok: false,
      reason: "invalid-path",
      error: error.message
    };
  }

  const scan = {
    id: crypto.randomUUID(),
    cancelled: false,
    rootPath,
    startedAt: new Date().toISOString()
  };

  activeFlacScan = scan;
  console.info(`[${APP_NAME}] FLAC scan started`, { id: scan.id, rootPath });

  sendToWindow(win, "scanner:progress", {
    id: scan.id,
    phase: "starting",
    rootPath,
    discoveredFiles: 0,
    processed: 0,
    failed: 0,
    total: 0
  });

  scanFlacLibrary({
    rootPath,
    store: flacLibraryStore,
    signal: scan,
    onProgress: (progress) => {
      sendToWindow(win, "scanner:progress", {
        id: scan.id,
        rootPath,
        ...progress
      });
    }
  }).then(async (result) => {
    console.info(`[${APP_NAME}] FLAC scan completed`, {
      id: scan.id,
      processed: result.processed,
      failed: result.failed
    });
    const payload = await scannedLibraryPayload();
    sendToWindow(win, "scanner:complete", {
      id: scan.id,
      ...result,
      ...payload
    });
  }).catch(async (error) => {
    const cancelled = error.code === "SCAN_CANCELLED";
    console.info(`[${APP_NAME}] FLAC scan finished with state`, {
      id: scan.id,
      cancelled,
      error: cancelled ? "" : error.message
    });
    const payload = await scannedLibraryPayload();

    sendToWindow(win, "scanner:complete", {
      id: scan.id,
      rootPath,
      cancelled,
      error: cancelled ? "" : error.message,
      ...payload
    });
  }).finally(() => {
    if (activeFlacScan?.id === scan.id) {
      activeFlacScan = null;
    }
  });

  return {
    ok: true,
    id: scan.id,
    rootPath
  };
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isAudioFile(filePath) {
  return AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function libraryStorePath() {
  return path.join(app.getPath("userData"), "library.json");
}

function artworkDirectory() {
  return path.join(app.getPath("userData"), "artwork");
}

function artworkExtension(mime) {
  const normalizedMime = String(mime || "").toLowerCase();

  if (normalizedMime.includes("png")) {
    return "png";
  }

  if (normalizedMime.includes("webp")) {
    return "webp";
  }

  if (normalizedMime.includes("gif")) {
    return "gif";
  }

  return "jpg";
}

async function collectAudioFiles(entryPath) {
  let stats;

  try {
    stats = await fs.stat(entryPath);
  } catch {
    return [];
  }

  if (stats.isFile()) {
    return isAudioFile(entryPath) ? [entryPath] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const result = [];
  const entries = await fs.readdir(entryPath, { withFileTypes: true });

  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const nextPath = path.join(entryPath, entry.name);

    if (entry.isDirectory()) {
      result.push(...await collectAudioFiles(nextPath));
    } else if (entry.isFile() && isAudioFile(nextPath)) {
      result.push(nextPath);
    }
  }

  return result;
}

function fallbackTitle(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

async function saveArtwork(filePath, picture) {
  if (!picture?.data?.length) {
    return {};
  }

  const buffer = Buffer.from(picture.data);
  const hash = crypto
    .createHash("sha1")
    .update(filePath)
    .update(buffer)
    .digest("hex");
  const extension = artworkExtension(picture.format);
  const artworkPath = path.join(artworkDirectory(), `${hash}.${extension}`);

  await fs.mkdir(path.dirname(artworkPath), { recursive: true });

  if (!await pathExists(artworkPath)) {
    await fs.writeFile(artworkPath, buffer);
  }

  return {
    artworkPath,
    artworkUrl: pathToFileURL(artworkPath).href,
    artworkMime: picture.format || ""
  };
}

async function artworkFromMetadata(filePath, common) {
  const pictures = Array.isArray(common?.picture) ? common.picture : [];
  const picture = pictures.find((item) => /front/i.test(item?.type || "")) || pictures[0];

  if (!picture) {
    return {};
  }

  try {
    return await saveArtwork(filePath, picture);
  } catch {
    return {};
  }
}

function artworkMimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

async function artworkFromFolder(filePath) {
  try {
    const folder = path.dirname(filePath);
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile() && ARTWORK_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => path.join(folder, entry.name));

    for (const name of ARTWORK_FILENAMES) {
      const match = images.find((imagePath) => path.basename(imagePath, path.extname(imagePath)).toLowerCase() === name);

      if (match) {
        return {
          artworkPath: match,
          artworkUrl: pathToFileURL(match).href,
          artworkMime: artworkMimeFromPath(match)
        };
      }
    }

    const firstImage = images[0];

    if (!firstImage) {
      return {};
    }

    return {
      artworkPath: firstImage,
      artworkUrl: pathToFileURL(firstImage).href,
      artworkMime: artworkMimeFromPath(firstImage)
    };
  } catch {
    return {};
  }
}

async function toTrack(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let stats = null;

  try {
    stats = await fs.stat(filePath);
  } catch {
    stats = null;
  }

  const baseTrack = {
    id: filePath,
    path: filePath,
    url: pathToFileURL(filePath).href,
    title: fallbackTitle(filePath),
    artist: "",
    album: "",
    duration: 0,
    fileSize: stats?.size || 0,
    extension: ext.replace(".", "").toUpperCase(),
    folder: path.dirname(filePath),
    artworkPath: "",
    artworkUrl: "",
    artworkMime: "",
    artworkChecked: true
  };

  try {
    const parser = await getMetadataParser();
    const metadata = await parser(filePath, { duration: true });
    const common = metadata.common || {};
    const format = metadata.format || {};
    const embeddedArtwork = await artworkFromMetadata(filePath, common);
    const artwork = embeddedArtwork.artworkUrl ? embeddedArtwork : await artworkFromFolder(filePath);

    return {
      ...baseTrack,
      title: common.title || baseTrack.title,
      artist: common.artist || common.albumartist || "",
      album: common.album || "",
      genre: Array.isArray(common.genre) ? common.genre[0] || "" : "",
      composer: Array.isArray(common.composer) ? common.composer.join(", ") : "",
      year: common.year ? String(common.year) : "",
      date: common.date || "",
      duration: Number.isFinite(format.duration) ? format.duration : 0,
      codec: format.codec || "",
      bitrate: format.bitrate || 0,
      sampleRate: format.sampleRate || 0,
      ...artwork
    };
  } catch {
    return baseTrack;
  }
}

function stringValue(value) {
  return typeof value === "string" ? value : "";
}

function numberValue(value) {
  return Number.isFinite(value) ? value : 0;
}

function booleanValue(value) {
  return value === true;
}

function toSavedTrack(track) {
  const filePath = stringValue(track.path);
  const ext = path.extname(filePath).toLowerCase();

  return {
    id: filePath,
    path: filePath,
    title: stringValue(track.title) || fallbackTitle(filePath),
    artist: stringValue(track.artist),
    album: stringValue(track.album),
    genre: Array.isArray(track.genre) ? stringValue(track.genre[0]) : stringValue(track.genre),
    composer: Array.isArray(track.composer) ? track.composer.map(stringValue).filter(Boolean).join(", ") : stringValue(track.composer),
    year: stringValue(track.year),
    date: stringValue(track.date),
    duration: numberValue(track.duration),
    fileSize: numberValue(track.fileSize),
    extension: stringValue(track.extension) || ext.replace(".", "").toUpperCase(),
    folder: stringValue(track.folder) || path.dirname(filePath),
    codec: stringValue(track.codec),
    bitrate: numberValue(track.bitrate),
    sampleRate: numberValue(track.sampleRate),
    bitDepth: numberValue(track.bitDepth),
    channels: numberValue(track.channels),
    artworkPath: stringValue(track.artworkPath),
    artworkMime: stringValue(track.artworkMime),
    artworkChecked: booleanValue(track.artworkChecked),
    source: stringValue(track.source),
    scanRootPath: stringValue(track.scanRootPath),
    scanStatus: stringValue(track.scanStatus),
    scanError: stringValue(track.scanError),
    tagEdited: booleanValue(track.tagEdited),
    hasEmbeddedCover: booleanValue(track.hasEmbeddedCover),
    hasTitleMetadata: booleanValue(track.hasTitleMetadata),
    hasArtistMetadata: booleanValue(track.hasArtistMetadata),
    hasAlbumMetadata: booleanValue(track.hasAlbumMetadata)
  };
}

async function normalizeSavedTrack(track) {
  const filePath = stringValue(track.path);

  if (!filePath || !isAudioFile(filePath) || !await pathExists(filePath)) {
    return null;
  }

  const saved = toSavedTrack(track);
  if (!saved.fileSize) {
    try {
      const stats = await fs.stat(filePath);
      saved.fileSize = stats.size || 0;
    } catch {
      saved.fileSize = 0;
    }
  }
  const artworkExists = saved.artworkPath && await pathExists(saved.artworkPath);

  if (!saved.artworkChecked || saved.artworkPath && !artworkExists) {
    return toTrack(filePath);
  }

  return {
    ...saved,
    id: filePath,
    path: filePath,
    url: pathToFileURL(filePath).href,
    folder: path.dirname(filePath),
    artworkUrl: artworkExists ? pathToFileURL(saved.artworkPath).href : ""
  };
}

async function readSavedLibrary() {
  try {
    const raw = await fs.readFile(libraryStorePath(), "utf8");
    const saved = JSON.parse(raw);
    const tracks = Array.isArray(saved.tracks) ? saved.tracks : [];
    const normalizedTracks = await mapWithLimit(tracks, 12, normalizeSavedTrack);

    return {
      tracks: normalizedTracks.filter(Boolean),
      currentId: stringValue(saved.currentId),
      playlists: Array.isArray(saved.playlists) ? saved.playlists : []
    };
  } catch {
    return {
      tracks: [],
      currentId: "",
      playlists: []
    };
  }
}

function savedLibraryPayload(library) {
  const tracks = Array.isArray(library?.tracks) ? library.tracks : [];
  const playlists = Array.isArray(library?.playlists) ? library.playlists : [];
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    currentId: stringValue(library?.currentId),
    playlists,
    tracks: tracks
      .map(toSavedTrack)
      .filter((track) => track.path && isAudioFile(track.path))
  };
}

async function writeSavedLibrary(library) {
  const payload = savedLibraryPayload(library);

  const storePath = libraryStorePath();

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");

  return {
    ok: true,
    count: payload.tracks.length
  };
}

function writeSavedLibrarySync(library) {
  const payload = savedLibraryPayload(library);
  const storePath = libraryStorePath();

  fsSync.mkdirSync(path.dirname(storePath), { recursive: true });
  fsSync.writeFileSync(storePath, JSON.stringify(payload, null, 2), "utf8");

  return {
    ok: true,
    count: payload.tracks.length
  };
}

async function mapWithLimit(items, limit, mapper) {
  const result = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      result[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);

  return result;
}

async function importPaths(paths) {
  const existingPaths = [];

  for (const entryPath of paths) {
    if (!isAbsolutePath(entryPath)) {
      continue;
    }

    try {
      const realPath = await fs.realpath(entryPath);

      if (await pathExists(realPath)) {
        existingPaths.push(realPath);
      }
    } catch {
      // Ignore invalid drag/drop or renderer-provided paths.
    }
  }

  const collected = [];

  for (const entryPath of existingPaths) {
    collected.push(...await collectAudioFiles(entryPath));
  }

  const uniquePaths = Array.from(new Set(collected))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return mapWithLimit(uniquePaths, 6, toTrack);
}

async function chooseAudioFiles() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Open audio files",
    properties: ["openFile", "multiSelections"],
    filters: [AUDIO_FILTER]
  });

  if (canceled) {
    return [];
  }

  return importPaths(filePaths);
}

async function chooseMusicFolder() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Open music folder",
    properties: ["openDirectory"]
  });

  if (canceled) {
    return [];
  }

  return importPaths(filePaths);
}

async function openFilesForWindow(win) {
  const tracks = await chooseAudioFiles();

  if (tracks.length > 0 && !win.isDestroyed()) {
    win.webContents.send("library:imported-tracks", tracks);
  }
}

async function openFolderForWindow(win) {
  const tracks = await chooseMusicFolder();

  if (tracks.length > 0 && !win.isDestroyed()) {
    win.webContents.send("library:imported-tracks", tracks);
  }
}

ipcMain.handle("library:import-paths", async (_event, paths) => {
  if (!Array.isArray(paths)) {
    return [];
  }

  return importPaths(paths);
});

ipcMain.handle("library:load", async () => {
  return readSavedLibrary();
});

ipcMain.handle("library:save", async (_event, library) => {
  return writeSavedLibrary(library);
});

ipcMain.on("library:save-sync", (event, library) => {
  try {
    event.returnValue = writeSavedLibrarySync(library);
  } catch (error) {
    event.returnValue = {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("flac-library:choose-folder", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win) {
    return {
      ok: false,
      reason: "window-missing"
    };
  }

  return chooseFlacLibraryFolder(win);
});

ipcMain.handle("flac-library:scan-path", async (event, folderPath) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win) {
    return {
      ok: false,
      reason: "window-missing"
    };
  }

  if (!folderPath) {
    return chooseAndStartFlacScan(win);
  }

  return startFlacScan(win, folderPath);
});

ipcMain.handle("flac-library:cancel-scan", async () => {
  if (!activeFlacScan) {
    return {
      ok: false,
      reason: "no-active-scan"
    };
  }

  activeFlacScan.cancelled = true;

  return {
    ok: true,
    id: activeFlacScan.id
  };
});

ipcMain.handle("flac-library:get-tracks", async () => {
  return flacLibraryStore.getTracks();
});

ipcMain.handle("flac-library:get-stats", async () => {
  return flacLibraryStore.getLibraryStats();
});

ipcMain.handle("flac-library:get-problem-tracks", async () => {
  return flacLibraryStore.getProblemTracks();
});

ipcMain.handle("flac-library:get-duplicates", async () => {
  return flacLibraryStore.getPotentialDuplicates();
});

ipcMain.handle("library:show-item-in-folder", async (_event, filePath) => {
  if (!isAbsolutePath(filePath)) {
    return {
      ok: false,
      reason: "invalid-path"
    };
  }

  try {
    const realPath = await fs.realpath(filePath);
    await fs.access(realPath);
    shell.showItemInFolder(realPath);
    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      reason: "missing-path",
      error: error.message
    };
  }
});

ipcMain.handle("license:activate", async (_event, licenseKey) => {
  return licenseManager.activateLicense(licenseKey);
});

ipcMain.handle("license:validate", async () => {
  return licenseManager.validateLicense();
});

ipcMain.handle("license:get-state", async () => {
  return licenseManager.getLicenseState();
});

ipcMain.handle("app:supported-extensions", () => {
  return Array.from(AUDIO_EXTENSIONS).map((ext) => ext.slice(1).toUpperCase());
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

let parseFile;

async function getMetadataParser() {
  if (!parseFile) {
    ({ parseFile } = await import("music-metadata"));
  }

  return parseFile;
}

function assertNotCancelled(signal) {
  if (signal?.cancelled) {
    const error = new Error("Scan cancelled");
    error.code = "SCAN_CANCELLED";
    throw error;
  }
}

function yieldToEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function isFlacFile(filePath) {
  return path.extname(filePath).toLowerCase() === ".flac";
}

async function discoverFlacFiles(rootPath, signal, onProgress) {
  const files = [];
  const queue = [rootPath];

  while (queue.length > 0) {
    assertNotCancelled(signal);
    const current = queue.shift();
    let entries = [];

    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    for (const entry of entries) {
      assertNotCancelled(signal);

      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      const nextPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(nextPath);
      } else if (entry.isFile() && isFlacFile(nextPath)) {
        files.push(nextPath);
      }
    }

    onProgress?.({
      phase: "discovering",
      discoveredFiles: files.length,
      currentPath: current
    });
    await yieldToEventLoop();
  }

  return files;
}

function nativeValue(metadata, names) {
  const vorbis = metadata.native?.vorbis || [];
  const wanted = new Set(names.map((name) => name.toUpperCase()));
  const entry = vorbis.find((item) => wanted.has(String(item.id || "").toUpperCase()));

  if (!entry) {
    return "";
  }

  if (Array.isArray(entry.value)) {
    return String(entry.value[0] || "");
  }

  return String(entry.value || "");
}

function trackNumber(metadata) {
  const commonTrack = metadata.common?.track?.no;

  if (Number.isFinite(commonTrack)) {
    return commonTrack;
  }

  const raw = nativeValue(metadata, ["TRACKNUMBER", "TRACK"]);
  const match = raw.match(/\d+/);

  return match ? Number(match[0]) : null;
}

function scanDate(metadata) {
  return String(metadata.common?.year || metadata.common?.date || nativeValue(metadata, ["DATE", "YEAR"]) || "");
}

function fallbackTitle(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

function baseTrack(filePath, stats) {
  return {
    id: filePath,
    absolutePath: filePath,
    path: filePath,
    url: pathToFileURL(filePath).href,
    fileName: path.basename(filePath),
    folderPath: path.dirname(filePath),
    fileSize: stats?.size || 0,
    duration: 0,
    sampleRate: null,
    bitDepth: null,
    channels: null,
    artist: "",
    album: "",
    title: fallbackTitle(filePath),
    hasTitleMetadata: false,
    hasArtistMetadata: false,
    hasAlbumMetadata: false,
    trackNumber: null,
    date: "",
    year: "",
    hasEmbeddedCover: false,
    scanStatus: "pending",
    scanError: "",
    lastScannedAt: new Date().toISOString()
  };
}

async function scanFlacFile(filePath) {
  let stats = null;

  try {
    stats = await fs.stat(filePath);
  } catch (error) {
    return {
      ...baseTrack(filePath, stats),
      title: fallbackTitle(filePath),
      scanStatus: "error",
      scanError: error.message || "Unable to read file"
    };
  }

  const track = baseTrack(filePath, stats);

  try {
    const parser = await getMetadataParser();
    const metadata = await parser(filePath, { duration: true });
    const common = metadata.common || {};
    const format = metadata.format || {};
    const artist = common.artist || common.albumartist || nativeValue(metadata, ["ARTIST", "ALBUMARTIST"]);
    const album = common.album || nativeValue(metadata, ["ALBUM"]);
    const title = common.title || nativeValue(metadata, ["TITLE"]);
    const date = scanDate(metadata);

    return {
      ...track,
      duration: Number.isFinite(format.duration) ? format.duration : 0,
      sampleRate: Number.isFinite(format.sampleRate) ? format.sampleRate : null,
      bitDepth: Number.isFinite(format.bitsPerSample) ? format.bitsPerSample : null,
      channels: Number.isFinite(format.numberOfChannels) ? format.numberOfChannels : null,
      artist,
      album,
      title: title || fallbackTitle(filePath),
      genre: Array.isArray(common.genre) ? common.genre[0] || "" : "",
      composer: Array.isArray(common.composer) ? common.composer.join(", ") : "",
      hasTitleMetadata: Boolean(title),
      hasArtistMetadata: Boolean(artist),
      hasAlbumMetadata: Boolean(album),
      trackNumber: trackNumber(metadata),
      date,
      year: String(common.year || date || ""),
      hasEmbeddedCover: Array.isArray(common.picture) && common.picture.length > 0,
      scanStatus: "ok",
      scanError: "",
      lastScannedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ...track,
      scanStatus: "error",
      scanError: error.message || "Unable to parse FLAC metadata",
      lastScannedAt: new Date().toISOString()
    };
  }
}

async function scanFlacLibrary({ rootPath, store, signal, onProgress }) {
  const discoveredFiles = await discoverFlacFiles(rootPath, signal, onProgress);
  const existingPaths = new Set(discoveredFiles);
  let processed = 0;
  let failed = 0;

  for (const filePath of discoveredFiles) {
    assertNotCancelled(signal);
    onProgress?.({
      phase: "scanning",
      currentPath: filePath,
      discoveredFiles: discoveredFiles.length,
      processed,
      failed,
      total: discoveredFiles.length
    });

    const track = {
      ...await scanFlacFile(filePath),
      scanRootPath: rootPath
    };

    if (track.scanStatus === "error") {
      failed += 1;
    }

    await store.upsertTrack(track);
    processed += 1;

    onProgress?.({
      phase: "scanning",
      currentPath: filePath,
      discoveredFiles: discoveredFiles.length,
      processed,
      failed,
      total: discoveredFiles.length
    });
    await yieldToEventLoop();
  }

  const missing = await store.deleteMissingTracks(existingPaths, { rootPath });

  return {
    cancelled: false,
    rootPath,
    total: discoveredFiles.length,
    processed,
    failed,
    deleted: missing.deleted
  };
}

module.exports = {
  discoverFlacFiles,
  scanFlacFile,
  scanFlacLibrary
};

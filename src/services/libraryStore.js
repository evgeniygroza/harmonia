const fs = require("node:fs/promises");
const path = require("node:path");
const { findPotentialDuplicates } = require("./duplicateDetector");
const { getQualityFlags, hasAnyFlag } = require("./qualityFlags");

function isMissingMetadata(track, flagName, valueName) {
  return Object.hasOwn(track, flagName) ? !track[flagName] : !track[valueName];
}

function createLibraryStore(storePath) {
  let cache = null;
  let writeQueue = Promise.resolve();

  async function ensureLoaded() {
    if (cache) {
      return cache;
    }

    try {
      const raw = await fs.readFile(storePath, "utf8");
      const parsed = JSON.parse(raw);

      cache = {
        version: 1,
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks : []
      };
    } catch {
      cache = {
        version: 1,
        tracks: []
      };
    }

    return cache;
  }

  async function persist() {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      tracks: cache.tracks
    };

    await fs.mkdir(path.dirname(storePath), { recursive: true });
    writeQueue = writeQueue.then(() => fs.writeFile(storePath, JSON.stringify(payload, null, 2), "utf8"));
    await writeQueue;
  }

  function duplicatePathSet(tracks) {
    const paths = new Set();

    for (const group of findPotentialDuplicates(tracks)) {
      for (const track of group.tracks) {
        paths.add(track.absolutePath);
      }
    }

    return paths;
  }

  function enrichTracks(tracks) {
    const duplicates = duplicatePathSet(tracks);

    return tracks.map((track) => ({
      ...track,
      qualityFlags: getQualityFlags(track, duplicates)
    }));
  }

  async function upsertTrack(track) {
    const data = await ensureLoaded();
    const index = data.tracks.findIndex((item) => item.absolutePath === track.absolutePath);
    const previous = index >= 0 ? data.tracks[index] : {};
    const merged = {
      replayGainStatus: "not_analyzed",
      replayGain: null,
      ...previous,
      ...track,
      absolutePath: track.absolutePath,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      data.tracks[index] = merged;
    } else {
      data.tracks.push(merged);
    }

    await persist();
    return merged;
  }

  async function getTracks() {
    const data = await ensureLoaded();
    return enrichTracks([...data.tracks].sort((a, b) => String(a.absolutePath).localeCompare(String(b.absolutePath))));
  }

  async function getTrackByPath(filePath) {
    const data = await ensureLoaded();
    const track = data.tracks.find((item) => item.absolutePath === filePath);

    if (!track) {
      return null;
    }

    const duplicates = duplicatePathSet(data.tracks);
    return {
      ...track,
      qualityFlags: getQualityFlags(track, duplicates)
    };
  }

  async function deleteMissingTracks(existingPaths, options = {}) {
    const data = await ensureLoaded();
    const existing = new Set(Array.from(existingPaths || []));
    const rootPath = options.rootPath ? path.resolve(options.rootPath) : "";
    const before = data.tracks.length;

    data.tracks = data.tracks.filter((track) => {
      if (existing.has(track.absolutePath)) {
        return true;
      }

      if (!rootPath) {
        return false;
      }

      const absolutePath = path.resolve(track.absolutePath);
      return !(absolutePath === rootPath || absolutePath.startsWith(rootPath + path.sep));
    });

    if (data.tracks.length !== before) {
      await persist();
    }

    return {
      deleted: before - data.tracks.length
    };
  }

  async function getPotentialDuplicates() {
    const data = await ensureLoaded();
    return findPotentialDuplicates(data.tracks);
  }

  async function getLibraryStats() {
    const tracks = await getTracks();
    const duplicateGroups = await getPotentialDuplicates();
    const stats = {
      totalTracks: tracks.length,
      totalLibrarySize: 0,
      unreadableBrokenFiles: 0,
      missingTitle: 0,
      missingArtist: 0,
      missingAlbum: 0,
      missingCovers: 0,
      potentialDuplicates: duplicateGroups.reduce((sum, group) => sum + group.tracks.length, 0),
      sampleRateDistribution: {},
      bitDepthDistribution: {},
      replayGain: {
        not_analyzed: 0,
        analyzing: 0,
        analyzed: 0,
        failed: 0
      }
    };

    for (const track of tracks) {
      stats.totalLibrarySize += track.fileSize || 0;

      if (track.scanStatus === "error") {
        stats.unreadableBrokenFiles += 1;
      }

      if (isMissingMetadata(track, "hasTitleMetadata", "title")) {
        stats.missingTitle += 1;
      }

      if (isMissingMetadata(track, "hasArtistMetadata", "artist")) {
        stats.missingArtist += 1;
      }

      if (isMissingMetadata(track, "hasAlbumMetadata", "album")) {
        stats.missingAlbum += 1;
      }

      if (!track.hasEmbeddedCover) {
        stats.missingCovers += 1;
      }

      const sampleRate = track.sampleRate ? String(track.sampleRate) : "unknown";
      const bitDepth = track.bitDepth ? String(track.bitDepth) : "unknown";
      stats.sampleRateDistribution[sampleRate] = (stats.sampleRateDistribution[sampleRate] || 0) + 1;
      stats.bitDepthDistribution[bitDepth] = (stats.bitDepthDistribution[bitDepth] || 0) + 1;

      const replayGainStatus = track.replayGainStatus || "not_analyzed";
      stats.replayGain[replayGainStatus] = (stats.replayGain[replayGainStatus] || 0) + 1;
    }

    return stats;
  }

  async function getProblemTracks() {
    const tracks = await getTracks();
    return tracks.filter((track) => hasAnyFlag(track.qualityFlags));
  }

  return {
    upsertTrack,
    getTracks,
    getTrackByPath,
    deleteMissingTracks,
    getLibraryStats,
    getProblemTracks,
    getPotentialDuplicates
  };
}

module.exports = {
  createLibraryStore
};

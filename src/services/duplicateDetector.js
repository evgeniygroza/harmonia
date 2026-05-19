function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(remaster(ed)?|deluxe|explicit|mono|stereo|bonus|version)\b/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function durationBucket(duration) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return "unknown";
  }

  return String(Math.round(duration / 3));
}

function duplicateKey(track) {
  return [
    normalizeText(track.artist),
    normalizeText(track.title),
    durationBucket(track.duration)
  ].join("|");
}

function albumLooksSimilar(left, right) {
  const a = normalizeText(left.album);
  const b = normalizeText(right.album);

  return !a || !b || a === b || a.includes(b) || b.includes(a);
}

function findPotentialDuplicates(tracks) {
  const buckets = new Map();

  for (const track of tracks) {
    if (track.scanStatus === "error") {
      continue;
    }

    const artist = normalizeText(track.artist);
    const title = normalizeText(track.title);

    if (!artist || !title) {
      continue;
    }

    const key = duplicateKey(track);
    const bucket = buckets.get(key) || [];
    bucket.push(track);
    buckets.set(key, bucket);
  }

  const groups = [];

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.length < 2) {
      continue;
    }

    const filtered = [];

    for (const track of bucket) {
      const similarPeer = bucket.some((peer) => {
        if (peer.absolutePath === track.absolutePath) {
          return false;
        }

        const durationDelta = Math.abs((peer.duration || 0) - (track.duration || 0));
        return durationDelta <= 3 && albumLooksSimilar(peer, track);
      });

      if (similarPeer) {
        filtered.push(track);
      }
    }

    if (filtered.length >= 2) {
      groups.push({
        key,
        artist: filtered[0].artist || "",
        title: filtered[0].title || "",
        album: filtered[0].album || "",
        tracks: filtered.sort((a, b) => String(a.absolutePath).localeCompare(String(b.absolutePath)))
      });
    }
  }

  return groups.sort((a, b) => {
    const artistCompare = normalizeText(a.artist).localeCompare(normalizeText(b.artist));
    return artistCompare || normalizeText(a.title).localeCompare(normalizeText(b.title));
  });
}

module.exports = {
  findPotentialDuplicates,
  normalizeText
};

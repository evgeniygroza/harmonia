function getQualityFlags(track, duplicatePaths = new Set()) {
  const unreadableFile = track.scanStatus === "error";
  const missingTechnicalInfo = !track.sampleRate || !track.bitDepth || !track.channels;
  const missingTitle = Object.hasOwn(track, "hasTitleMetadata") ? !track.hasTitleMetadata : !track.title;
  const missingArtist = Object.hasOwn(track, "hasArtistMetadata") ? !track.hasArtistMetadata : !track.artist;
  const missingAlbum = Object.hasOwn(track, "hasAlbumMetadata") ? !track.hasAlbumMetadata : !track.album;
  const missingMetadata = missingTitle || missingArtist || missingAlbum;

  return {
    lowBitDepth: Boolean(track.bitDepth && track.bitDepth < 16),
    lowSampleRate: Boolean(track.sampleRate && track.sampleRate < 44100),
    missingTechnicalInfo,
    unreadableFile,
    possibleDuplicate: duplicatePaths.has(track.absolutePath),
    missingMetadata,
    missingCover: !track.hasEmbeddedCover
  };
}

function hasAnyFlag(flags) {
  return Object.values(flags).some(Boolean);
}

module.exports = {
  getQualityFlags,
  hasAnyFlag
};

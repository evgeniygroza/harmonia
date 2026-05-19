async function analyzeTrack(trackPath) {
  return {
    path: trackPath,
    status: "failed",
    error: "ReplayGain analysis is not implemented yet."
  };
}

async function analyzeAlbum(trackIds) {
  return {
    trackIds,
    status: "failed",
    error: "ReplayGain album analysis is not implemented yet."
  };
}

module.exports = {
  analyzeTrack,
  analyzeAlbum
};

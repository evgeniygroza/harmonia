const { contextBridge, ipcRenderer, webUtils } = require("electron");

let dropCallback = null;
let dropHandlersInstalled = false;

function droppedPaths(files) {
  return Array.from(files || [])
    .map((file) => webUtils.getPathForFile(file))
    .filter(Boolean);
}

function installDropHandlers() {
  if (dropHandlersInstalled) {
    return;
  }

  dropHandlersInstalled = true;

  window.addEventListener("dragover", (event) => {
    event.preventDefault();
  }, true);

  window.addEventListener("drop", async (event) => {
    event.preventDefault();

    const paths = droppedPaths(event.dataTransfer?.files);

    if (typeof dropCallback !== "function") {
      return;
    }

    if (paths.length === 0) {
      dropCallback([]);
      return;
    }

    try {
      const tracks = await ipcRenderer.invoke("library:import-paths", paths);
      dropCallback(tracks);
    } catch {
      dropCallback([]);
    }
  }, true);
}

contextBridge.exposeInMainWorld("playerApi", {
  loadLibrary: () => ipcRenderer.invoke("library:load"),
  saveLibrary: (library) => ipcRenderer.invoke("library:save", library),
  saveLibrarySync: (library) => ipcRenderer.sendSync("library:save-sync", library),
  chooseLibraryFolder: () => ipcRenderer.invoke("flac-library:choose-folder"),
  scanLibrary: (folderPath) => ipcRenderer.invoke("flac-library:scan-path", folderPath),
  cancelLibraryScan: () => ipcRenderer.invoke("flac-library:cancel-scan"),
  getTracks: () => ipcRenderer.invoke("flac-library:get-tracks"),
  getPotentialDuplicates: () => ipcRenderer.invoke("flac-library:get-duplicates"),
  showItemInFolder: (filePath) => ipcRenderer.invoke("library:show-item-in-folder", filePath),
  getLibraryStats: () => ipcRenderer.invoke("flac-library:get-stats"),
  getProblemTracks: () => ipcRenderer.invoke("flac-library:get-problem-tracks"),
  setAppIconTheme: (theme) => ipcRenderer.invoke("app:set-icon-theme", theme),
  activateLicense: (licenseKey) => ipcRenderer.invoke("license:activate", licenseKey),
  validateLicense: () => ipcRenderer.invoke("license:validate"),
  getLicenseState: () => ipcRenderer.invoke("license:get-state"),
  onFlacScanProgress: (callback) => {
    ipcRenderer.on("scanner:progress", (_event, progress) => callback(progress));
  },
  onFlacScanComplete: (callback) => {
    ipcRenderer.on("scanner:complete", (_event, result) => callback(result));
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on("settings:open", callback);
  },
  onImportedTracks: (callback) => {
    ipcRenderer.on("library:imported-tracks", (_event, tracks) => callback(tracks));
  },
  onPlaybackCommand: (callback) => {
    ipcRenderer.on("playback:toggle", () => callback("toggle"));
    ipcRenderer.on("playback:next", () => callback("next"));
    ipcRenderer.on("playback:previous", () => callback("previous"));
  },
  onDroppedFiles: (callback) => {
    dropCallback = callback;
    installDropHandlers();
  },
  supportedExtensions: () => ipcRenderer.invoke("app:supported-extensions")
});

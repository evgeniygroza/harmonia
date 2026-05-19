# Local Player

Local Player is a local-first macOS lossless music workspace built with Electron. It plays local audio files through Chromium audio, scans FLAC libraries, reads metadata and artwork, and keeps the library database in the app data folder.

The app is dark-first and organized as a desktop music workspace:

- Library views for albums, artists, tracks, genres, composers and years
- Collection views for recently added, recently played, favorites and playlists
- Tools for library health, duplicate review, ReplayGain workflow status and file scanning
- Persistent sidebar, right Now Playing panel and floating bottom player bar
- Safe file actions through the preload API, including scanner cancellation and Show in Finder

Album artwork is read from embedded metadata when available. If a track has no embedded image, Local Player also checks the track folder for common cover files such as `cover.jpg`, `folder.png`, `front.webp`, `album.jpg` and `artwork.png`.

Supported playback import extensions:

- FLAC
- MP3
- M4A / AAC
- WAV
- OGG / OPUS
- AIFF
- WEBM audio

The production scanner currently targets FLAC libraries. ReplayGain calculation and destructive duplicate cleanup are intentionally safe placeholders until native analysis and confirmation flows are implemented.

## Run

```sh
npm install
npm start
```

For local license activation testing, run the Harmonia bot backend and point the app at it:

```sh
HARMONIA_LICENSE_API_URL=http://127.0.0.1:8787 npm start
```

## Build for macOS

```sh
npm run pack:mac
```

For a DMG build:

```sh
npm run dist:mac
```

Build artifacts are written to `dist/`.

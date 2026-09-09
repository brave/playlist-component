# playlist-component

A Brave browser component that provides JavaScript scripts for media detection and playlist management on web pages.

## Overview

`playlist-component` is a browser component used by the [Brave browser](https://brave.com/) to detect audio and video media elements on web pages and surface them for use in Brave Playlist. It works by injecting scripts into pages that scan for `<video>` and `<audio>` elements, extract their metadata (source URL, title, thumbnail, author, duration), and report them to the native browser layer.

The component also includes:
- A **MediaSource API suppressor** that disables the `MediaSource` API on certain pages, encouraging the site to fall back to plain HTTPS-fetchable URLs.
- A **site-specific detector** for YouTube that reads rich metadata directly from the `ytplayer` bootstrap data.
- A **playlist exclusions config** that tells the browser which URL patterns should never trigger playlist detection.

## File Structure

| File | Description |
|---|---|
| `index.js` | Main media detection script. Injected into pages by the native browser layer. |
| `youtube.com.js` | YouTube-specific detector that extracts title, author, thumbnail, and duration from `window.ytplayer`. |
| `media_source_api_suppressor.js` | Suppresses `window.MediaSource` and `window.WebKitMediaSource` to force pages onto HTTPS media URLs. |
| `playlist_exclusions.json` | JSON ruleset listing URL patterns (domains, path prefixes) where playlist detection should be skipped. |
| `manifest.json` | Browser component manifest (name, version, public key). |

## How It Works

### 1. Media Detection (`index.js`)

The script is wrapped in an IIFE that receives an `onMediaDetected` callback from the native browser layer. On injection it:

1. **Polls** `document.querySelectorAll('video, audio')` every **1 second** for the first **20 seconds** after page load.
2. For each newly-found media element, attaches a **`MutationObserver`** watching for `src` attribute changes.
3. After 20 seconds, switches to **`requestIdleCallback`** for ongoing detection.
4. Also listens to **`pageshow`** events to re-detect media when a page is restored from the bfcache.

For each media element, `getNodeData()` collects:

| Property | Description |
|---|---|
| `src` | Resolved HTTPS URL of the media (or `null` if not HTTPS). |
| `srcIsMediaSourceObjectURL` | Whether `src` is a `blob:` URL backed by a `MediaSource` object. |
| `mimeType` | `"video"` or `"audio"`. |
| `name` | Title of the media item. |
| `pageSrc` / `pageTitle` | URL and title of the host page. |
| `duration` | Media duration in seconds. |
| `thumbnail` | OG image or site-specific thumbnail URL (first detected item only). |
| `author` | Media author (first detected item only, site-specific). |

The collected array of `MediaItem` objects is passed to `onMediaDetected()`, which forwards them to the Brave native Playlist system.

### 2. Site-Specific Detection (`youtube.com.js`)

For YouTube, a `siteSpecificDetector` object is injected **before** `index.js` and provides overrides:

| Method | Data Source |
|---|---|
| `getThumbnail()` | `window.ytplayer.bootstrapPlayerResponse.videoDetails.thumbnail.thumbnails` (highest-res last entry) |
| `getMediaTitle(node)` | `window.ytplayer.bootstrapPlayerResponse.videoDetails.title` |
| `getMediaAuthor(node)` | `window.ytplayer.bootstrapPlayerResponse.videoDetails.author` |
| `getMediaDurationInSeconds(node)` | `window.ytplayer.bootstrapPlayerResponse.videoDetails.lengthSeconds` |

### 3. MediaSource Suppressor (`media_source_api_suppressor.js`)

Deletes `window.MediaSource` and `window.WebKitMediaSource` from the global scope. When a page tries to stream via the MSE (Media Source Extensions) API and these globals are absent, many sites fall back to serving media as direct HTTPS URLs — which Brave Playlist can then download and cache.

### 4. Playlist Exclusions (`playlist_exclusions.json`)

Defines URL patterns where playlist detection should **not** run:

```json
{
  "version": 1,
  "rules": [
    {
      "registrable_domain": "youtube.com",
      "deny_root_path": true,
      "path_prefixes": ["/results", "/feed", "/@"]
    }
  ]
}
```

This prevents spurious media detection on YouTube search results pages, feeds, and channel home pages.

## URL Validation

Only **HTTPS** media URLs are accepted. The `fixUpUrl()` helper:
- Returns `null` for non-HTTPS URLs (including plain `http:`).
- Resolves relative URLs to absolute using `window.location` as the base.
- Accepts `blob:https://...` URLs (used by MSE streams).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (for running ESLint)

### Install dependencies

```bash
npm install
```

### Lint

```bash
npx eslint . --config .eslintrc.js --ext .js,.jsx,.ts,.tsx
```

ESLint is configured with the `standard-with-typescript` rule set and enforces the Mozilla Public License 2.0 copyright header on every source file.

## CI

| Workflow | Trigger | Description |
|---|---|---|
| **ESLint** | Pull request open / update / review | Runs ESLint and uploads SARIF results to GitHub Code Scanning. |
| **CodeQL** | Pull request / schedule | Runs GitHub CodeQL static security analysis. |

## License

This Source Code Form is subject to the terms of the [Mozilla Public License, v. 2.0](LICENSE.md).  
Copyright © 2023–2024 The Brave Authors.
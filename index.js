// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// This script is modified version of
// https://github.com/brave/brave-ios/blob/development/Client/Frontend/UserContent/UserScripts/Playlist.js
medias = (async function () {
  // This will be replaced by native code on demand.
  const siteSpecificDetector = null

  /**
   * Returns a Promise that resolves with a boolean argument indicating whether
   * the `src` URL could be a blob pointing at a MediaSource object.
   * @param {string} src
   * @returns {Promise}
   */
  async function isMediaSourceObjectURL (src) {
    if (!src || !src.startsWith('blob:')) {
      return false
    }

    const controller = new AbortController()
    const signal = controller.signal
    let timeout
    const maybeAbortFetch = new Promise(resolve =>
      timeout = setTimeout(() => {
        resolve(false)
        controller.abort()
      }, 500)
    )

    return Promise.any([
      new Promise(resolve => {
        fetch(src, { signal })
          .then(() => false)
          .catch(() => true)
      }),
      maybeAbortFetch
    ])
  }

  /**
   * Returns whether given `url` has https protocol.
   * @param {string} url
   * @returns {boolean}
   */
  function isHttpsScheme (url) {
    if (!url || typeof url !== 'string') {
      return false
    }

    if (url.startsWith('blob:')) {
      url = url.substring(5)
      // blob: should be absolute path.
      return url.startsWith('https://')
    }

    let isHttpsScheme = false
    try {
      // In case of http: or data: protocol, the base URL is not used
      isHttpsScheme = new URL(url, window.location).protocol === 'https:'
    } catch (e) {
      // Ignore
    }

    return isHttpsScheme
  }

  /**
   * Returns absolute path of given `url`. Note that returns null if it's  not
   * url nor https scheme.
   * @param {string} url
   * @returns {?string}
   */
  function fixUpUrl (url) {
    if (!isHttpsScheme(url)) {
      return null
    }

    if (!url.startsWith('https://')) {
      // Fix up relative path to absolute path
      url = new URL(url, window.location).href
    }

    return url
  }

  /**
   * MediaItem will be parsed into C++ object representing PlaylistItem
   * @typedef MediaItem
   * @type {object}
   * @property {string} name
   * @property {"video" | "audio"} mimeType
   * @property {string} pageSrc - page url
   * @property {string} pageTitle - page title
   * @property {string} src - media url
   * @property {?string} thumbnail - thumbnail url
   * @property {boolean} detected
  */

  /**
   * Get all media items(video or audio) from the given HTMLMediaElement `node`.
   * @param {HTMLMediaElement} node
   * @returns {MediaItem[]}
   */
  async function getNodeData (node) {
    const src = fixUpUrl(node.src)
    const srcIsMediaSourceObjectURL = await isMediaSourceObjectURL(src)
    let mimeType = node.type
    if (mimeType == null || typeof mimeType === 'undefined' || mimeType === '') {
      if (node.constructor.name === 'HTMLVideoElement') {
        mimeType = 'video'
      }

      if (node.constructor.name === 'HTMLAudioElement') {
        mimeType = 'audio'
      }

      if (node.constructor.name === 'HTMLSourceElement') {
        if (node.closest('video')) {
          mimeType = 'video'
        } else {
          mimeType = 'audio'
        }
      }
    }

    const result = {
      name: getMediaTitle(node),
      src,
      srcIsMediaSourceObjectURL,
      pageSrc: window.location.href,
      pageTitle: document.title,
      mimeType,
      duration: getMediaDurationInSeconds(node),
      detected: true
    }

    if (src) {
      return [result]
    }

    const target = node
    const sources = []
    for (const node of document.querySelectorAll('source')) {
      const source = { ...result }
      source.src = fixUpUrl(node.src)
      source.srcIsMediaSourceObjectURL = await isMediaSourceObjectURL(source.src)
      if (source.src) {
        if (node.closest('video') === target) {
          sources.push(source)
        }

        if (node.closest('audio') === target) {
          sources.push(source)
        }
      }
    }
    return sources
  }

  /**
   * Returns thumbnail url from this page.
   * @returns {?string}
   */
  function getThumbnail () {
    const isThumbnailValid = (thumbnail) => { return thumbnail && thumbnail !== '' }

    let thumbnail = document.querySelector('meta[property="og:image"]')?.content
    if (!isThumbnailValid(thumbnail) && typeof siteSpecificDetector?.getThumbnail === 'function') {
      thumbnail = siteSpecificDetector.getThumbnail()
    }

    return fixUpUrl(thumbnail)
  }

  /**
   * Returns title of media `node`
   * @param {HTMLMediaElement} node
   * @returns {?string}
   */
  function getMediaTitle (node) {
    const isTitleValid = (title) => { return title && title !== '' }

    let title = node.title
    if (!isTitleValid(title) && typeof siteSpecificDetector?.getMediaTitle === 'function') {
      title = siteSpecificDetector.getMediaTitle(node)
    }

    if (!isTitleValid(title)) { title = document.title }

    return title
  }

  /**
   * Returns the author of given media `node`
   * @param {HTMLMediaElement} node
   * @returns {?string}
   */
  function getMediaAuthor (node) {
    // TODO(sko) Get metadata of author in more general way
    let author = null
    if (typeof siteSpecificDetector?.getMediaAuthor === 'function') {
      author = siteSpecificDetector.getMediaAuthor(node)
    }
    return author
  }

  /**
   * Returns duration of given media `node` in seconds
   * @param {HTMLMediaElement} node
   * @returns {number}
   */
  function getMediaDurationInSeconds (node) {
    const clampDuration = (value) => {
      if (Number.isFinite(value) && value >= 0) return value
      if (value === Number.POSITIVE_INFINITY) return Number.MAX_VALUE
      return 0.0
    }

    let duration = node.duration

    if (!duration && typeof siteSpecificDetector?.getMediaDurationInSeconds === 'function') { duration = siteSpecificDetector.getMediaDurationInSeconds(node) }

    return clampDuration(duration)
  }

  const videoElements = document.querySelectorAll('video')
  const audioElements = document.querySelectorAll('audio')
  // TODO(sko) These data could be incorrect when there're multiple items.
  // For now we're assuming that the first media is a representative one.
  const thumbnail = getThumbnail()
  const author = getMediaAuthor()

  let medias = []
  for (const e of [...videoElements, ...audioElements]) {
    const media = await getNodeData(e)
    medias = medias.concat(media)
  }

  if (medias.length) {
    medias[0].thumbnail = thumbnail
    medias[0].author = author
  }

  return medias
})()

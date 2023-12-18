// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// This script is modified version of
// https://github.com/brave/brave-ios/blob/development/Client/Frontend/UserContent/UserScripts/Playlist.js
medias = (async function () {
  // This will be replaced by native code on demand.
  const siteSpecificDetector = null

  async function isMediaSourceObjectURL (src) {
    if (!src || !src.startsWith('blob:')) {
      return false
    }

    const controller = new AbortController()
    const signal = controller.signal
    let timeout
    const maybeAbortFetch = new Promise(resolve =>
      timeout = setTimeout(() => resolve(false), 500)
    )

    return Promise.any([
      new Promise(resolve => {
        fetch(src, {
          signal
        }).then(response => {
          resolve(false)
        }).catch(() => {
          resolve(true)
        }).finally(() => {
          clearTimeout(timeout)
        })
      }),
      maybeAbortFetch
    ])
  }

  function isHttpsScheme (url) {
    if (!url || typeof url !== 'string') {
      return false
    }

    if (url.startsWith('blob:')) {
      url = url.substring(5)
    }

    let isHttpsScheme = false
    try {
      // In case of http: or data: protocol, the base URL is not used
      isHttpsScheme = new URL(url, window.location.origin).protocol === 'https:'
    } catch (e) {
      // Ignore
    }

    return isHttpsScheme
  }

  function fixUpUrl (url) {
    if (!isHttpsScheme(url)) {
      return null
    }

    if (!url.startsWith('https://')) {
      // Fix up relative path to absolute path
      url = new URL(url, window.location.origin).href
    }

    return url
  }

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
      'name': getMediaTitle(node),
      src,
      srcIsMediaSourceObjectURL,
      'pageSrc': window.location.href,
      'pageTitle': document.title,
      mimeType,
      'duration': getMediaDurationInSeconds(node),
      'detected': true
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

  function getAllVideoElements () {
    return document.querySelectorAll('video')
  }

  function getAllAudioElements () {
    return document.querySelectorAll('audio')
  }

  function getThumbnail () {
    const isThumbnailValid = (thumbnail) => { return thumbnail && thumbnail !== '' }

    let thumbnail = document.querySelector('meta[property="og:image"]')?.content
    if (!isThumbnailValid(thumbnail) && typeof siteSpecificDetector?.getThumbnail === 'function') {
      thumbnail = siteSpecificDetector.getThumbnail()
    }

    return fixUpUrl(thumbnail)
  }

  function getMediaTitle (node) {
    const isTitleValid = (title) => { return title && title !== '' }

    let title = node.title
    if (!isTitleValid(title) && typeof siteSpecificDetector?.getMediaTitle === 'function') {
      title = siteSpecificDetector.getMediaTitle(node)
    }

    if (!isTitleValid(title)) { title = document.title }

    return title
  }

  function getMediaAuthor (node) {
    // TODO(sko) Get metadata of author in more general way
    let author = null
    if (typeof siteSpecificDetector?.getMediaAuthor === 'function') {
      author = siteSpecificDetector.getMediaAuthor(node)
    }
    return author
  }

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

  const videoElements = getAllVideoElements() ?? []
  const audioElements = getAllAudioElements() ?? []
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

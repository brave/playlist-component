// YouTube specific script to get metadata for media.
const siteSpecificDetector = { // eslint-disable-line no-unused-vars
  getThumbnail: function () {
    let thumbnail = window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.thumbnail?.thumbnails
    if (thumbnail && Array.isArray(thumbnail)) {
      // The last one is known to be one with the highest resolution
      thumbnail = thumbnail[thumbnail.length - 1]?.url
    }
    return (typeof thumbnail === 'string' && (thumbnail.startsWith('/') || thumbnail.startsWith('http://') || thumbnail.startsWith('https://')))
      ? thumbnail : null
  },
  getMediaTitle: function (node) {
    const title = window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.title
    return typeof title ===  'string' ? title : null
  },
  getMediaAuthor: function (node) {
    const author = window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.author
    return typeof(author) == 'string' ? author : null
  },
  getMediaDurationInSeconds: function (node) {
    let duration = window.ytplayer?.bootstrapPlayerResponse?.videoDetails?.lengthSeconds
    if (typeof duration === 'string') {
      duration = Number.parseFloat(duration)
      return Number.isNaN(duration) ? null : duration
    }
    return typeof duration === 'number' ? duration : null
  }
}

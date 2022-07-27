(function() {
  function is_nan(value) {
      return typeof value === "number" && value !== value;
  }
  
  function is_infinite(value) {
      return typeof value === "number" && (value === Infinity || value === -Infinity);
  }
  
  function clamp_duration(value) {
      if (is_nan(value)) {
          return 0.0;
      }
      
      if (is_infinite(value)) {
          return Number.MAX_VALUE;
      }
      return value;
  }
  
  // Algorithm:
  // Generate a random number from 0 to 256
  // Roll-Over clamp to the range [0, 15]
  // If the index is 13, set it to 4.
  // If the index is 17, clamp it to [0, 3]
  // Subtract that number from 15 (XOR) and convert the result to hex.
  function uuid_v4() {
      // X >> 2 = X / 4 (integer division)
      
      // AND-ing (15 >> 0) roll-over clamps to 15
      // AND-ing (15 >> 2) roll-over clamps to 3
      // So '8' digit is clamped to 3 (inclusive) and all others clamped to 15 (inclusive).
      
      // 0 XOR 15 = 15
      // 1 XOR 15 = 14
      // 8 XOR 15 = 7
      // So N XOR 15 = 15 - N

      // UUID string format generated with array appending
      // Results in "10000000-1000-4000-8000-100000000000".replace(...)
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (X) => {
          return (X ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (X >> 2)))).toString(16);
      });
  }
  
  function tagNode(node) {
      if (node) {
          if (!node.tagUUID) {
              node.tagUUID = uuid_v4();
              node.addEventListener('webkitpresentationmodechanged', (e) => e.stopPropagation(), true);
          }
      }
  }
    
  function getNodeSource(node, src, mimeType, thumbnail) {
    var name = node.title;
    if (name == null || typeof name == 'undefined' || name == "") {
      name = document.title;
    }

    if (mimeType == null || typeof mimeType == 'undefined' || mimeType == "") {
      if (node.constructor.name == 'HTMLVideoElement') {
        mimeType = 'video';
      }

      if (node.constructor.name == 'HTMLAudioElement') {
        mimeType = 'audio';
      }

      if (node.constructor.name == 'HTMLSourceElement') {
        videoNode = node.closest('video');
        if (videoNode != null && typeof videoNode != 'undefined') {
          mimeType = 'video'
        } else {
          mimeType = 'audio'
        }
      }
    }

    if (src && src !== "") {
      tagNode(node);
      return {
        "name": name,
        "src": src,
        "pageSrc": window.location.href,
        "pageTitle": document.title,
        "mimeType": mimeType,
        "duration": clamp_duration(node.duration),
        "detected": true,
        "tagId": node.tagUUID,
        thumbnail
      };
    } else {
      var target = node;
      document.querySelectorAll('source').forEach(function(node) {
        if (node.src !== "") {
          if (node.closest('video') === target) {
            tagNode(target);
            return {
              "name": name,
              "src": node.src,
              "pageSrc": window.location.href,
              "pageTitle": document.title,
              "mimeType": mimeType,
              "duration": clamp_duration(target.duration),
              "detected": true,
              "tagId": target.tagUUID,
              thumbnail
            };
          }

          if (node.closest('audio') === target) {
            tagNode(target);
            return {
              "name": name,
              "src": node.src,
              "pageSrc": window.location.href,
              "pageTitle": document.title,
              "mimeType": mimeType,
              "duration": clamp_duration(target.duration),
              "detected": true,
              "tagId": target.tagUUID,
              thumbnail
            };
          }
        }
      });
    }
  }

  function getNodeData(node, thumbnail) {
    return getNodeSource(node, node.src, node.type, thumbnail);
  }

  function getAllVideoElements() {
    return document.querySelectorAll('video');
  }

  function getAllAudioElements() {
    return document.querySelectorAll('audio');
  }

  function getOGTagImage() {
    return document.querySelector('meta[property="og:image"]')?.content
  }

  let videoElements = getAllVideoElements();
  let audioElements = getAllAudioElements();
  if (!videoElements) {
    videoElements = [];
  }

  if (!audioElements) {
    audioElements = [];
  }
  

  const thumbnail = getOGTagImage();
  let medias = [...videoElements].map(e => getNodeData(e, thumbnail));
  medias = medias.concat([...audioElements].map(e => getNodeData(e, thumbnail)));
  if (medias.length)
    return medias;

  return videoElements;
})();
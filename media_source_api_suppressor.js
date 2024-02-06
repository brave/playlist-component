// Copyright (c) 2024 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// Disables the MediaSource API in hope of the page switching to
// network-fetchable HTTPS URLs. This script is from
// https://github.com/brave/brave-ios/blob/development/Sources/Brave/Frontend/UserContent/UserScripts/Scripts_Dynamic/Scripts/Paged/PlaylistSwizzlerScript.js
(function () {
  if (
    window.MediaSource ||
    window.WebKitMediaSource ||
    window.HTMLMediaElement && HTMLMediaElement.prototype.webkitSourceAddId
  ) {
    delete window.MediaSource
    delete window.WebKitMediaSource
  }
})

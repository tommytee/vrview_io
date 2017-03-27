/*
 * send-to-player.js
 * this code was originally in main.js
 *
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = require('../util');
var Emitter = require('eventemitter3');

function SendToPlayer() {

}

SendToPlayer.prototype = new Emitter();

SendToPlayer.prototype.ready = function (duration) {

  Util.sendParentMessage({
    type: 'ready',
    data: {duration: duration}
  });
};

SendToPlayer.prototype.timeUpdate = function(time) {

  Util.sendParentMessage({
    type: 'timeupdate',
    data: {
      currentTime: time.currentTime,
      duration: time.duration
    }
  });
};

SendToPlayer.prototype.setVolume = function (volumeLevel) {
  console.log('volume set ' + volumeLevel);
  Util.sendParentMessage({
    type: 'volumechange',
    data: volumeLevel
  });
};

SendToPlayer.prototype.onApiError = function(message) {
  console.error('api error ' + message);
  Util.sendParentMessage({
    type: 'error',
    data: {message: message}
  });
};

SendToPlayer.prototype.onModeChange = function(mode) {
  Util.sendParentMessage({
    type: 'modechange',
    data: {mode: mode}
  });
};

SendToPlayer.prototype.onHotspotClick = function(id) {
  Util.sendParentMessage({
    type: 'click',
    data: {id: id}
  });
};

SendToPlayer.prototype.onPlay = function() {

	Util.sendParentMessage({
    type: 'play'
  });
};

SendToPlayer.prototype.onPause = function() {

	Util.sendParentMessage({
    type: 'pause'
  });
};

SendToPlayer.prototype.onEnded = function() {

  Util.sendParentMessage({
    type: 'ended',
    data: true
  });
};

module.exports = SendToPlayer;

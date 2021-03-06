/*
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

// Initialize the loading indicator as quickly as possible to give the user
// immediate feedback.
var LoadingIndicator = require('./loading-indicator');
var loadIndicator = new LoadingIndicator();

var ES6Promise = require('es6-promise');
// Polyfill ES6 promises for IE.
ES6Promise.polyfill();

var IFrameMessageReceiver = require('./iframe-message-receiver');
var Message = require('../message');
var SceneInfo = require('./scene-info');
var Stats = require('../../node_modules/stats-js/build/stats.min');
var Util = require('../util');
require('webvr-polyfill');
var WorldRenderer = require('./world-renderer');
var SendToPlayer = require('./send-to-player');
var Connect = require('./connect');
var sendToPlayer = new SendToPlayer();
require('./vrview-controls');

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

var connect = new Connect(camera);
connect.on('onSetContent', onSetContent);
connect.on('onAddHotspot', onAddHotspot);

var receiver = new IFrameMessageReceiver(connect);
receiver.on(Message.PLAY, onPlayRequest);
receiver.on(Message.PAUSE, onPauseRequest);
receiver.on(Message.ADD_HOTSPOT, onAddHotspot);
receiver.on(Message.SET_CONTENT, onSetContent);
receiver.on(Message.SET_VOLUME, onSetVolume);
receiver.on(Message.SET_CURRENT_TIME, onUpdateTime);

window.addEventListener('load', onLoad);

var stats = new Stats();

var worldRenderer = new WorldRenderer(connect, camera);
worldRenderer.on('error', onRenderError);
worldRenderer.on('load', onRenderLoad);
worldRenderer.on('modechange', sendToPlayer.onModeChange);
worldRenderer.hotspotRenderer.on('click', sendToPlayer.onHotspotClick);

window.worldRenderer = worldRenderer;

var isReadySent = false;
var volume = 0;

function onLoad() {
  if (!Util.isWebGLEnabled()) {
    showError('WebGL not supported.');
    return;
  }

    // Load the scene.
  var scene = SceneInfo.loadFromGetParams();

  connect.video = scene.video;
  connect.pathID = scene.pathID;
  connect.overlay.onLoad();
  connect.overlay.on('clickPlayPause', clickPlayPause);
  connect.overlay.on('scrubSetTime', onUpdateTime);
  connect.on('onUpdateTime', onUpdateTime);
  connect.on('onPlay', onPlayRequest);
  connect.on('onPause', onPauseRequest);

  worldRenderer.setScene(scene);

  if (scene.isDebug) {
    // Show stats.
    showStats();
  }

  if (scene.isYawOnly) {
    WebVRConfig = window.WebVRConfig || {};
    WebVRConfig.YAW_ONLY = true;
  }

  requestAnimationFrame(loop);
}

function onRenderLoad(event) {

	if ( event.videoElement ) {

		// On mobile, tell the user they need to tap to start. Otherwise, autoplay.
		if ( Util.isMobile() ) {

			showPlayButton();
			document.body.addEventListener( 'touchend', tapVideo );

		} else {

			event.videoElement.play();
		}

		// Attach to pause and play events, to notify the API.
		event.videoElement.addEventListener( 'pause', videoPause );
		event.videoElement.addEventListener( 'play', videoPlay );
		event.videoElement.addEventListener( 'timeupdate', updateVideoTimer );
		event.videoElement.addEventListener( 'ended', sendToPlayer.onEnded );

	}

	// Hide loading indicator.
	loadIndicator.hide();

	// Autopan only on desktop, for photos only, and only if autopan is enabled.
	if ( ! Util.isMobile() &&
    ! worldRenderer.sceneInfo.video &&
		! worldRenderer.sceneInfo.isAutopanOff ) {
		worldRenderer.autopan();
	}

	// Notify the API that we are ready, but only do this once.
	if ( !isReadySent ) {

		isReadySent = true;

		sendToPlayer.ready( connect.video ? event.videoElement.duration : null );
	}
}


/******************
 *
 */
function tapVideo() {

  hidePlayButton();
  onPlayRequest();

  // Prevent multiple play() calls on the video element.
  document.body.removeEventListener('touchend', tapVideo);
}

function onPlayRequest(data, noSend) {

  console.log('onPlayRequest');

  if (!worldRenderer.videoProxy) {
    sendToPlayer.onApiError('Attempt to play, but no video found.');
    return;
  }
  worldRenderer.videoProxy.play(data, noSend);

    sendToPlayer.onPlay();
}

function videoPlay(){

    sendToPlayer.onPlay();
    connect.overlay.updatePlayPauseIcon(false);

}
function videoPause(){

    sendToPlayer.onPause();
    connect.overlay.updatePlayPauseIcon(true);

}

function onPauseRequest( data, noSend ) {

  if (!worldRenderer.videoProxy) {
    sendToPlayer.onApiError('Attempt to pause, but no video found.');
    return;
  }
  worldRenderer.videoProxy.pause(data, noSend);

  sendToPlayer.onPause();

}

function clickPlayPause() {

  if ( connect.overlay.isPaused ) {

        onPlayRequest();

  } else {

        onPauseRequest();
    }
}

function onAddHotspot(e, noSend) {

  if (Util.isDebug()) {
    console.log('onAddHotspot', e);
  }

  // TODO: Implement some validation?

  if ( ! noSend ) {
    connect.send( 'onAddHotspot', e);
  }

  connect.hotspotsData.push(e);

  var pitch = parseFloat(e.pitch);
  var yaw = parseFloat(e.yaw);
  var radius = parseFloat(e.radius);
  var distance = parseFloat(e.distance);
  var id = e.id;

  worldRenderer.hotspotRenderer.add(pitch, yaw, radius, distance, id);

}

function onSetContent(e, noSend, skipFadeIn) {

  if (Util.isDebug()) {
    console.log('onSetContent', e);
  }

  if ( ! noSend ) {
    connect.send('onSetContent',e);
  }

  // store update in case its requested
  connect.content = e;

    // Remove all of the hotspots.
  worldRenderer.hotspotRenderer.clearAll();
  connect.hotspotsData = [];

  // Fade to black.
  worldRenderer.sphereRenderer.setOpacity(0, (skipFadeIn) ? 0 : 500).then(function() {
    // Then load the new scene.
    var scene = SceneInfo.loadFromAPIParams(e.contentInfo);
    worldRenderer.destroy();

    // Update the URL to reflect the new scene. This is important particularly
    // on iOS where we use a fake fullscreen mode.
    var url = scene.getCurrentUrl();
    //console.log('Updating url to be %s', url);
    window.history.pushState(null, 'VR View', url);

    // And set the new scene.
    return worldRenderer.setScene(scene);
  }).then(function() {
    // Then fade the scene back in.
    worldRenderer.sphereRenderer.setOpacity(1, 500);
  });
}

function onSetVolume(e) {
  // Only work for video. If there's no video, send back an error.
  if (!worldRenderer.videoProxy) {
    sendToPlayer.onApiError('Attempt to set volume, but no video found.');
    return;
  }

  worldRenderer.videoProxy.setVolume(e.volumeLevel);
  volume = e.volumeLevel;

  sendToPlayer.setVolume(e.volumeLevel)
}


function onUpdateTime(time, noSend) {

  if (!worldRenderer.videoProxy) {
    sendToPlayer.onApiError('Attempt to pause, but no video found.');
    return;
  }

  worldRenderer.videoProxy.setCurrentTime(time, noSend);

  /* send to player */
  onGetCurrentTime();
}

function onGetCurrentTime() {

  var time = worldRenderer.videoProxy.getCurrentTime();

  updateVideoTimer(time)

}
function updateVideoTimer(time) {

  if (time.path) {
    time.currentTime = time.path[0].currentTime;
    time.duration = time.path[0].duration;
  }

  connect.overlay.timeUpdate(time);
  sendToPlayer.timeUpdate(time);
}

function onSceneError(message) {
  showError('Loader: ' + message);
}

function onRenderError(message) {
  showError('Render: ' + message);
}

function showError(message, opt_title) {
  // Hide loading indicator.
  loadIndicator.hide();

  var error = document.querySelector('#error');
  error.classList.add('visible');
  error.querySelector('.message').innerHTML = message;

  var title = (opt_title !== undefined ? opt_title : 'Error');
  error.querySelector('.title').innerHTML = title;
}

function hideError() {
  var error = document.querySelector('#error');
  error.classList.remove('visible');
}

function showPlayButton() {
  var playButton = document.querySelector('#play-overlay');
  playButton.classList.add('visible');
}

function hidePlayButton() {
  var playButton = document.querySelector('#play-overlay');
  playButton.classList.remove('visible');
}

function showStats() {
  stats.setMode(0); // 0: fps, 1: ms

  // Align bottom-left.
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);
}

function loop(time) {
  // Use the VRDisplay RAF if it is present.
  if ( worldRenderer.vrDisplay ) {
    worldRenderer.vrDisplay.requestAnimationFrame( loop );
  } else {
    requestAnimationFrame( loop );
  }

  stats.begin();

  // Update the video if needed.
  if ( worldRenderer.videoProxy ) {
    worldRenderer.videoProxy.update( time );
    connect.overlay.scrubberUpdate( worldRenderer.videoProxy.getCurrentTime() );
  }
  connect.update();
  worldRenderer.render( time );
  worldRenderer.submitFrame();

  stats.end();
}

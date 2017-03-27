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
var vrView;
var playButton;
var muteButton;

function onLoad() {
  // Load VR View.
  vrView = new VRView.Player('#vrview', {
    width: '100%',
    height: 360,
		video: 'congo_2048.mp4',
    is_stereo: true,
    loop: false
    //is_debug: true,
    //default_heading: 90,
    //is_yaw_only: true,
    //is_vr_off: true,
  });

  vrView.on('ready', onVRViewReady);

  vrView.on('play', function() {
    console.log('media play');
    console.log(vrView.getDuration());
    playButton.classList.remove('paused');
  });

  vrView.on('pause', function() {
    console.log('media paused');
    playButton.classList.add('paused');
  });

  vrView.on('timeupdate', function(e) {
    document.querySelector('#time').innerText = formatTime(e.currentTime) + ' | ' + formatTime(e.duration);
    //console.log('playing ' + e.currentTime + ' of ' + e.duration + ' secs.');
  });

  vrView.on('ended', function() {
    console.log('media ended');
  });

  playButton = document.querySelector('#toggleplay');
  muteButton = document.querySelector('#togglemute');

  playButton.addEventListener('click', onTogglePlay);
  muteButton.addEventListener('click', onToggleMute);
}

function onVRViewReady() {

  console.log('vrView.isPaused', vrView.isPaused);

  // Set the initial state of the buttons.
  if (vrView.isPaused) {
    playButton.classList.add('paused');
  } else {
    playButton.classList.remove('paused');
  }

  // Set media on 00:02
  vrView.setCurrentTime(2);
}

function onTogglePlay() {
  if (vrView.isPaused) {
    vrView.play();
    playButton.classList.remove('paused');
  } else {
    vrView.pause();
    playButton.classList.add('paused');
  }
}

function onToggleMute() {
  var isMuted = muteButton.classList.contains('muted');
  if (isMuted) {
    vrView.setVolume(1);
  } else {
    vrView.setVolume(0);
  }
  muteButton.classList.toggle('muted');
}

function formatTime (time) {

  time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

  var minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time % 60);
  minutes = minutes <= 0 ? 0 : minutes;
  seconds = seconds <= 0 ? 0 : seconds;

  var result = (minutes < 10 ? '0' + minutes : minutes) + ':';
  result += seconds < 10 ? '0' + seconds : seconds;

  return result;
}

window.addEventListener('load', onLoad);


var Emitter = require('eventemitter3');
var playTime,scrubberInner,current, duration;

function Overlay(connect) {

  this.connect = connect;

}

Overlay.prototype = new Emitter();

Overlay.prototype.showing = false;

Overlay.prototype.onLoad = function () {

	window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
	window.addEventListener('touchmove', this.onMouseMove.bind(this), false);

	/* trigger toolbar hide if mouse exits iframe from toolbar */
	document.body.addEventListener('mouseout', (function(e) {

		if ( e.toElement === null || e.clientY > window.innerHeight - 30 ) {

			this.connect.controls.sendingMouse = 'exit';

			clearTimeout(window.timer);
			clearTimeout(window.timer2);

			window.timer = setTimeout(this.hideToolbar_.bind(this), 3000);

		}

	}).bind(this));

	this.toolOverlay = document.getElementById('tool-overlay');
	this.codeOverlay = document.getElementById('code-overlay');
	this.codeOverlay.addEventListener('click', (function (e) {

		e.preventDefault();
		this.connect.menu.toggle(false,false);

	}).bind(this), false);

  playTime = document.getElementById('play-time');
  this.playPauseButton = document.getElementById('play-pause-button');
  this.scrubberOuter = document.getElementById('scrubber-outer');

  if ( this.connect.video ) {

    scrubberInner = document.getElementById('scrubber-inner');

    this.spanA = document.getElementById('span-a');
    this.spanB = document.getElementById('span-b');

    this.playPauseButton.innerHTML = this.ICONS.play;
    this.playPauseButton.addEventListener('click',  this.clickPlayPause.bind(this), false);

    this.scrubberOuter.addEventListener('mousemove', this.showScrubTime.bind(this), false);
    this.scrubberOuter.addEventListener('mouseout', this.hideScrubTime.bind(this), false);
    this.scrubberOuter.addEventListener('click', this.scrubSetTime.bind(this), false);

    if ( this.connect.myInfo_.isMobile )
	    this.scrubberOuter.style.width = 'calc(98vw - 244px';

  } else {

    this.toolOverlay.removeChild(playTime);
    this.toolOverlay.removeChild(this.playPauseButton);
    this.toolOverlay.removeChild(this.scrubberOuter);

  }

  this.connectIcon = document.getElementById('connect-icon');
  this.connectIcon.innerHTML = this.ICONS.connect;
  this.connectIcon.title = 'connect';
  this.connectIcon.draggable = false;

  this.connectIcon.addEventListener('click', (function (e) {
    e.preventDefault();
    this.connect.menu.toggle(false,false);
  }).bind(this), false);

  this.connectIcon.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  this.connect.iconOne = document.getElementById('i-one');
  this.connect.iconTwo = document.getElementById('i-two');
  this.connect.iconPlus = document.getElementById('i-plus');

  this.connect.controls.iconOneCnt = 0;
  this.connect.controls.iconTwoCnt = 0;

  this.webvrButtons = document.getElementsByClassName('webvr-button');

  for ( var i = 0; i < this.webvrButtons.length; i++ ) {

    //console.log('webvr-button ' + (i+1) + ' ' + this.webvrButtons[i].title );

    this.toolOverlay.appendChild(this.webvrButtons[i]);
  }

};

/* this happens about once or twice per second */
Overlay.prototype.timeUpdate = function(time){

  current = time.currentTime;
  duration = time.duration;

  playTime.innerText = formatTime(current) + ' | ' + formatTime(duration);

};

/* this happens every frame */
Overlay.prototype.scrubberUpdate = function(e){
	
  this.connect.currTim = { currentTime: e.currentTime };

  var percent = e.currentTime / e.duration * 100;
  scrubberInner.style.transform = 'translateX(-' + (100 - percent) + '%)';

};

Overlay.prototype.showScrubTime = function(e){

  this.spanA.style.display = 'inline';
  this.spanA.style.left = e.pageX + 'px';
  this.spanB.innerHTML = formatTime(e.layerX / this.scrubberOuter.clientWidth * duration);

};

Overlay.prototype.hideScrubTime = function(e){

  this.spanA.style.display = 'none';
};

Overlay.prototype.scrubSetTime = function(e){

  /* todo: fullscreen, mobile */
  this.emit('scrubSetTime', { currentTime:e.layerX / this.scrubberOuter.clientWidth * duration });
};

Overlay.prototype.clickPlayPause = function() {

	this.emit( 'clickPlayPause' );

};

Overlay.prototype.updatePlayPauseIcon = function(isPaused) {

	this.isPaused = isPaused;

	if ( this.isPaused ) {

		this.playPauseButton.innerHTML = this.ICONS.play;

	} else {

		this.playPauseButton.innerHTML = this.ICONS.pause;

	}

};

Overlay.prototype.onMouseMove = function(e) {


	this.connect.controls.sendingMouse = { x: e.pageX, y: e.pageY };

	if ( this.connect.controls.dragging ) {

		if ( this.toolOverlay.style.opacity == 1 ) {

			clearTimeout( window.timer );
			clearTimeout( window.timer2 );

			this.hideToolbar_();

		}

	} else {

		if ( this.toolOverlay.style.opacity == 0 ) {

			this.toolOverlay.style.zIndex = 44;
			this.toolOverlay.style.opacity = 1

		}

		clearTimeout( window.timer );
		clearTimeout( window.timer2 );

		/* if no mouse or mouse is not over toolbar hide */
		if ( ! e.clientY || window.innerHeight - e.clientY > 31 ) {

			window.timer = setTimeout( this.hideToolbar_.bind( this ), 3000 );

		}

	}

};

Overlay.prototype.hideToolbar_ = function() {

	this.toolOverlay.style.opacity = 0;

  window.timer2 = setTimeout((function(){

		this.toolOverlay.style.zIndex = -5;

  }).bind(this), 320);

};

function formatTime (time) {

  time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

  var minutes = Math.floor(time / 60) % 60;
  var seconds = Math.floor(time % 60);
  minutes = minutes <= 0 ? 0 : minutes;
  seconds = seconds <= 0 ? 0 : seconds;

  var result = (minutes < 10 ? '0' + minutes : minutes) + ':';
  result += seconds < 10 ? '0' + seconds : seconds;

  return result;
}

Overlay.prototype.ICONS = {
  connect:
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.9 45.9">' +
    '<path id="i-two" d="M 21.3 27.1 C 19.7 28.7 17.7 29.6 15.5 29.8 C 17.4 31.5 18.6 34 18.6 36.7 C 18.6 41.8 14.4 46 9.3 46 C 4.4 46 0.4 42.2 0 37.4 C 4.4 35.5 7.4 31.2 7.4 26.1 C 7.4 24.3 7 22.4 6.2 20.8 C 7.3 20.2 8.4 19.5 9.3 18.5 C 11.6 16.2 12.9 12.9 12.9 9.6 L 12.9 9.5 L 12.9 9.4 L 12.8 7.8 L 23.9 7.8 L 24 20.1 C 24 22.9 23 25.3 21.3 27.1 Z" fill="currentColor" transform="matrix(-1, 0, 0, -1, 23.999999, 53.800003)"/>' +
    '<path id="i-one" d="M 35.2 29.6 C 37.1 31.3 38.3 33.8 38.3 36.5 C 38.3 41.6 34.1 45.8 29 45.8 C 23.9 45.8 19.7 41.6 19.7 36.5 C 19.7 33.8 20.9 31.3 22.8 29.6 C 18 29.2 14.1 25.2 14.1 20.3 L 14 18.4 L 28.2 18.4 L 43.8 18.4 L 43.9 20.1 C 43.9 22.6 42.9 25 41.2 26.8 C 39.4 28.5 37.4 29.4 35.2 29.6 Z" fill="currentColor" transform="matrix(-1, 0, 0, -1, 57.900005, 64.199998)"/>' +
    '<path id="i-plus" d="M 34.6 6.3 L 34.6 2.8 C 34.6 1.4 35.8 0.2 37.2 0.2 C 38.6 0.2 39.8 1.4 39.8 2.8 L 39.8 6.3 L 43.3 6.3 C 44.7 6.3 45.9 7.5 45.9 8.9 C 45.9 10.3 44.7 11.5 43.3 11.5 L 39.8 11.5 L 39.8 14.9 C 39.8 16.3 38.6 17.5 37.2 17.5 C 35.8 17.5 34.6 16.3 34.6 14.9 L 34.6 11.5 L 31.2 11.5 C 29.8 11.5 28.6 10.4 28.6 8.9 C 28.6 7.5 29.8 6.3 31.2 6.3 L 34.6 6.3 Z" fill="currentColor" transform="matrix(-1, 0, 0, -1, 74.500001, 17.699999)"/>' +
  '</svg>',
  play:
  '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="currentColor">'+
    '<path d="M8 5v14l11-7z"/>' +
    '<path d="M0 0h24v24H0z" fill="none"/>' +
  '</svg>',
  pause:
  '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="currentColor">' +
    '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' +
    '<path d="M0 0h24v24H0z" fill="none"/>' +
  '</svg>'
};

module.exports = Overlay;
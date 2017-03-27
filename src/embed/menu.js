/*
 * rtconnect.js
 * Copyright 2017 tfs All Rights Reserved.
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

function Menu(connect) {

  this.connect = connect;

  this.getNodes();

  this.gotoStartPage();

}

Menu.prototype = new Emitter();

Menu.prototype.toggle = function(close, cb) {

  if ( this.connectMask.style.opacity == 1 ) {

    this.connectMask.style.opacity = 0;

    setTimeout((function(){
      this.connectMask.style.zIndex = -5;
      if(cb)cb();
    }).bind(this),400);

  } else if ( ! close && this.connectMask.style.opacity == 0) {

    this.connectMask.style.zIndex = 5;
    this.connectMask.style.opacity = 1;

    setTimeout((function(){
      if(cb)cb();
    }).bind(this),400);
  }
};

Menu.prototype.gotoStartPage = function(){

  this.codeInput.value = '';
  this.startPage.style.display = 'block';
  this.enterCodePage.style.display = 'none';
  this.connectionsPage.style.display = 'none';
};

Menu.prototype.clickGetCode = function() {

  //this.connect.code_ = Util.randomString(4);
  this.connect.myInfo_.starter = true;
  this.connect.myInfo_.name = this.connect.myInfo_.type + '-1';

  this.connect.startConnect();
  this.toggle(true);

};

Menu.prototype.clickEnterCode = function() {

  this.startPage.style.display = 'none';
  this.enterCodePage.style.display = 'block';
  this.connectionsPage.style.display = 'none';

  this.codeInput.focus();

	if ( this.connect.myInfo_.isIOS )
    this.codeInput.onblur = this.sendCode.bind(this);
};

Menu.prototype.codeKeyDown = function(e) {

  if (e.keyCode === 13 )
    this.sendCode();
};

Menu.prototype.sendCode = function () {

	if ( ! this.connect.lookingForRoom_ && this.codeInput.value.length > 3 && this.codeInput.value.length < 10 ) {

		this.connect.lookingForRoom_ = true;
		this.connect.lookingForContent_ = true;
		this.connect.recentlyEntered_ = true;
		this.codeInputWrap.removeChild(this.codeInput);
		this.codeInputWrap.removeChild(this.codeInputX);
		this.codeInputWrap.innerHTML = ' looking... ';
		this.connect.startConnect( this.codeInput.value.toLowerCase() );

	}

};

Menu.prototype.codeFail = function () {

	this.codeExitDiv = document.createElement('div');
	this.codeExitDiv.id = 'code-exit-div';
	this.codeExitDiv.classList.add('button-div');
	this.codeExitDiv.innerHTML = 'exit';
	this.codeExitDiv.addEventListener('click', this.clickExit.bind(this), false);
	this.codeInputWrap.innerHTML = ' not found ';
	this.codeInputWrap.appendChild( this.codeExitDiv );

};

Menu.prototype.showConnectionsPage = function () {

	this.codeOverlay.innerHTML = this.connect.code_;
  this.codeOverlay.style.display = 'block';
  this.colorCode.textContent = this.connect.code_;
  this.connect.iconPlus.style.color = this.connect.color.on;

  this.startPage.style.display = 'none';
  this.enterCodePage.style.display = 'none';
  this.connectionsPage.style.display = 'block';
};

Menu.prototype.clickExit = function () {
  location.reload();
};

Menu.prototype.getNodes = function(){

  this.connectMask = document.getElementById('connect-mask');
  this.startPage = document.getElementById('start-page');
  this.enterCodePage = document.getElementById('enter-code-page');
  this.connectionsPage = document.getElementById('connections-page');
  this.codeOverlay = document.getElementById('code-overlay');
  this.connectX = document.getElementById('connect-x');
  this.getCodeDiv = document.getElementById('get-code-div');
  this.enterCodeDiv = document.getElementById('enter-code-div');
  this.codeInput = document.getElementById('code-input');
  this.codeInputX = document.getElementById('code-input-x');
  this.codeInputWrap = document.getElementById('code-input-wrap');
  this.colorCode = document.getElementById('color-code');
  this.exitButton = document.getElementById('exit-button');

  this.getCodeDiv.addEventListener('click', this.clickGetCode.bind(this), false);
  this.enterCodeDiv.addEventListener('click',this.clickEnterCode.bind(this),false);
  this.codeInput.onkeydown = this.codeKeyDown.bind(this);
  this.codeInputX.addEventListener('click', this.gotoStartPage.bind(this), false);
  this.exitButton.addEventListener('click', this.clickExit.bind(this), false);
};


Menu.prototype.addDevice = function(id) {

  var userName = id.substr(0,4);

  console.log('peer username: ' + userName);

  this.connect.peers[id].deviceDiv = document.createElement('div');
  this.connect.peers[id].deviceDiv.classList.add('device-listing');

  var deviceIcon = document.createElement('span');
  deviceIcon.classList.add('device-icon');
  deviceIcon.innerHTML = this.ICONS[ this.connect.peers[id].info.type ];
  deviceIcon.title = this.connect.peers[id].info.type + ' ' + userName;
  deviceIcon.draggable = false;
  deviceIcon.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });
  this.connect.peers[id].deviceDiv.appendChild( deviceIcon );

  var nameText = document.createTextNode(userName);
  this.connect.peers[id].deviceDiv.appendChild( nameText );

  if ( this.connect.myInfo_.type === 'computer' && this.connect.peers[id].info.type === 'phone' ) {

  }

  var magicMouseOption = document.createElement('span');
  magicMouseOption.classList.add('magic-mouse-option');
  magicMouseOption.textContent = 'magic mouse';
  magicMouseOption.title = 'use my mouse with this device';
  //magicMouseOption.addEventListener('click', this.magicMouse.bind(this, id), false);
  this.connect.peers[id].deviceDiv.appendChild( magicMouseOption );

  this.connectionsPage.appendChild(this.connect.peers[id].deviceDiv);

  this.connect.peers[id].cursorDiv = document.createElement('div');
	this.connect.peers[id].cursorDiv.classList.add('cursor-div');
	this.connect.peers[id].cursorDiv.innerHTML = this.ICONS.cursor;

  document.body.appendChild( this.connect.peers[id].cursorDiv );

};

Menu.prototype.magicMouse = function(id) {

	if ( this.peers[id].info.type === 'computer' ) {

	}
	this.toggle(true);
	this.connect.controls.enablePointerLock();
};


Menu.prototype.ICONS = {
  computer:
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 97.4 97.4">' +
    '<path d="M97.3 71.3c-0.1-0.1-0.2-0.2-0.4-0.2H0.5c-0.1 0-0.3 0.1-0.4 0.2 -0.1 0.1-0.1 0.3-0.1 0.4 0 0.1 1.5 9 12.8 9h71.9c11.3 0 12.7-8.9 12.8-9C97.4 71.5 97.4 71.4 97.3 71.3zM55.9 77.5h-14.5v-3.3h14.5V77.5z" fill="currentColor"/>' +
    '<path d="M10.5 67.6h76.4c1.1 0 2-0.9 2-2V18.7c0-1.1-0.9-2-2-2h-76.4c-1.1 0-2 0.9-2 2v46.9C8.5 66.7 9.4 67.6 10.5 67.6zM15.5 23.7h66.4v36.9h-66.4V23.7z" fill="currentColor"/>' +
  '</svg>',
  phone:
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35">' +
    '<path d="M25.3 0H9.7c-1.3 0-2.4 1.1-2.4 2.4v30.3C7.3 33.9 8.4 35 9.7 35h15.6c1.3 0 2.4-1.1 2.4-2.4V2.4C27.7 1.1 26.6 0 25.3 0zM15 1.7h5c0.2 0 0.3 0.1 0.3 0.3 0 0.2-0.1 0.3-0.3 0.3h-5c-0.2 0-0.3-0.1-0.3-0.3C14.7 1.8 14.8 1.7 15 1.7zM17.5 33.8c-0.7 0-1.2-0.5-1.2-1.2s0.5-1.2 1.2-1.2 1.2 0.5 1.2 1.2S18.2 33.8 17.5 33.8zM26 30.6H9V3.7h17V30.6z" fill="currentColor"/>' +
  '</svg>',
	cursor:
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173.3 173.3">' +
	  '<polygon points="137.1 102.7 36.2 0 36.2 144 65.6 118.5 88 173.3 120.7 159.9 98.3 105.1 " fill="currentColor"/>' +
	'</svg>'
};

module.exports = Menu;
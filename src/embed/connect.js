/*
 * connect.js
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
var Overlay = require('./overlay');
var Menu = require('./menu');
var socket;

function Connect(camera) {

	this.controls = new THREE.VRViewControls(this, camera);
	this.overlay =  new Overlay(this);
	this.menu = new Menu(this);

	this.controls.iconDelay = 20;
	this.started_ = false;
	this.color = {
		on: 'rgb(3,185,20)',
		off:'rgb(255,255,255)'
	};
	this.myInfo_ = {
		isMobile: Util.isMobile(),
		isIOS: Util.isIOS(),
		type: Util.isMobile() ? "phone" : "computer"
	};

	if ( this.myInfo_.isIOS ) {
		this.myInfo_.iosMode = 1;
	}

	this.controls.checkForGyro((function(res){
		this.myInfo_.hasGyro = res;
		console.log('gyroscope found: ' + res );
	}).bind(this));

}

Connect.prototype = new Emitter();
Connect.prototype.peers = {};
Connect.prototype.connected = false;
Connect.prototype.hotspotsData = [];

Connect.prototype.update = function() {
	this.controls.update();

	if ( this.controls.iconOneCnt > 0 ) {
		this.controls.iconOneCnt--;
		this.iconOne.style.color = this.color.on;
	} else {
		this.iconOne.style.color = this.color.off;
	}

	if ( this.controls.iconTwoCnt > 0 ) {
		this.controls.iconTwoCnt--;
		this.iconTwo.style.color = this.color.on;
	} else {
		this.iconTwo.style.color = this.color.off;
	}
};

Connect.prototype.startConnect = function(code) {

	if ( this.started_ )
		return;

	this.started_ = true;

	socket = io();
	socket.on( 'connect', soConnect.bind( this ) );
	socket.on( 'start code', soStartCode.bind( this ) );
	socket.on( 'code success', soCodeSuccess.bind( this ) );
	socket.on( 'code fail', soCodeFail.bind( this ) );
	socket.on( 'peer connected', soPeerConnected.bind( this ) );
	socket.on( 'starterInfo', soStarterInfo.bind( this ) );
	socket.on( 'onUpdateTime', this.onUpdateTime.bind( this ) );
	socket.on( 'onPlay', this.onPlay.bind( this ) );
	socket.on( 'onPause', this.onPause.bind( this ) );
	socket.on( 'onAddHotspot', this.onAddHotspot.bind( this ) );
	socket.on( 'onSetContent', this.onSetContent.bind( this ) );
	socket.on( 'onSetView', this.onSetView.bind( this ) );

	function soConnect(){

		this.id_ = socket.id;

		this.send = function (type, data) {

				data.sender = socket.id;
				socket.emit( 'broadcast', { type: type, data: data } );
		};

		if ( code )
			socket.emit('enter code', { code: code, info: this.myInfo_ });

		else
			socket.emit('get code', { info: this.myInfo_ });
	}

	function soStartCode(data){

		this.code_ = data.code;
		this.menu.showConnectionsPage();

		console.log('My id is ' + this.id_ );
	}

	function soCodeSuccess(data) {
		
		this.code_ = data.code;
		this.peers = data.peers;
		this.menu.showConnectionsPage();

		console.log('My id is ' + this.id_ );
	}

	function soCodeFail() {

		console.log('code fail');
		this.menu.codeFail();
	}

	function soPeerConnected(data) {

		console.log('device connected', data.id);

		this.controls.sending = ! this.myInfo_.isMobile;
		this.receivingView = ! this.myInfo_.isMobile;

		var id = data.id;

		if ( this.peers[id] ) {

			console.log('Error: Peer already connected')

		} else {

			this.peers[ id ] = {
				status: "connected",
				info: data.info
			};

			this.menu.addDevice(id);

			var startMsg = {
				id: this.id_,
				info: this.myInfo_,
				content: this.content,
				orientation: this.controls.curOri,
				hotspotsData: this.hotspotsData
			};

			if ( this.video ) {
				startMsg.video = this.currTim;
			}

			socket.emit( 'send to', { id:id, type:'starterInfo', data:startMsg } );

		}
	}

	function soStarterInfo(data) {

		var id = data.id;

		if ( this.peers[id].status === 'connected' ) {

			console.log('Error: Peer already connected')

		} else {

			this.peers[id].info = data.info;
			this.peers[id].status = 'connected';

			this.menu.addDevice(id);

			if ( this.lookingForContent_ ) {

				this.lookingForContent_ = false;
				this.menu.toggle( true, this.menu.showConnectionsPage.bind( this.menu ) );

				this.controls.incoming = data.orientation;

				if ( data.video ) {

					this.emit( 'onUpdateTime', data.video, true );

				} else {

					this.emit( 'onSetContent', data.content, true, true );

					for ( var i = 0; i < data.hotspotsData.length; i++ )
						this.emit( 'onAddHotspot', data.hotspotsData[ i ], true );

				}
			}

			setTimeout((function () {

				if ( this.myInfo_.isMobile ) {

					this.controls.sending = false;
					this.receivingView = true;
					this.mobileReceiveMode = true;

				} else {

					this.controls.sending = true;
					this.receivingView = true;
				}

				//console.log('connected to ' + id);

			}).bind(this), (this.recentlyEntered_ ? 200 : 0));

		}

	}

};

/* exposed for webrtc */
Connect.prototype.onUpdateTime = function ( data ) {
	this.emit('onUpdateTime', data, true);
};

Connect.prototype.onPlay = function (data) {
	this.emit('onPlay', data, true);
};

Connect.prototype.onPause = function (data) {
	this.emit('onPause', data, true);
};

Connect.prototype.onAddHotspot = function (data) {
	this.emit('onAddHotspot', data, true);
};

Connect.prototype.onSetContent = function (data) {
	this.emit('onSetContent', data, true);
};

Connect.prototype.onSetView = function (data) {

	if ( this.receivingView )
		this.controls.incoming = data.view;

	this.peers[ data.sender ].incMouse = data.mouse;
};

Connect.prototype.send = function (){};

module.exports = Connect;

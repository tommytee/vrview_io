/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 *
 * @author tfs
 */

THREE.VRViewControls = function ( connect, object ) {

	this.connect = connect;
	this.mouse = {};
	var self = this;

	var vrDisplay, vrDisplays;
	var standingMatrix = new THREE.Matrix4();
	var frameData = null;

	if ( 'VRFrameData' in window ) {
		frameData = new VRFrameData();
	}

	function gotVRDisplays( displays ) {

		vrDisplays = displays;

		if ( displays.length > 0 ) {

			vrDisplay = displays[ 0 ];

		} else {

			console.log( 'VR input not available.' );

		}

	}

	if ( navigator.getVRDisplays ) {

		navigator.getVRDisplays().then( gotVRDisplays );

	}

	// the Rift SDK returns the position in meters
	// this scale factor allows the user to define how meters
	// are converted to scene units.
	this.scale = 1;

	// If true will use "standing space" coordinate system where y=0 is the
	// floor and x=0, z=0 is the center of the room.
	this.standing = false;

	// Distance from the users eyes to the floor in meters. Used when
	// standing=true but the VRDisplay doesn't provide stageParameters.
	this.userHeight = 1.6;

	this.getVRDisplay = function () {

		return vrDisplay;

	};

	this.getVRDisplays = function () {

		return vrDisplays;

	};

	this.getStandingMatrix = function () {

		return standingMatrix;

	};

	this.incoming = false;
	this.sending = false;
	this.sendList = [];
	this.iconOneCnt = 0;
	this.iconTwoCnt = 0;

	this.enablePointerLock = function () {

		var element = document.body;
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();

		self.pointerLock = true;

		document.addEventListener('pointerlockchange', pointerLockChange.bind(this), false);
		document.addEventListener('mozpointerlockchange', pointerLockChange.bind(this), false);
		document.addEventListener('webkitpointerlockchange', pointerLockChange.bind(this), false);
		document.addEventListener('pointerlockerror', pointerLockChange.bind(this), false);
		document.addEventListener('mozpointerlockerror', pointerLockChange.bind(this), false);
		document.addEventListener('webkitpointerlockerror', pointerLockChange.bind(this), false);

		function pointerLockChange() {

			if (document.pointerLockElement !== element &&
				document.mozPointerLockElement !== element &&
				document.webkitPointerLockElement !== element) {
				self.pointerLock = false;
			}
		}

	};

	this.preSend = function () {

		var mouseMsg;

		if (this.sending) {

			if ( this.sendingOri ) {
				
				var oVal = JSON.stringify(this.sendingOri);
	
				if (oVal !== this.prevOVal) {
	
					this.prevOVal = oVal;
	
				} else {

					this.sendingOri = 'same';
	
				}
				
			}

			if ( this.sendingMouse ) {

				if ( this.sendingMouse === 'exit' ) {

					mouseMsg = 'exit';

				} else {

					mouseMsg = {
						x: this.sendingMouse.x / window.innerWidth,
						y: this.sendingMouse.y / window.innerHeight
					}
				}

			}

			if ( this.sendingOri || this.sendingMouse ) {
				
				this.connect.send('onSetView', {view: this.sendingOri, mouse: mouseMsg});
				
				this.iconOneCnt = this.iconDelay;
			}

		}

		this.sendingOri = false;
		this.sendingMouse = false;

	};

	this.update = function () {

		for ( var id in this.connect.peers ) {
			if ( this.connect.peers.hasOwnProperty(id) ) {

				if (this.connect.peers[id].incMouse) {

					if (this.connect.peers[id].incMouse === 'exit') {

						this.connect.peers[id].cursorDiv.style.display = 'none';

					} else {

						this.connect.peers[id].cursorDiv.style.display = 'block';
						this.connect.peers[id].cursorDiv.style.transform = 'translate(' +
							(window.innerWidth * this.connect.peers[id].incMouse.x - 4) + 'px, '+
							(window.innerHeight * this.connect.peers[id].incMouse.y - 2) + 'px)';

					}

					this.connect.peers[id].incMouse = false;
				}

			}
		}

		if ( this.incoming ) {

			if ( this.incoming  ) {

				if (this.incoming !== 'same') {

					object.quaternion.fromArray(this.incoming.ori);

					if (this.incoming.phi) {

						vrDisplay.phi_ = this.incoming.phi;
						vrDisplay.theta_ = this.incoming.theta;

					}

					this.prevOVal = JSON.stringify(this.incoming);
				}

			}

			this.iconTwoCnt = this.iconDelay;
			this.incoming = false;
			this.dragging = false;

		} else if ( ! this.connect.mobileReceiveMode ) {

			if ( vrDisplay ) {

				var pose;

				if (vrDisplay.getFrameData) {

						vrDisplay.getFrameData(frameData);
						pose = frameData.pose;

				} else if (vrDisplay.getPose) {

						pose = vrDisplay.getPose();

				}

				if (pose.orientation !== null) {

					object.quaternion.fromArray(pose.orientation);

					if (vrDisplay.rotateStart_) {

						this.curOri = {
							ori: pose.orientation,
							phi: vrDisplay.phi_,
							theta: vrDisplay.theta_
						};

						if (vrDisplay.isDragging_) {

							this.dragging = true;

							this.sendingOri = this.curOri;

						} else if ( this.pointerLock ) {

							this.sendingOri = this.curOri;

						} else {

							this.dragging = false;

						}

					} else {

						this.curOri = {
							ori: pose.orientation
						};

						this.sendingOri = this.curOri;

					}

				}

				if (pose.position !== null) {

						object.position.fromArray(pose.position);

				} else {

						object.position.set(0, 0, 0);

				}

				if (this.standing) {

					if (vrDisplay.stageParameters) {

						object.updateMatrix();

						standingMatrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
						object.applyMatrix(standingMatrix);

					} else {

						object.position.setY(object.position.y + this.userHeight);

					}

				}

				object.position.multiplyScalar(this.scale);
			}

		}

		this.preSend(this.sendingOri);

	};

	this.resetPose = function () {

		if ( vrDisplay ) {

			vrDisplay.resetPose();

		}

	};

	this.dispose = function () {

		vrDisplay = null;

	};

	this.magicMouse = function(id) {

		if ( this.connect.peers[id].info.type === 'computer' ) {

		}
		this.menu.toggle(true);
		this.controls.enablePointerLock();
	};

	this.checkForGyro = function(cb) {

		window.addEventListener("devicemotion", checkMotion, false);

		var gct = window.setTimeout(endGyroCheck, 200);

		function checkMotion(e) {

			window.clearTimeout(gct);
			gct = undefined;
			endGyroCheck();

			if (e.rotationRate.alpha || e.rotationRate.beta || e.rotationRate.gamma) {
				cb(true);
			} else {
				cb(false);
			}
		}

		function endGyroCheck() {
			window.removeEventListener("devicemotion", checkMotion, false)
		}
	};

};

module.exports = function (httpsServer, rData) {

	var io = require('socket.io')(httpsServer);

	io.on('connection', function (socket) {

		var roomCode, roomName;

		console.log('new connection: ' + socket.id);

		/* forwarding */
		socket.on('broadcast', function(data){

			socket.broadcast.volatile.to( roomName ).emit( data.type, data.data );
		});

		socket.on('send to', function(data){

			socket.broadcast.to( data.id ).emit( data.type, data.data );
		});

		socket.on('get code', function (data) {

			roomCode = rData.randomString(4);
			roomName = data.pathID + roomCode;

			console.log('start room: ' + roomName);

			socket.join( roomName );

			rData.rooms[ roomName ] = {
				peers: {},
				start: Date.now()
			};

			rData.rooms[ roomName ].peers[ socket.id ] = data.info;

			socket.emit('start code', { code:roomCode });

		});

		socket.on('enter code', function (data) {

			if ( rData.rooms[ data.pathID + data.code ] ) {

				roomCode = data.code;
				roomName = data.pathID + roomCode;

				if ( rData.rooms[ roomName ].peers[ socket.id ] ) {

					console.log( 'aPeer already in room: ' + socket.id );
				}

				socket.join( roomName );

				rData.rooms[ roomName ].peers[ socket.id ] = data.info;

				socket.emit( 'code success', {
					code: roomCode,
					peers: rData.rooms[ roomName ].peers
				} );

				socket.broadcast.to( roomName ).emit( 'peer connected', {
					id: socket.id,
					info: data.info
				} );

			} else {

				socket.emit( 'code fail' );

			}

		});

		socket.on('disconnect', function () {

			if ( rData.rooms[ roomName ] && rData.rooms[ roomName ].peers[ socket.id ] ) {

				delete rData.rooms[roomName].peers[socket.id];

				console.log('peer left ' + socket.id);

				socket.broadcast.to(roomName).emit('peer left', { id: socket.id });

			}

		});

	});

};

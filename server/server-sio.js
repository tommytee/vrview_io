module.exports = function (httpsServer, rData) {

	var io = require('socket.io')(httpsServer);

	io.on('connection', function (socket) {

		var roomCode;

		console.log('new connection: ' + socket.id);

		/* forwarding */
		socket.on('broadcast', function(data){

			socket.broadcast.volatile.to( roomCode ).emit( data.type, data.data );
		});

		socket.on('send to', function(data){

			socket.broadcast.to( data.id ).emit( data.type, data.data );
		});

		socket.on('get code', function (data) {

			roomCode = rData.randomString(4);

			console.log('start room code: ' + roomCode);

			socket.join( roomCode );

			rData.rooms[ roomCode ] = {
				peers: {},
				start: Date.now()
			};

			rData.rooms[ roomCode ].peers[ socket.id ] = data.info;

			socket.emit('start code', { code:roomCode });

		});

		socket.on('enter code', function (data) {

			if ( rData.rooms[ data.code ] ) {

				if ( rData.rooms[ data.code ].peers[ socket.id ] ) {

					console.log('aPeer already in room: ' + socket.id);
				}

				roomCode = data.code;

				socket.join( roomCode );

				rData.rooms[ roomCode ].peers[ socket.id ] = data.info;

				socket.emit('code success', {
					code: roomCode,
					peers: rData.rooms[ roomCode ].peers
				});

				socket.broadcast.emit('peer connected', {
					id: socket.id,
					info: data.info
				});


			} else {

				socket.emit('code fail');

			}

		});

		socket.on('disconnect', function () {

			if ( rData.rooms[ roomCode ] && rData.rooms[ roomCode ].peers[ socket.id ] ) {

				delete rData.rooms[roomCode].peers[socket.id];

				console.log('peer left ' + socket.id);

				socket.broadcast.to(roomCode).emit('peer left', { id: socket.id });

			}

		});

	});

};

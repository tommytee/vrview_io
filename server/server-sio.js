module.exports = function (httpsServer, rData) {

  var io = require( 'socket.io' )( httpsServer )
  var p2p = require( 'socket.io-p2p-server' ).Server

  io.on( 'connection', function ( socket ) {

    var roomCode, roomName;

    console.log( 'new connection: ' + socket.id );

    socket.on( 'broadcast', function ( data ) {

      console.log( 'broadcast ' + Date.now() + ' ' + roomName )

      for ( var id in rData.rooms[ roomName ].peers )
        if ( rData.rooms[ roomName ].peers.hasOwnProperty( id ) )
          if ( rData.rooms[ roomName ].peers[ id ].isIOS )
            socket.broadcast.volatile.to( id ).emit( data.type, data.data );

    } );

    socket.on( 'send to', function ( data ) {

      socket.broadcast.to( data.id ).emit( data.type, data.data );
    } );

    socket.on( 'get code', function ( data ) {

      roomCode = rData.randomString( 4 );
      roomName = data.pathID + roomCode;

      console.log( 'start room: ' + roomName );

      socket.join( roomName );
      p2p( socket, null, { name: roomName } );

      rData.rooms[ roomName ] = {
        peers: {},
        start: Date.now()
      };

      rData.rooms[ roomName ].peers[ socket.id ] = data.info;

      socket.emit( 'start code', { code: roomCode } );

    } );

    socket.on( 'enter code', function ( data ) {

      if ( rData.rooms[ data.pathID + data.code ] ) {

        roomCode = data.code;
        roomName = data.pathID + roomCode;

        if ( rData.rooms[ roomName ].peers[ socket.id ] ) {

          console.log( 'aPeer already in room: ' + socket.id );
        }

        socket.join( roomName );
        p2p( socket, null, { name: roomName } );

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

    } );

  } );

};

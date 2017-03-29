var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var compression = require('compression');
var path = require('path');
var rData = require('./r-data');

var options, portHTTPS = 4443;

if ( process.argv[2] === 'vrview') {

	portHTTPS = 443;
	options = {
		passphrase: process.argv[3],
		pfx: fs.readFileSync('../' + process.argv[4] )
	}

} else {

	options = {
		key: fs.readFileSync( '../key.pem' ),
		cert: fs.readFileSync( '../cert.pem' )
	};
}

var app = express();

app.use( compression() );
app.use( express.static('public') );

var httpsServer = https.createServer(options, app);

require('./server-sio')(httpsServer, rData);

httpsServer.listen(portHTTPS, function () {
	console.log( 'https on ' + portHTTPS );
});

if ( process.argv[2] === 'vrview') {

	/* https to https */
	http.createServer(function (req, res) {
		res.writeHead(301, {"Location": "https://" + req.headers['host'] + req.url});
		res.end();
	}).listen(80);

}

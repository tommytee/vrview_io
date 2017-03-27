This fork of VR View has many changes
================
Embed is served from /embed instead of /  <br />
Video has loop option and time. (ron666) <br />
Video has scrubber/slider. <br />
Users can connect views. <br />

uses express and socket.io

VR View
=======

VR View allows you to embed 360 degree VR media into websites on desktop and
mobile. For more information, please read the documentation available at
<http://developers.google.com/cardboard/vrview>.

# Building

This project uses browserify to manage dependencies and build.  Watchify is
especially convenient to preserve the write-and-reload model of development.
This package lives in the npm index.

Relevant commands:

    npm start - starts nodejs server (on ubuntu this might need to edit node=nodejs)
    npm run build - builds the iframe embed.
    npm run build-api - builds the JS API.
    npm run watch - auto-builds the iframe embed whenever any source changes.
    npm run watch-api - auto-builds the JS API code whenever any source changes.

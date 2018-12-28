"use strict";

var fs = require("fs");
var path = require("path");
var AirTunesServer = require("nodetunes");
var airtunes = require("airtunes");

var config = JSON.parse(fs.readFileSync("config.json"));
var server = new AirTunesServer({ serverName : config.groupName });
var endpoints = config.endpoints;
var devices;
var currentStream;


server.on("clientConnected", function(stream) {
	console.log("clientConnected");
	devices = [];
	endpoints.forEach(function(host) {
		var dev = airtunes.add(host.host, { port: host.port, volscale: host.volscale });		
		dev.on('status', function(status) {
			console.log('Status', dev.key, status)
		})
		dev.on('error', function(err) {
			console.log('Error', dev.key, error)
		})
		devices.push(dev)
	});
	currentStream = stream;
	stream.pipe(airtunes);
});


server.on("clientDisconnected", function() {
	console.log("clientDisconnected");
	currentStream.unpipe();
	airtunes.stopAll(function() {
		console.log("All devices stopped")
	});
});

server.on("error", function(err) {
	console.log("Error: " + err.message );
});


server.on("progressChange", function(progress) {
	// console.log('progressChange', progress)
	devices.forEach(function(device) {
		device.setProgress(progress)
	})
})

server.on("artworkChange", function(artwork) {
	// console.log('artworkChange', artwork)
	devices.forEach(function(device) {
		device.setArtwork(artwork, 'image/jpeg')
	})
})

server.on("metadataChange", function(metadata) {
	// console.log(metadata)
	console.log("Now playing \"" + metadata.minm + "\" by " + metadata.asar + " from \"" + metadata.asal + "\" len \"" + metadata.astm + "\"");
	devices.forEach(function(device) {
		device.setTrackInfo(metadata.minm, metadata.asar ? metadata.asar : '', metadata.asal ? metadata.asal : '')
		if (metadata.astm) {
			device.setTrackLength(metadata.astm)
		}
	})
});

server.on("volumeChange", function(volume) {
	volume = (volume + 30) / 30 * 100
	console.log("volumeChange " + volume);
	devices.forEach(function(device) {
		device.setVolume(volume);
	});
});

server.start();

console.log(config.groupName + " started");

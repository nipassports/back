var express = require('express');
var https = require('https');
var http = require('http');
var app = require('./app');
var fs = require('fs');

var key = fs.readFileSync('/srv/certs/privkey.pem');
var cert = fs.readFileSync('/srv/certs/cert.pem');

var options = {
	key: key,
	cert: cert
};

https.createServer(options, app).listen(3000);

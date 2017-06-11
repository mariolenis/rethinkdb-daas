"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var http = require("http");
var https = require("https");
var debug = require("morgan");
var bodyParser = require("body-parser");
var fs = require("fs");
var path = require("path");
var io = require("socket.io");
var fn = require("./routes/routes");
var realtime_1 = require("./realtime");
var Server = (function () {
    function Server() {
        this.app = express();
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        var port = 443;
        var server;
        try {
            var sslOptions = {
                key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
            };
            server = https.createServer(sslOptions, this.app);
        }
        catch (e) {
            port = 3200;
            server = http.createServer(this.app);
        }
        new realtime_1.Realtime(io(server));
        this.app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.app.post('/api/put', fn.putRoute.bind(fn.putRoute));
        this.app.post('/api/list', fn.listRoute.bind(fn.listRoute));
        this.app.post('/api/update', fn.updateRoute.bind(fn.updateRoute));
        this.app.post('/api/filter', fn.filterRoute.bind(fn.filterRoute));
        this.app.post('/api/delete', fn.deleteRoute.bind(fn.deleteRoute));
        this.app.get('/api', function (req, res) {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        server.listen(port, function () {
            console.log('Listening on port ' + port);
        });
    }
    return Server;
}());
exports.Server = Server;
new Server();
//# sourceMappingURL=main.js.map
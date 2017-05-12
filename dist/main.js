"use strict";
var express = require("express");
var http = require("http");
var debug = require("morgan");
var bodyParser = require("body-parser");
var io = require("socket.io");
var fn = require("./routes/routes");
var realtime_1 = require("./realtime");
var Server = (function () {
    function Server() {
        this.app = express();
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        var httpServer = http.createServer(this.app);
        new realtime_1.Realtime(io(httpServer));
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
        httpServer.listen(3200);
    }
    return Server;
}());
exports.Server = Server;
new Server();
//# sourceMappingURL=main.js.map
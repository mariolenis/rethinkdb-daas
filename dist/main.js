"use strict";
var express = require("express");
var http = require("http");
var debug = require("morgan");
var bodyParser = require("body-parser");
var fn = require("./routes/routes");
var Server = (function () {
    function Server() {
        this.app = express();
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.put('/api', fn.putRoute.bind(fn.putRoute));
        this.app.get('/api', function (req, res) {
            res.status(200).send('API Ready!');
        });
        var httpServer = http.createServer(this.app);
        httpServer.listen(3200);
    }
    return Server;
}());
exports.Server = Server;
new Server();
//# sourceMappingURL=main.js.map
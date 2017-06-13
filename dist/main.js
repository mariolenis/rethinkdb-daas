"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const https = require("https");
const debug = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const io = require("socket.io");
const fn = require("./routes/routes");
const realtime_1 = require("./realtime");
class Server {
    constructor() {
        this.app = express();
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        let port = 443;
        let server;
        try {
            let sslOptions = {
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
        this.app.use((req, res, next) => {
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
        this.app.get('/api', (req, res) => {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        server.listen(port, () => {
            console.log('Listening on port ' + port);
        });
    }
}
exports.Server = Server;
new Server();
//# sourceMappingURL=main.js.map
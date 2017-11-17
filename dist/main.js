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
const routerFn = require("./routes");
const realtime_1 = require("./realtime");
const env_config_1 = require("./env.config");
class Server {
    constructor() {
        this.app = express();
        const whiteList = ['localhost', '192.168.10.'];
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            whiteList.forEach(allowed => {
                if (req.headers.origin.indexOf(allowed) > -1) {
                    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                    return;
                }
            });
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.app.post('/api/put', routerFn.putRoute.bind(routerFn.putRoute));
        this.app.post('/api/list', routerFn.listRoute.bind(routerFn.listRoute));
        this.app.post('/api/update', routerFn.updateRoute.bind(routerFn.updateRoute));
        this.app.post('/api/delete', routerFn.deleteRoute.bind(routerFn.deleteRoute));
        this.app.post('/api/createUser', routerFn.createUser.bind(routerFn.createUser));
        this.app.post('/api/authUser', routerFn.authUser.bind(routerFn.authUser));
        this.app.post('/api/isAuth', routerFn.isAuthenticated.bind(routerFn.isAuthenticated));
        this.app.get('/api', (req, res) => {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        let server;
        try {
            let sslOptions = {
                key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
            };
            server = https.createServer(sslOptions, this.app);
            server.listen(env_config_1.web_api.SSL_PORT, () => {
                console.log('Listening on SSL port ' + env_config_1.web_api.SSL_PORT);
            });
            http.createServer((req, res) => {
                res.writeHead(301, {
                    "Location": "https://" + req.headers['host'] + req.url
                });
                res.end();
            }).listen(env_config_1.web_api.PORT);
        }
        catch (e) {
            server = http.createServer(this.app);
            server.listen(env_config_1.web_api.PORT, () => {
                console.log('Listening on port ' + env_config_1.web_api.PORT);
            });
        }
        new realtime_1.Realtime(io(server));
    }
}
exports.Server = Server;
new Server();
//# sourceMappingURL=main.js.map
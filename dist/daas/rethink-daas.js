"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const io = require("socket.io");
const controller_1 = require("./controller");
const realtime_1 = require("./realtime");
__export(require("./controller"));
class RethinkDaaS {
    constructor(server) {
        this.router = express.Router();
        this.router.get('/api', (req, res) => {
            res.status(200).send('Rethink DaaS - API Ready!');
        });
        this.router.post('/api/put', (req, res) => {
            let dbSubscription = controller_1.DBControl.put(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/list', (req, res) => {
            let dbSubscription = controller_1.DBControl.list(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/update', (req, res) => {
            let dbSubscription = controller_1.DBControl.update(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/delete', (req, res) => {
            let dbSubscription = controller_1.DBControl.remove(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.initRealtime(server);
    }
    initRealtime(server) {
        new realtime_1.Realtime(io(server));
    }
    getRethinkDBRoutes() {
        return this.router;
    }
}
exports.RethinkDaaS = RethinkDaaS;
//# sourceMappingURL=rethink-daas.js.map
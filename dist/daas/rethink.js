"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const io = require("socket.io");
const controller = require("./controller");
const realtime_1 = require("./realtime");
class Rethink {
    constructor(server) {
        this.router = express.Router();
        this.router.get('/api', (req, res) => {
            res.status(200).send('Rethink DaaS - API Ready!');
        });
        this.router.post('/api/put', (req, res) => {
            let dbSubscription = controller.putRoute(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/list', (req, res) => {
            let dbSubscription = controller.listRoute(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/update', (req, res) => {
            let dbSubscription = controller.updateRoute(req.body).subscribe(response => {
                res.status(200).json(response);
                if (!dbSubscription.closed)
                    dbSubscription.unsubscribe();
            }, err => res.status(400).json(err));
        });
        this.router.post('/api/delete', (req, res) => {
            let dbSubscription = controller.deleteRoute(req.body).subscribe(response => {
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
exports.Rethink = Rethink;
//# sourceMappingURL=rethink.js.map
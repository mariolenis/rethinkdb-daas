"use strict";
var db = require("./db");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/map");
var env_config_1 = require("./env.config");
function listRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
        .flatMap(function (conn) { return db.auth(conn, query.api_key); })
        .flatMap(function (conn) { return db.list(conn, query.table, query.query); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.listRoute = listRoute;
function putRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
        .flatMap(function (conn) { return db.auth(conn, query.api_key); })
        .flatMap(function (conn) { return db.insert(conn, query.table, query.object); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.putRoute = putRoute;
function updateRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
        .flatMap(function (conn) { return db.auth(conn, query.api_key); })
        .flatMap(function (conn) { return db.update(conn, query.table, query.object, query.query); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.updateRoute = updateRoute;
function filterRoute(req, res, next) {
}
exports.filterRoute = filterRoute;
function deleteRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
        .flatMap(function (conn) { return db.auth(conn, query.api_key); })
        .flatMap(function (conn) { return db.remove(conn, query.table, query.object); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.deleteRoute = deleteRoute;
//# sourceMappingURL=routes.js.map
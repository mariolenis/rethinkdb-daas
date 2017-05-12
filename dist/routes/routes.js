"use strict";
var db = require("./db");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/map");
function putRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: 'localhost', port: 28015, db: query.db })
        .flatMap(function (conn) { return db.insert(conn, query.table, query.object); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.putRoute = putRoute;
function updateRoute(req, res, next) {
}
exports.updateRoute = updateRoute;
function listRoute(req, res, next) {
    var query = req.body;
    var dbSuscription = db.connectDB({ host: 'localhost', port: 28015, db: query.db })
        .flatMap(function (conn) { return db.list(conn, query.table, parseInt(query.limit), query.filter); })
        .subscribe(function (response) {
        res.status(200).json(response);
        if (!dbSuscription.closed)
            dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.listRoute = listRoute;
function filterRoute(req, res, next) {
}
exports.filterRoute = filterRoute;
function deleteRoute(req, res, next) {
}
exports.deleteRoute = deleteRoute;
//# sourceMappingURL=routes.js.map
"use strict";
var db = require("./db");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/map");
function putRoute(req, res, next) {
    var query = req.body;
    var dbName = req.header('db');
    var dbSuscription = db.connectDB({ host: 'localhost', port: 28015, db: dbName })
        .flatMap(function (conn) { return db.insert(conn, query.table, query.object); })
        .subscribe(function (response) {
        res.status(200).json(response);
        // Finalizar la conexión
        dbSuscription.unsubscribe();
    }, function (err) { return res.status(400).json(err); });
}
exports.putRoute = putRoute;
function updateRoute(req, res, next) {
}
exports.updateRoute = updateRoute;
function getRoute(req, res, next) {
}
exports.getRoute = getRoute;
function filterRoute(req, res, next) {
}
exports.filterRoute = filterRoute;
function deleteRoute(req, res, next) {
}
exports.deleteRoute = deleteRoute;
//# sourceMappingURL=routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./db");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/map");
const config_1 = require("./config");
var DBControl;
(function (DBControl) {
    function list(query) {
        return db.connectDB({ host: config_1.rethinkDBConfig.host, port: config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(conn => db.auth(conn, query.api_key))
            .flatMap(conn => db.list(conn, query.table, query.query));
    }
    DBControl.list = list;
    function put(query) {
        return db.connectDB({ host: config_1.rethinkDBConfig.host, port: config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(conn => db.auth(conn, query.api_key))
            .flatMap(conn => db.insert(conn, query.table, query.object));
    }
    DBControl.put = put;
    function update(query) {
        return db.connectDB({ host: config_1.rethinkDBConfig.host, port: config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(conn => db.auth(conn, query.api_key))
            .flatMap(conn => db.update(conn, query.table, query.object, query.query));
    }
    DBControl.update = update;
    function remove(query) {
        return db.connectDB({ host: config_1.rethinkDBConfig.host, port: config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(conn => db.auth(conn, query.api_key))
            .flatMap(conn => db.remove(conn, query.table, query.object));
    }
    DBControl.remove = remove;
})(DBControl = exports.DBControl || (exports.DBControl = {}));
//# sourceMappingURL=controller.js.map
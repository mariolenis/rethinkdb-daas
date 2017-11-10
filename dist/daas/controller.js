"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./db");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/map");
const env_config_1 = require("../env.config");
var DBControl;
(function (DBControl) {
    function list(query) {
        return validateAuth(query)
            .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db }, 'control-list'))
            .flatMap(conn => db.list(conn, query.table, query.query));
    }
    DBControl.list = list;
    function put(query) {
        return validateAuth(query)
            .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db }, 'control-put'))
            .flatMap(conn => db.insert(conn, query.table, query.object));
    }
    DBControl.put = put;
    function update(query) {
        return validateAuth(query)
            .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db }, 'control-update'))
            .flatMap(conn => db.update(conn, query.table, query.object, query.query));
    }
    DBControl.update = update;
    function remove(query) {
        return validateAuth(query)
            .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db }, 'control-remove'))
            .flatMap(conn => db.remove(conn, query.table, query.object));
    }
    DBControl.remove = remove;
    function validateAuth(query) {
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb }, 'control-auth')
            .flatMap(conn => db.auth(conn, query.api_key));
    }
})(DBControl = exports.DBControl || (exports.DBControl = {}));
//# sourceMappingURL=controller.js.map
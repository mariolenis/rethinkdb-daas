"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./daas/db");
const env_config_1 = require("./env.config");
class Realtime {
    constructor(ioSocket) {
        this.ioSocket = ioSocket;
        this.watcher = [];
        this.ioSocket.on('connection', (socket) => {
            console.log('Client Connected ' + socket.id);
            socket.on('register', (params, response) => this.registerConnection(socket, params, response));
            socket.on('disconnect', () => {
                console.log("Client Disconnected " + socket.id);
                let indexObserver = this.watcher.findIndex(w => w.id === socket.id);
                if (indexObserver > -1) {
                    console.log('Cleaning watcher ' + socket.id);
                    this.watcher[indexObserver].subs.unsubscribe();
                    this.watcher.splice(indexObserver, 1);
                }
            });
        });
    }
    registerConnection(socket, params, responseFn) {
        let [dbConf, queryParams] = JSON.parse(params);
        console.log('[realtime.constructor] Validating ' + socket.id + ' to connect to ' + dbConf.database + ' with API_KEY ' + dbConf.api_key);
        db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb }, 'auth')
            .flatMap(conn => db.auth(conn, dbConf.api_key))
            .map(conn => conn.close())
            .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: dbConf.database }, 'table-veryf'))
            .flatMap(conn => db.tableVerify(conn, dbConf.database, queryParams.table))
            .map(conn => {
            this.enrollChangeListener(dbConf, queryParams, socket.id);
            return conn;
        })
            .switchMap(r_conn => db.list(r_conn, queryParams.table, queryParams.query))
            .map(result => {
            console.log('[realtime.registerConnection] Emiting result of query to ' + socket.id);
            this.ioSocket.to(socket.id)
                .emit(queryParams.table, JSON.stringify({ init: result }));
        })
            .subscribe(() => responseFn(JSON.stringify({ msj: 'SUCCESS' })), err => responseFn(JSON.stringify({ err: err })));
    }
    enrollChangeListener(dbConf, queryParams, room) {
        let observer = this.watcher.find(w => w.id === room);
        if (!observer) {
            this.watcher.push({
                id: room,
                subs: this.startSubscription(dbConf.database, queryParams, room)
            });
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(queryParams) + " " + this.watcher.length);
        }
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + JSON.stringify(queryParams));
            observer.subs.unsubscribe();
            observer.subs = this.startSubscription(dbConf.database, queryParams, room);
        }
    }
    startSubscription(database, queryParams, room) {
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: database }, 'realtime')
            .flatMap(conn => db.changes(conn, { query: queryParams.query, table: queryParams.table }))
            .subscribe(changes => {
            console.log('Emitting changes to ' + room + ' ' + JSON.stringify(queryParams));
            this.ioSocket.to(room)
                .emit(queryParams.table, JSON.stringify(changes));
        }, err => this.ioSocket.to(room)
            .emit(queryParams.table, JSON.stringify({ err: err })));
    }
}
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
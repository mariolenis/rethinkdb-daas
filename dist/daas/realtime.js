"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./db");
const env_config_1 = require("../env.config");
class Realtime {
    constructor(ioSocket) {
        this.ioSocket = ioSocket;
        this.watcher = [];
        this.ioSocket.on('connection', (socket) => {
            console.log('Client Connected ' + socket.id);
            socket.on('validate', (conn, response) => {
                try {
                    let connRequest = JSON.parse(conn);
                    console.log('[realtime.constructor] Validating ' + socket.id + ' to connect to ' + connRequest.db + ' with API_KEY ' + connRequest.api_key);
                    db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb }, 'auth')
                        .flatMap(conn => db.auth(conn, connRequest.api_key))
                        .map(conn => conn.close())
                        .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: connRequest.db }, 'list'))
                        .flatMap(conn => db.tableVerify(conn, connRequest.db, connRequest.table))
                        .map(conn => conn.open)
                        .subscribe(() => response('ok'), () => response('err'));
                }
                catch (e) {
                    console.error(e);
                    response('err: ' + JSON.stringify(e));
                }
            });
            socket.on('listenChanges', (message) => this.enrollChangeListener(message, socket.id));
            socket.on('disconnect', () => this.disconnectionHandler(socket.id));
        });
    }
    disconnectionHandler(socketID) {
        console.log("Client Disconnected " + socketID);
        let indexObserver = this.watcher.findIndex(w => w.id === socketID);
        if (indexObserver > -1) {
            console.log('Cleaning watcher ' + socketID);
            this.watcher[indexObserver].subs.unsubscribe();
            this.watcher.splice(indexObserver, 1);
        }
    }
    enrollChangeListener(queryString, room) {
        let query = JSON.parse(queryString);
        let observer = this.watcher.find(w => w.id === room);
        if (!observer) {
            this.watcher.push({
                id: room,
                subs: this.changesSubscription(query, room)
            });
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(query) + " " + this.watcher.length);
        }
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + query.table);
            observer.subs.unsubscribe();
            observer.subs = this.changesSubscription(query, room);
        }
    }
    changesSubscription(query, room) {
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db }, 'realtime')
            .flatMap(conn => db.changes(conn, query))
            .subscribe(changes => {
            console.log('Emitting changes to ' + room + ' ' + JSON.stringify(query));
            this.ioSocket.to(room)
                .emit(query.table, JSON.stringify(changes));
        });
    }
}
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
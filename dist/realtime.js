"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./routes/db");
const env_config_1 = require("./routes/env.config");
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
                    db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb })
                        .flatMap(conn => db.auth(conn, connRequest.api_key))
                        .map(conn => conn.close())
                        .flatMap(() => db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: connRequest.db }))
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
            socket.on('disconnect', () => {
                console.log("Client Disconnected " + socket.id);
                let indexObserver = this.watcher.findIndex(w => w.id === socket.id);
                if (indexObserver > -1) {
                    console.log('Cleaning watcher ' + socket.id);
                    this.watcher[indexObserver].subs.unsubscribe();
                    this.watcher.splice(indexObserver);
                }
            });
        });
    }
    enrollChangeListener(queryString, room) {
        let query = JSON.parse(queryString);
        let observer = this.watcher.find(w => w.id === room);
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(query));
            this.watcher.push({
                id: room,
                subs: this.changesSubscription(query, room)
            });
        }
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + query.table);
            observer.subs.unsubscribe();
            observer.subs = this.changesSubscription(query, room);
        }
    }
    changesSubscription(query, room) {
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(conn => db.changes(conn, query))
            .subscribe(changes => {
            console.log('Emitting changes to ' + room);
            this.ioSocket.to(room)
                .emit(query.table, JSON.stringify(changes));
        });
    }
}
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
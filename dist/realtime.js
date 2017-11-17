"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("./daas/db");
const env_config_1 = require("./env.config");
class Realtime {
    constructor(ioSocket) {
        this.ioSocket = ioSocket;
        this.watcher = [];
        this.ioSocket.use((socket, next) => {
            const query = socket.handshake.query.payload;
            const dbConf = JSON.parse(query);
            console.log('[realtime.constructor.middleware] Validating ' + socket.id + ' to connect to ' + dbConf.database + ' with API_KEY ' + dbConf.api_key);
            db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb }, 'auth')
                .flatMap(conn => db.auth(conn, dbConf.api_key))
                .map(conn => conn.close())
                .subscribe(() => next(), err => next(new Error(err)));
        });
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
            socket.emit('connection', socket.id);
        });
    }
    registerConnection(socket, params, responseFn) {
        const queryParams = JSON.parse(params);
        db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: queryParams.database }, 'table-veryf')
            .flatMap(conn => db.tableVerify(conn, queryParams.database, queryParams.table))
            .map(conn => {
            this.enrollChangeListener(queryParams, socket.id);
            return conn;
        })
            .switchMap(r_conn => db.list(r_conn, queryParams.table, queryParams.query))
            .map(result => {
            console.log('[realtime.registerConnection] Emiting result of query to ' + socket.id);
            this.ioSocket.to(socket.id)
                .emit(socket.id, JSON.stringify({}));
            result.forEach(new_val => {
                this.ioSocket.to(socket.id)
                    .emit(socket.id, JSON.stringify({ new_val: new_val }));
            });
            console.log('[realtime.registerConnection] Done!');
        })
            .subscribe(() => responseFn(JSON.stringify({ msj: 'SUCCESS' })), err => responseFn(JSON.stringify({ err: err })));
    }
    enrollChangeListener(queryParams, room) {
        let observer = this.watcher.find(w => w.id === room);
        if (!observer) {
            this.watcher.push({
                id: room,
                subs: this.startSubscription(queryParams, room)
            });
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(queryParams) + " " + this.watcher.length);
        }
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + JSON.stringify(queryParams));
            observer.subs.unsubscribe();
            observer.subs = this.startSubscription(queryParams, room);
        }
    }
    startSubscription(queryParams, room) {
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: queryParams.database }, 'realtime')
            .flatMap(conn => db.changes(conn, { query: queryParams.query, table: queryParams.table }))
            .subscribe(changes => {
            console.log('Emitting changes to ' + room + ' ' + JSON.stringify(queryParams));
            this.ioSocket.to(room)
                .emit(room, JSON.stringify(changes));
        }, err => {
            this.ioSocket.to(room)
                .emit(room, JSON.stringify({ err: err }));
        });
    }
}
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
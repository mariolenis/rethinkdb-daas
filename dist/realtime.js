"use strict";
var db = require("./routes/db");
var env_config_1 = require("./routes/env.config");
var Realtime = (function () {
    function Realtime(ioSocket) {
        var _this = this;
        this.ioSocket = ioSocket;
        this.watcher = [];
        this.ioSocket.on('connection', function (socket) {
            console.log('Client Connected ' + socket.id);
            socket.on('join', function (conn, responseFn) {
                try {
                    var connRequest_1 = JSON.parse(conn);
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + connRequest_1.db + ' with API_KEY ' + connRequest_1.api_key);
                    db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb })
                        .flatMap(function (conn) { return db.auth(conn, connRequest_1.api_key); })
                        .map(function (conn) { return conn.close(); })
                        .flatMap(function () { return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: connRequest_1.db }); })
                        .flatMap(function (conn) { return db.tableVerify(conn, connRequest_1.db, connRequest_1.table); })
                        .map(function (conn) { return conn.open; })
                        .subscribe(function () {
                        socket.join(socket.id);
                        responseFn('ok');
                    }, function () { return responseFn('err'); });
                }
                catch (e) {
                    console.error(e);
                    responseFn('err: ' + JSON.stringify(e));
                }
            });
            socket.on('listenChanges', function (message) { return _this.enrollChangeListener(message, socket.id); });
            socket.on('disconnect', function () {
                console.log("Client Disconnected " + socket.id);
            });
        });
    }
    Realtime.prototype.enrollChangeListener = function (queryString, room) {
        var query = JSON.parse(queryString);
        var observer = this.watcher.filter(function (w) { return w.id === room; }).pop();
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + query.table);
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
    };
    Realtime.prototype.changesSubscription = function (query, room) {
        var _this = this;
        return db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
            .flatMap(function (conn) { return db.changes(conn, query); })
            .subscribe(function (changes) { return _this.ioSocket.to(room).emit(query.table, JSON.stringify(changes)); });
    };
    return Realtime;
}());
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
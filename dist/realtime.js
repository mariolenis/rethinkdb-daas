"use strict";
var _ = require("lodash");
var db = require("./routes/db");
var crypto = require("crypto");
var env_config_1 = require("./routes/env.config");
var Realtime = (function () {
    function Realtime(ioSocket) {
        var _this = this;
        this.ioSocket = ioSocket;
        this.watcher = [];
        this.ioSocket.on('connection', function (socket) {
            console.log('Client Connected ' + socket.id);
            socket.on('join', function (conn) {
                try {
                    var connRequest_1 = JSON.parse(conn);
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + connRequest_1.db + ' with API_KEY ' + connRequest_1.api_key);
                    _this.enrollRoom(connRequest_1);
                    db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: env_config_1.rethinkDBConfig.authDb })
                        .flatMap(function (conn) { return db.auth(conn, connRequest_1.api_key); })
                        .map(function (conn) { return conn.open; })
                        .subscribe(function () { return socket.join(connRequest_1.db); }, function (err) { return socket.emit('err', 'Unathorized to db ' + connRequest_1.db + " " + err); });
                }
                catch (e) {
                    console.error(e);
                    socket.emit('err', e);
                }
            });
            socket.on('disconnect', function () {
                console.log("Client Disconnected " + socket.id);
            });
        });
    }
    Realtime.prototype.enrollRoom = function (query) {
        var _this = this;
        var hashid = crypto.createHash('md5').update(query.db + query.table).digest('hex');
        var observer = _.find(this.watcher, { id: hashid });
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + query.db + ') for ' + query.table);
            observer = {
                id: hashid,
                subs: db.connectDB({ host: env_config_1.rethinkDBConfig.host, port: env_config_1.rethinkDBConfig.port, db: query.db })
                    .flatMap(function (conn) { return db.changes(conn, query.table); })
                    .subscribe(function (changes) {
                    _this.ioSocket.to(query.db).emit(query.table, JSON.stringify(changes));
                })
            };
            this.watcher.push(observer);
        }
    };
    return Realtime;
}());
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
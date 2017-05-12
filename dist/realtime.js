"use strict";
var _ = require("lodash");
var db = require("./routes/db");
var crypto = require("crypto");
var Realtime = (function () {
    function Realtime(ioSocket) {
        var _this = this;
        this.ioSocket = ioSocket;
        this.nameSpaces = [];
        this.ioSocket.on('connection', function (socket) {
            console.log('Client Connected ' + socket.id);
            socket.on('join', function (data) {
                try {
                    var query = JSON.parse(data);
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + query.db);
                    _this.enrollRoom(query);
                    socket.join(query.db);
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
        var nsp = _.find(this.nameSpaces, { id: hashid });
        if (!nsp) {
            console.log('[realtime.enrollNameSpace] Enroll (' + query.db + ') for ' + query.table);
            nsp = {
                id: hashid,
                subs: db.connectDB({ host: 'localhost', port: 28015, db: query.db })
                    .flatMap(function (conn) { return db.changes(conn, query.table); })
                    .subscribe(function (changes) {
                    _this.ioSocket.to(query.db).emit(query.table, JSON.stringify(changes));
                })
            };
            this.nameSpaces.push(nsp);
        }
    };
    return Realtime;
}());
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
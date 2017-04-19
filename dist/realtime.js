"use strict";
var _ = require("lodash");
var db = require("./routes/db");
var crypto = require("crypto");
require("rxjs/add/observable/of");
var Realtime = (function () {
    function Realtime(ioSocket) {
        this.ioSocket = ioSocket;
        this.nameSpaces = [];
        this.ioSocket.on('connection', function (socket) {
            console.log("Cliente " + socket.id + " conectado");
            socket.on('disconnect', function () {
                console.log("Cliente desconectado " + socket.id);
            });
        });
    }
    Realtime.prototype.enrollNameSpace = function (req, next) {
        var _this = this;
        var dbName = req.header('db');
        var table = req.body.table;
        var hashid = crypto.createHash('md5').update(dbName + table).digest('hex');
        ;
        var nsp = _.find(this.nameSpaces, { id: hashid });
        if (!nsp) {
            console.log('Enrolando ' + dbName + '/' + table);
            nsp = {
                id: hashid,
                subs: db.connectDB({ host: 'localhost', port: 28015, db: dbName })
                    .flatMap(function (conn) { return db.changes(conn, table); })
                    .subscribe(function (changes) {
                    _this.ioSocket.of('/' + dbName).to(table).emit(JSON.stringify(changes));
                })
            };
            this.nameSpaces.push(nsp);
        }
        next();
    };
    return Realtime;
}());
exports.Realtime = Realtime;
//# sourceMappingURL=realtime.js.map
"use strict";
var r = require("rethinkdb");
var Observable_1 = require("rxjs/Observable");
function connectDB(dbconfig) {
    return new Observable_1.Observable(function (o) {
        var connection;
        r.connect(dbconfig, function (err, conn) {
            if (err)
                o.error({ message: 'Connection failed ' + err });
            else {
                connection = conn;
                o.next(conn);
            }
        });
        return function () {
            if (!!connection && connection.open)
                connection.close();
        };
    });
}
exports.connectDB = connectDB;
function auth(conn, api_key) {
    return new Observable_1.Observable(function (o) {
        if (!!api_key)
            o.next(conn);
        else
            o.error('api_key is not authorized');
        o.complete();
    });
}
exports.auth = auth;
function insert(conn, table, object) {
    return new Observable_1.Observable(function (o) {
        var query = r.table(table).insert(object);
        query.run(conn, function (err, result) {
            if (err || result.errors > 0)
                o.error({ message: 'Query failed ' + err, result: result });
            else
                o.next(result);
            o.complete();
        });
    });
}
exports.insert = insert;
function list(conn, table, query) {
    return new Observable_1.Observable(function (o) {
        var rQuery = r.table(table);
        if (!!query) {
            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);
            if (!!query.orderBy)
                rQuery = rQuery.orderBy(query.orderBy);
            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        }
        rQuery.run(conn, function (err, cursor) {
            if (err)
                o.error({ message: 'Error retriving info ' + err });
            else {
                cursor.toArray(function (err, result) {
                    if (err)
                        o.error({ message: 'Err ' + err });
                    else
                        o.next(result);
                    o.complete();
                });
            }
        });
    });
}
exports.list = list;
function update(conn, table, index, object) {
    return new Observable_1.Observable(function (o) {
        var query = r.table(table).getAll(index.value, { index: index.index }).update(object);
        query.run(conn, function (err, result) {
            if (err)
                o.error({ message: 'Operation could not be completed ' + err });
            else
                o.next(result);
            o.complete();
        });
    });
}
exports.update = update;
function remove(conn, table, filter) {
    return new Observable_1.Observable(function (o) {
        var query = r.table(table).getAll(filter.value, { index: filter.index }).delete();
        query.run(conn, function (err, result) {
            if (err)
                o.error({ message: 'The operation can not be done ' + err });
            else
                o.next(result);
            o.complete();
        });
    });
}
exports.remove = remove;
function changes(conn, data) {
    return new Observable_1.Observable(function (o) {
        var rQuery = r.table(data.table);
        if (!!data.query) {
            if (!!data.query.filter)
                rQuery = rQuery.filter(data.query.filter);
            if (!!data.query.orderBy)
                rQuery = rQuery.orderBy(data.query.orderBy);
            if (!!data.query.limit)
                rQuery = rQuery.limit(data.query.limit);
        }
        rQuery
            .changes()
            .run(conn, function (err, cursor) {
            try {
                cursor.each(function (err, row) { return o.next(row); });
            }
            catch (e) {
                console.log('[db.changes]' + e);
            }
        });
    });
}
exports.changes = changes;
//# sourceMappingURL=db.js.map
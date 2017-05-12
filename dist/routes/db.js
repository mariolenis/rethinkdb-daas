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
function list(conn, table, limit, index) {
    return new Observable_1.Observable(function (o) {
        var query;
        if (!index)
            query = r.table(table);
        else
            query = r.table(table).getAll(index.value, { index: index.index });
        if (limit)
            query = query.limit(limit);
        query.run(conn, function (err, cursor) {
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
function filter(conn, table, reducer, limit) {
    return new Observable_1.Observable(function (o) {
        var query = r.table(table).filter(function (doc) {
            return doc(reducer.index).indexOf(reducer.value);
        });
        if (limit)
            query = query.limit(limit);
        query.run(conn, function (err, cursor) {
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
exports.filter = filter;
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
function changes(conn, table) {
    return new Observable_1.Observable(function (o) {
        var changes = r.table(table).changes();
        changes.run(conn, function (err, cursor) {
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
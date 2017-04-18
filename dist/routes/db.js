"use strict";
var r = require("rethinkdb");
var Observable_1 = require("rxjs/Observable");
require("rxjs/add/operator/map");
/**
 * connectDB()
 */
//<editor-fold defaultstate="collapsed" desc="connectDB(dbconfig: r.ConnectionOptions): Observable<r.Connection>">
function connectDB(dbconfig) {
    return new Observable_1.Observable(function (o) {
        r.connect(dbconfig, function (err, conn) {
            if (err)
                o.error({ message: 'Connection failed ' + err });
            else
                o.next(conn);
            o.complete();
        });
    });
}
exports.connectDB = connectDB;
//</editor-fold>
/**
 * closeConn()
 */
//<editor-fold defaultstate="collapsed" desc="closeConn(conn: r.Connection): Observable<r.Connection>">
function closeConn(conn) {
    return new Observable_1.Observable(function (o) {
        conn.close(function (err) {
            if (err)
                o.error({ message: 'The connection can not be closed yet ' + err });
            else
                o.next(conn);
            o.complete();
        });
    });
}
exports.closeConn = closeConn;
//</editor-fold>
/**
 * insert()
 */
//<editor-fold defaultstate="collapsed" desc="insertOnDB(conn: r.Connection, table: string, object: Object): Observable<r.WriteResult>">
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
//</editor-fold>
/**
 * list()
 */
//<editor-fold defaultstate="collapsed" desc="list(conn: r.Connection, table: string, index?: {index: string, value: string}, limit?: number ): Observable<Object[]>">
function list(conn, table, index, limit) {
    return new Observable_1.Observable(function (o) {
        var query;
        if (!!index)
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
//</editor-fold>
/**
 * filter()
 * @description Filters field by indexOf
 * @param conn: r.Conneciton
 * @param table: string
 * @param reducer: {indexName : string, value: string}
 */
//<editor-fold defaultstate="collapsed" desc="filter(conn: r.Connection, table: string, reducer: {index: string, value: string}): Observable<Object[]>">
function filter(conn, table, reducer) {
    return new Observable_1.Observable(function (o) {
        var query = r.table(table).filter(function (doc) {
            return doc(reducer.index).indexOf(reducer.value);
        });
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
//</editor-fold>
/**
 * update()
 * @description
 * @param conn: r.Connection
 * @param table: string
 * @param index: {index: string, value: string}
 */
//<editor-fold defaultstate="collapsed" desc="update(conn: r.Connection, table: string, index: {index: string, value: string}, object: Object): Observable<r.WriteResult>">
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
//</editor-fold>
//# sourceMappingURL=db.js.map
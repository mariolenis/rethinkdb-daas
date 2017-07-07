"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const r = require("rethinkdb");
const Observable_1 = require("rxjs/Observable");
function connectDB(dbconfig) {
    return new Observable_1.Observable((o) => {
        let connection;
        r.connect(dbconfig, (err, conn) => {
            if (err)
                o.error({ message: 'Connection failed ' + err });
            else {
                connection = conn;
                o.next(conn);
            }
        });
        return () => {
            if (!!connection && connection.open)
                connection.close();
        };
    });
}
exports.connectDB = connectDB;
function auth(conn, api_key) {
    return new Observable_1.Observable((o) => {
        if (!!api_key)
            o.next(conn);
        else
            o.error('api_key is not authorized');
        o.complete();
    });
}
exports.auth = auth;
function tableVerify(conn, db, table) {
    return new Observable_1.Observable((o) => {
        r.table(table).isEmpty().run(conn, (err, result) => {
            if (!!err) {
                r.db(db).tableCreate(table).run(conn, (err, result) => {
                    if (!err)
                        o.next(conn);
                    else
                        o.error(err);
                    o.complete();
                });
            }
            else {
                o.next(conn);
                o.complete();
            }
        });
    });
}
exports.tableVerify = tableVerify;
function insert(conn, table, object) {
    return new Observable_1.Observable((o) => {
        const query = r.table(table).insert(object);
        query.run(conn, (err, result) => {
            if (err || result.errors > 0)
                o.error({ message: 'Query failed ' + err, result: result });
            else
                o.next(result);
            o.complete();
        });
    });
}
exports.insert = insert;
function find(conn, table, value) {
    return new Observable_1.Observable((o) => {
        let query = r.table(table).get(value);
        query.run(conn, (err, cursor) => {
            if (err)
                o.error({ message: 'Error retrving value ' + value, err: err });
            else {
                cursor.each((err, result) => {
                    if (err)
                        o.error({ message: 'Error at cursor value ' + value, err: err });
                    else if (result === null)
                        o.error({ message: 'No valid key was found ' + value });
                    else
                        o.next(result);
                    o.complete();
                });
            }
        });
    });
}
exports.find = find;
function list(conn, table, query) {
    return new Observable_1.Observable((o) => {
        let rQuery = r.table(table);
        if (!!query) {
            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);
            if (!!query.orderBy)
                rQuery = rQuery.orderBy(!!query.orderBy.desc ? r.desc(query.orderBy.index) : query.orderBy.index);
            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        }
        rQuery.run(conn, (err, cursor) => {
            if (err)
                o.error({ message: 'Error retriving info ' + err });
            else {
                cursor.toArray((err, result) => {
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
function update(conn, table, object, query) {
    return new Observable_1.Observable((o) => {
        let rQuery = r.table(table);
        if (!query && !!object && !!object.id && object.id !== '')
            rQuery = rQuery.get(object.id);
        else if (!!object && !!query) {
            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);
            if (!!query.orderBy)
                rQuery = rQuery.orderBy(query.orderBy);
            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        }
        else {
            if (!query)
                o.error({ message: 'Object does not include and ID' });
            else
                o.error({ message: 'Object can not be null or undefined' });
            o.complete();
            return;
        }
        rQuery.update(object).run(conn, (err, result) => {
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
    return new Observable_1.Observable((o) => {
        const query = r.table(table).getAll(filter.value, { index: filter.index }).delete();
        query.run(conn, (err, result) => {
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
    return new Observable_1.Observable((o) => {
        let rQuery = r.table(data.table);
        if (!!data.query) {
            if (!!data.query.filter)
                rQuery = rQuery.filter(data.query.filter);
            if (!!data.query.orderBy)
                rQuery = rQuery.orderBy({ index: (!!data.query.orderBy.desc ? r.desc(data.query.orderBy.index) : data.query.orderBy.index) });
            if (!!data.query.limit && !!data.query.orderBy)
                rQuery = rQuery.limit(data.query.limit);
        }
        rQuery
            .changes()
            .run(conn, (err, cursor) => {
            if (err)
                console.log('[db.changes]' + err);
            else {
                try {
                    cursor.each((err, row) => o.next(row));
                }
                catch (e) {
                    console.log('[db.changes]' + e);
                }
            }
        });
    });
}
exports.changes = changes;
//# sourceMappingURL=db.js.map
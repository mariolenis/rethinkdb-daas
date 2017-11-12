import * as r from 'rethinkdb';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

export interface IRethinkQuery {
    orderBy?: {
        index: string,
        desc?: boolean
    }, 
    limit?: number, 
    filter: Object
}

export interface IRethinkDBAPIConfig {
    api_key: string;
    database: string;
    auth_table?: string;
    host?: string;
    port?: number;
}

/**
 * connectDB()
 * @description opens connection
 * @param <r.ConnectionOptions> dbconfig
 */
export function connectDB(dbconfig: r.ConnectionOptions, origen: string): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {        
        try {
            let connection: r.Connection;
            console.log(JSON.stringify(dbconfig), origen);
            r.connect(dbconfig, (err, conn) => {
                if (err)
                    o.error({message: 'Connection failed ' + err});
                else {
                    connection = conn;
                    o.next(conn);
                }
            });
            
            return () => {
                if (!!connection && connection.open)
                    connection.close();
            }
        } catch(err) {
            console.log(err)
        }
    });
}

/**
 * auth()
 * @description Validates api_key
 * @param <r.Connection> conn
 * @param <string> api_key 
 * @returns <Obsersable> true | false
 */
//<editor-fold defaultstate="collapsed" desc="auth(dbconfig: r.Connection, api_key: string): Observable<boolean>">
export function auth(conn: r.Connection, api_key: string): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {        
        // Verify api_key
        // TODO: verify this connectionRequest is valid and authorized
        if (!!api_key)
            o.next(conn);
        else
            o.error('api_key is not authorized')
        o.complete();
    });
}
//</editor-fold>

/**
 * tableVerify()
 * @description Validates if table exists, if not, creates a new one
 * @param <r.Connection> conn
 * @param <string> db
 * @param <string> table
 * @returns <Observable<r.Connection>>
 */
//<editor-fold defaultstate="collapsed" desc="tableVerify(conn: r.Connection, db: string, table: string): Observable<r.Connection>">
export function tableVerify(conn: r.Connection, db: string, table: string): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {
        r.table(table).isEmpty().run(conn, (err, result) => {
            if (!!err) {
                // Create the table
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
        })
    });
}
//</editor-fold>

/**
 * insert()
 * @description Inserts on db
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <Object> Object
 */
//<editor-fold defaultstate="collapsed" desc="insert(conn: r.Connection, table: string, object: Object): Observable<r.WriteResult>">
export function insert(conn: r.Connection, table: string, object: Object): Observable<r.WriteResult> {    
    return new Observable((o: Observer<r.WriteResult>) => {
        
        const query: r.Operation<r.WriteResult> = r.table(table).insert(object);
        query.run(conn, (err, result) => {            
            if (err || result.errors > 0)
                o.error({message: 'Query failed ' + err, result: result})
            else 
                o.next(result);
            o.complete();
        });
    })
}
//</editor-fold>

/**
 * @description Function to find by key
 * @param <r.Connection>
 * @param <string> table
 * @param <string> key value
 */
//<editor-fold defaultstate="collapsed" desc="find(conn: r.Connection, table: string, value: string): Observable<Object>">
export function find(conn: r.Connection, table: string, value: string): Observable<Object> {
    return new Observable((o: Observer<Object[]>) => {
        let query = r.table(table).get(value);
        query.run(conn, (err, cursor) => {
            if (err)
                o.error({message: 'Error retrving value ' + value, err: err});
            else {
                cursor.each((err, result) => {
                    if (err)
                        o.error({message: 'Error at cursor value ' + value, err: err});
                    else if (result === null)
                        o.error({message: 'No valid key was found ' + value});
                    else
                        o.next(result);
                    o.complete();
                });
            }
        });
    });
}
//</editor-fold>

/**
 * list()
 * @description find 
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <IRethinkQuery> query
 */
//<editor-fold defaultstate="collapsed" desc="list(conn: r.Connection, table: string, query: IRethinkQuery): Observable<Object[]>">
export function list(conn: r.Connection, table: string, query: IRethinkQuery): Observable<Object[]> {
    return new Observable((o: Observer<Object[]>) => {
        
        let rQuery: r.Table | r.Sequence = r.table(table);  
        if (!!query) {
            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);

            if (!!query.orderBy)
                rQuery = rQuery.orderBy(!!query.orderBy.desc ? r.desc(query.orderBy.index) : query.orderBy.index);

            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        }      
        try {
            rQuery.run(conn, (err, cursor) => {                
                if (err) {
                    console.log(err)
                    o.error({message: 'Error retriving info ' + err});
                } else {
                    cursor.toArray((err, result) => {
                        if (err)
                            o.error({message: 'Err ' + err});
                        else
                            o.next(result);
                        o.complete();
                    })
                }
            })
        } catch(err) {
            o.error({message: 'Err ' + err});
        } 
    });    
}
//</editor-fold>

/**
 * update()
 * @description 
 * @param <r.Connection> conn
 * @param <string> table
 * @param <{id: string, ...}> object
 * @param <IRethinkQuery> query
 */
//<editor-fold defaultstate="collapsed" desc="update(conn: r.Connection, table: string, object: {id: string}): Observable<r.WriteResult>">
export function update(conn: r.Connection, table: string, object: {id: string}, query: IRethinkQuery): Observable<r.WriteResult> {
    return new Observable((o: Observer<r.WriteResult>) => {
        
        let rQuery: r.Sequence | r.Table = r.table(table);
            
        if (!query && !!object && !!object.id && object.id !== '')
            rQuery = (rQuery as r.Table).get(object.id);
            
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
                o.error({message: 'Object does not include and ID'});
            else
                o.error({message: 'Object can not be null or undefined'});
            o.complete();
            return;
        }

        rQuery.update(object).run(conn, (err, result) => {
            if (err)
                o.error({message: 'Operation could not be completed ' + err})
            else
                o.next(result)
            o.complete();
        });
        
    });
}
//</editor-fold>

/**
 * remove()
 * @description Function that removes an element from db
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <indexName : string, value: string> filter
 */
//<editor-fold defaultstate="collapsed" desc="remove(conn: r.Connection, table: string, filter:{index: string, value: string}): Observable<r.WriteResult>">
export function remove(conn: r.Connection, table: string, filter: {index: string, value: string}): Observable<r.WriteResult> {
    return new Observable((o: Observer<r.WriteResult>) => {
        const query = r.table(table).getAll(filter.value, {index: filter.index}).delete();
        query.run(conn, (err, result) => {
            if (err)
                o.error({message: 'The operation can not be done ' + err});
            else
                o.next(result);
            o.complete();
        })
    });
}
//</editor-fold>

/**
 * changes()
 * @description Function that enables change detection on table
 * @param <r.Connection>
 * @param <string> table
 * @returns <Observable> with changes
 */
//<editor-fold defaultstate="collapsed" desc="changes(conn: r.Connection, data: {table: string, query: IRethinkQuery}): Observable<{new_val: Object, old_val: Object}>">
export function changes(conn: r.Connection, data: {table: string, query: IRethinkQuery}): Observable<{new_val: Object, old_val: Object}> {
    return new Observable((o: Observer<{new_val: Object, old_val: Object}>) => {
        
        // Set the table to query
        let rQuery: r.Table | r.Sequence = r.table(data.table);
        if (!!data.query) {
            if (!!data.query.filter)
                rQuery = rQuery.filter(data.query.filter);
            
            if (!!data.query.orderBy)
                rQuery = rQuery.orderBy({index: (!!data.query.orderBy.desc ? r.desc(data.query.orderBy.index) : data.query.orderBy.index) });

            if (!!data.query.limit && !!data.query.orderBy)
                rQuery = rQuery.limit(data.query.limit);
        }
        
        rQuery
            .changes()
            .run(conn, (err, cursor) => {
                if (err)
                    o.error(err);
                else {
                    try {
                        cursor.each((err, row) => o.next(row))
                    } catch(e) {
                        console.log('[db.changes]' + e);
                    }
                }
            });
    })
}
//</editor-fold>

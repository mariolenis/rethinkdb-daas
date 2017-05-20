import * as r from 'rethinkdb';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

//<editor-fold defaultstate="collapsed" desc="IRethinkQuery">
export interface IRethinkQuery {
    orderBy?: string | string[], 
    limit?: number, 
    filter: Object
}
//</editor-fold>

/**
 * connectDB()
 * @description opens connection
 * @param <r.ConnectionOptions> dbconfig
 */
//<editor-fold defaultstate="collapsed" desc="connectDB(dbconfig: r.ConnectionOptions): Observable<r.Connection>">
export function connectDB(dbconfig: r.ConnectionOptions): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {        
        
        let connection: r.Connection;
        
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
    });
}
//</editor-fold>

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
 * insert()
 * @description Inserts on db
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <Object> Object
 */
//<editor-fold defaultstate="collapsed" desc="insertOnDB(conn: r.Connection, table: string, object: Object): Observable<r.WriteResult>">
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
                rQuery = rQuery.orderBy(query.orderBy);

            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        }      
                    
        rQuery.run(conn, (err, cursor) => {
            if (err)
                o.error({message: 'Error retriving info ' + err});
            else {
                cursor.toArray((err, result) => {
                    if (err)
                        o.error({message: 'Err ' + err});
                    else
                        o.next(result);
                    o.complete();
                })
            }
        })
    });    
}
//</editor-fold>

/**
 * update()
 * @description 
 * @param <r.Connection> conn
 * @param <string> table
 * @param <index: string, value: string> index
 * @param <Object> object
 */
//<editor-fold defaultstate="collapsed" desc="update(conn: r.Connection, table: string, index: {index: string, value: string}, object: Object): Observable<r.WriteResult>">
export function update(conn: r.Connection, table: string, object: Object): Observable<r.WriteResult> {
    return new Observable((o: Observer<r.WriteResult>) => {
        
        const query = r.table(table).get((object as {id: string}).id).update(object);
        query.run(conn, (err, result) => {
            if (err)
                o.error({message: 'Operation could not be completed ' + err})
            else
                o.next(result)
            o.complete();
        })
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
    return new Observable((o: Observer<Object>) => {
        
        // Set the table to query
        let rQuery: r.Table | r.Sequence = r.table(data.table);
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
            .run(conn, (err, cursor) => {
                try {
                    cursor.each((err, row) => o.next(row))
                } catch(e) {
                    console.log('[db.changes]' + e);
                }
            });
    })
}
//</editor-fold>

import * as r from 'rethinkdb';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

/**
 * connectDB()
 * @description opens connection
 * @param dbconfig: r.ConnectionOptions
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
 * insert()
 * @description Inserts on db
 * @param conn: r.Conneciton
 * @param table: string
 * @param object: Object
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
 * @param conn: r.Conneciton
 * @param table: string
 * @param limit: number
 * @param reducer: {indexName : string, value: string}
 */
//<editor-fold defaultstate="collapsed" desc="list(conn: r.Connection, table: string, limit?: number, index?: {index: string, value: string} ): Observable<Object[]>">
export function list(conn: r.Connection, table: string, limit?: number, index?: {index: string, value: any} ): Observable<Object[]> {
    return new Observable((o: Observer<Object[]>) => {
        
        let query: r.Table | r.Sequence;        
        if (!index)
            query = r.table(table);
        else
            query = r.table(table).getAll(index.value, {index: index.index});
        
        if (limit)
            query = query.limit(limit);
            
        query.run(conn, (err, cursor) => {
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
 * filter()
 * @description Filters field by indexOf
 * @param conn: r.Conneciton
 * @param table: string
 * @param reducer: {indexName : string, value: string}
 * @param limit: number
 */
//<editor-fold defaultstate="collapsed" desc="filter(conn: r.Connection, table: string, reducer: {index: string, value: string}, limit?: number): Observable<Object[]>">
export function filter(conn: r.Connection, table: string, reducer: {index: string, value: string}, limit?: number): Observable<Object[]> {
    return new Observable((o: Observer<Object[]>) => {
        
        let query = r.table(table).filter((doc: (index: string) => string) => {            
            return doc(reducer.index).indexOf(reducer.value);
        });
        
        if (limit)
            query = query.limit(limit);
            
        query.run(conn, (err, cursor) => {
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
        });
    });
}
//</editor-fold>

/**
 * update()
 * @description 
 * @param conn: r.Connection
 * @param table: string
 * @param index: {index: string, value: string}
 */
//<editor-fold defaultstate="collapsed" desc="update(conn: r.Connection, table: string, index: {index: string, value: string}, object: Object): Observable<r.WriteResult>">
export function update(conn: r.Connection, table: string, index: {index: string, value: string}, object: Object): Observable<r.WriteResult> {
    return new Observable((o: Observer<r.WriteResult>) => {
        
        const query = r.table(table).getAll(index.value, {index: index.index}).update(object);
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
 * @param conn: r.Conneciton
 * @param table: string
 * @param filter: {indexName : string, value: string}
 */
//<editor-fold defaultstate="collapsed" desc="remove(conn: r.Connection, table: string, filter:{index: string, value: string}): Observable<r.WriteResult>">
export function remove(conn: r.Connection, table: string, filter:{index: string, value: string}): Observable<r.WriteResult> {
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
 * @param r.Connection
 * @param string table
 * @returns Observable with changes
 */
//<editor-fold defaultstate="collapsed" desc="changes(conn: r.Connection, table: string): Observable<{new_val: Object, old_val: Object}>">
export function changes(conn: r.Connection, table: string): Observable<{new_val: Object, old_val: Object}> {
    return new Observable((o: Observer<Object>) => {
        const changes = r.table(table).changes();
        changes.run(conn, (err, cursor) => {
            try {
                cursor.each((err, row) => o.next(row))
            } catch(e) {
                console.log('[db.changes]' + e);
            }
        });
    })
}
//</editor-fold>

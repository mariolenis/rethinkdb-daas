import * as r from 'rethinkdb';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import 'rxjs/add/operator/map';

/**
 * connectDB()
 */
//<editor-fold defaultstate="collapsed" desc="connectDB(dbconfig: r.ConnectionOptions): Observable<r.Connection>">
export function connectDB(dbconfig: r.ConnectionOptions): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {
        r.connect(dbconfig, (err, conn) => {
            if (err)
                o.error({message: 'Connection failed ' + err});
            else
                o.next(conn);
            o.complete();
        })
    });
}
//</editor-fold>


/**
 * closeConn()
 */
//<editor-fold defaultstate="collapsed" desc="closeConn(conn: r.Connection): Observable<r.Connection>">
export function closeConn(conn: r.Connection): Observable<r.Connection> {
    return new Observable((o: Observer<r.Connection>) => {
        conn.close(err=> {
            if (err)
                o.error({message: 'The connection can not be closed yet ' + err});
            else
                o.next(conn);
            o.complete();
        });
    });
}
//</editor-fold>

/**
 * insert()
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
 */
//<editor-fold defaultstate="collapsed" desc="list(conn: r.Connection, table: string, index?: {index: string, value: string}, limit?: number ): Observable<Object[]>">
export function list(conn: r.Connection, table: string, index?: {index: string, value: string}, limit?: number ): Observable<Object[]> {
    return new Observable((o: Observer<Object[]>) => {
        
        let query: r.Table | r.Sequence;        
        if (!!index)
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
 */
//<editor-fold defaultstate="collapsed" desc="filter(conn: r.Connection, table: string, reducer: {index: string, value: string}): Observable<Object[]>">
export function filter(conn: r.Connection, table: string, reducer: {index: string, value: string}): Observable<Object[]> {
    return new Observable((o: Observer<Object[]>) => {
        
        const query = r.table(table).filter((doc: (index: string) => string) => {            
            return doc(reducer.index).indexOf(reducer.value);
        });
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




import * as r from 'rethinkdb';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { isArray } from 'util';

export interface IRethinkQuery {
    orderBy?: {
        index: string,
        desc?: boolean
    }, 
    limit?: number, 
    filter?: Object,
    range?: {
        index?: string,
        leftValue: string | number, 
        rigthValue: string | number
    },
    ids?: string[],
    in?: {
        attr: string,
        values: string[] | number[],
    }

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

/**
 * tableVerify()
 * @description Validates if table exists, if not, creates a new one
 * @param <r.Connection> conn
 * @param <string> db
 * @param <string> table
 * @returns <Observable<r.Connection>>
 */
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

/**
 * insert()
 * @description Inserts on db
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <Object> Object
 */
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
        query.run(conn, (err, cursor:any) => {
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
            if (!!query.ids)
                rQuery = r.table(table).getAll(...query.ids);

            if (!!query.orderBy)
                rQuery = rQuery.orderBy(!!query.orderBy.desc ? r.desc(query.orderBy.index) : query.orderBy.index);

            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);
            
            if (!!query.range) {
                const range = query.range;
                if (!!range.leftValue && !!range.rigthValue)
                    rQuery = rQuery.filter(r.row(range.index).ge(range.leftValue).and(r.row(range.index).le(range.rigthValue) ));
                
                else if (!!range.leftValue)
                    rQuery = rQuery.filter(r.row(range.index).ge(range.leftValue));
                
                else if (!!range.rigthValue)
                    rQuery = rQuery.filter(r.row(range.index).le(range.rigthValue));
            }

            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);

            if (!!query.in && !!query.in.attr && !!query.in.values) {
                rQuery = rQuery.filter(
                    // FIXIT: Becase values can be array of numbers, then contains can not be used and conversion to String is imposible because coerceTo('string') is not supported in @types/rethinkdb
                    // r.js(`(function (row) { \
                    //     return ${JSON.stringify(query.in.values)}.indexOf(row[${JSON.stringify(query.in.attr)}]) !== -1\
                    // })`)
                    // NOTE: Better performance
                    function (row) {
                        return r.expr(query.in.values).map(function (val) {
                            return val.coerceTo('string');
                        }).contains(row(query.in.attr).coerceTo('string'))
                    }
                );
            }

        }      
        try {
            rQuery.run(conn, (err, cursor) => {                
                if (err) {
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
export function update(conn: r.Connection, table: string, object: {id: string}, query: IRethinkQuery): Observable<r.WriteResult> {
    return new Observable((o: Observer<r.WriteResult>) => {
        
        let rQuery: r.Sequence | r.Table = r.table(table);
            
        if (!query && !!object && !!object.id && object.id !== '')
            rQuery = (rQuery as r.Table).get(object.id);
            
        else if (!!object && !!query) {
                        
            if (!!query.orderBy)
                rQuery = rQuery.orderBy(query.orderBy);
                
            if (!!query.filter)
                rQuery = rQuery.filter(query.filter);
            
            if (!!query.limit)
                rQuery = rQuery.limit(query.limit);
        } 
        else {
            if (!query)
                o.error({message: 'Object does not include an ID'});
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

/**
 * remove()
 * @description Function that removes an element from db
 * @param <r.Conneciton> conn
 * @param <string> table
 * @param <indexName : string, value: string> filter
 */
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

/**
 * changes()
 * @description Function that enables change detection on table
 * @param <r.Connection>
 * @param <string> table
 * @returns <Observable> with changes
 */
export function changes(conn: r.Connection, data: {table: string, query: IRethinkQuery}): Observable<{new_val: Object, old_val: Object}> {
    return new Observable((o: Observer<{new_val: Object, old_val: Object}>) => {
        
        // Set the table to query
        let rQuery: r.Table | r.Sequence = r.table(data.table);
        if (!!data.query) {
            if (!!data.query.ids && isArray(data.query.ids)) {
                // if array of ids is defined, then select only by ids without other filters
                rQuery = r.table(data.table).getAll(...data.query.ids);
            } else {
                // filter by data.query attributes without specific ids
                if (!!data.query.orderBy)
                    rQuery = rQuery.orderBy({ index: (!!data.query.orderBy.desc ? r.desc(data.query.orderBy.index) : data.query.orderBy.index) });

                if (!!data.query.filter)
                    rQuery = rQuery.filter(data.query.filter);

                if (!!data.query.range) {
                    const range = data.query.range;
                    if (!!range.leftValue && !!range.rigthValue)
                        rQuery = rQuery.filter(r.row(range.index).ge(range.leftValue).and(r.row(range.index).le(range.rigthValue)));

                    else if (!!range.leftValue)
                        rQuery = rQuery.filter(r.row(range.index).ge(range.leftValue));

                    else if (!!range.rigthValue)
                        rQuery = rQuery.filter(r.row(range.index).le(range.rigthValue));
                }

                if (!!data.query.limit && !!data.query.orderBy)
                    rQuery = rQuery.limit(data.query.limit);

                if (!!data.query.in && !!data.query.in.attr && !!data.query.in.values) {
                    rQuery = rQuery.filter(
                        // FIXIT: Becase values can be array of numbers, then contains can not be used and conversion to String is imposible because coerceTo('string') is not supported in @types/rethinkdb
                        // r.js(`(function (row) { \
                        //     return ${JSON.stringify(data.query.in.values)}.indexOf(row[${JSON.stringify(data.query.in.attr)}]) !== -1\
                        // })`)
                        // NOTE: Better performance and usable in changes because r.js is not usable due to: "Cannot call `changes` after a non-deterministic function
                        function (row) {
                            return r.expr(data.query.in.values).map(function (val) {
                                return val.coerceTo('string');
                            }).contains(row(data.query.in.attr).coerceTo('string'))
                        }
                    );
                }

            }
        }
        
        rQuery
            .changes() // { includeInitial: true } can by used to retrieve actual content if no previous list methosd is called
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

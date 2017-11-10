import * as db from './db';
import {Observable} from 'rxjs/Observable';
import {WriteResult} from 'rethinkdb';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import {rethinkDBConfig} from '../env.config';

export interface IQuery {
    api_key: string,
    db: string,
    table: string,
    object?: Object,
    query?: db.IRethinkQuery
}

export module DBControl {
    export function list(query: IQuery): Observable<Object[]> {
        return validateAuth(query)
            .flatMap(() => db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db}, 'control-list'))
            .flatMap(conn => db.list(conn, query.table, query.query));
    }

    export function put(query: IQuery): Observable<WriteResult> {
        return validateAuth(query)
            .flatMap(() => db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db}, 'control-put'))
            //.flatMap(conn => db.auth(conn, query.api_key))
            .flatMap(conn => db.insert(conn, query.table, query.object));
    }

    export function update(query: IQuery): Observable<WriteResult> {
        return validateAuth(query)
            .flatMap(() => db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db}, 'control-update'))
            .flatMap(conn => db.update(conn, query.table, query.object as {id: string}, query.query));
    }

    export function remove(query: IQuery): Observable<WriteResult> {
        return validateAuth(query)
            .flatMap(() => db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db}, 'control-remove'))
            .flatMap(conn => db.remove(conn, query.table, query.object as {index: string, value: string}));
    }

    function validateAuth(query: IQuery) : Observable<any> {
        return db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: rethinkDBConfig.authDb}, 'control-auth')
            .flatMap(conn => db.auth(conn, query.api_key));
    }
}
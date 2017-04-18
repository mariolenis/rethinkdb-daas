import * as express from 'express';
import * as db from './db';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

interface IQuery {
    table: string,
    object?: Object,
    limit?: string,
    filter?: {
        index: string,
        value: any
    }
}

export function putRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const query = req.body as IQuery;
    const dbName = req.header('db');
    
    let dbSuscription = db.connectDB({host: 'localhost', port: 28015, db: dbName})
        .flatMap(conn => db.insert(conn, query.table, query.object))
        .subscribe(
            response => {
                res.status(200).json(response);
                // Finalizar la conexión
                dbSuscription.unsubscribe();
            },
            err => res.status(400).json(err)
        );
}

export function updateRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

export function getRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

export function filterRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

export function deleteRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

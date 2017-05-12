import * as express from 'express';
import * as db from './db';

import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';

interface IQuery {
    db: string,
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
    
    let dbSuscription = db.connectDB({host: 'localhost', port: 28015, db: query.db})
        .flatMap(conn => db.insert(conn, query.table, query.object))
        .subscribe(
            response => {
                res.status(200).json(response);
                // Finalizar la conexión
                if (!dbSuscription.closed)
                    dbSuscription.unsubscribe();
            },
            err => res.status(400).json(err)
        );
}

export function updateRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

export function listRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const query = req.body as IQuery;
    
    let dbSuscription = db.connectDB({host: 'localhost', port: 28015, db: query.db})
        .flatMap(conn => db.list(conn, query.table, parseInt(query.limit), query.filter))
        .subscribe(
            response => {
                res.status(200).json(response);
                // Finalizar la conexión
                if (!dbSuscription.closed)
                    dbSuscription.unsubscribe();
            },
            err => res.status(400).json(err)
        );
}

export function filterRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

export function deleteRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    
}

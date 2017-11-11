import * as express from 'express';
import * as db from './daas/db';
import {DBControl} from './daas/controller';
import {rethinkDBConfig} from './env.config';

import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import 'rxjs/add/observable/fromPromise';

interface IQuery {
    api_key: string,
    db: string,
    table: string,
    object?: Object,
    query?: db.IRethinkQuery
}

export function listRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const query = req.body as IQuery;
    
    let dbSuscription = DBControl.list(query).subscribe(
            response => {
                res.status(200).json(response);
                // Finalizar la conexión
                if (!dbSuscription.closed)
                    dbSuscription.unsubscribe();
            },
            err => res.status(400).json(err)
        );
}

export function putRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const query = req.body as IQuery;
    
    let dbSuscription = DBControl.put(query).subscribe(
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
    const query = req.body as IQuery;
    
    let dbSuscription = DBControl.update(query).subscribe(
            response => {
                res.status(200).json(response);
                // Finalizar la conexión
                if (!dbSuscription.closed)
                    dbSuscription.unsubscribe();
            },
            err => res.status(400).json(err)
        );
}

export function deleteRoute(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const query = req.body as IQuery;
    
    let dbSuscription = DBControl.remove(query).subscribe(
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
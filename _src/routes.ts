import * as express from 'express';
import * as db from './daas/db';
import * as crypto from 'crypto';
import {DBControl} from './daas/controller';
import {rethinkDBConfig, SECRET} from './env.config';
import { IRethinkDBAPIConfig } from './daas/db';

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

export function createUser(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const [config, user] = req.body as [IRethinkDBAPIConfig, {user: string, password: string}];

    let dbCreateUserSubscription = DBControl.put({
            api_key: config.api_key,
            db: config.database,
            table: config.auth_table,
            object: user
        })
        .subscribe(
            response => {
                res.status(200).json(response);

                // Implement extra functions to validate / Notify

                if (!dbCreateUserSubscription.closed)
                    dbCreateUserSubscription.unsubscribe();
            },
            err => res.status(400).json({err: err})
        );
}

export function authUser(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const [config, user] = req.body as [IRethinkDBAPIConfig, {user: string, password: string}];
    let dbAuthSubscription = DBControl.list({
            api_key: config.api_key,
            db: config.database,
            table: config.auth_table,
            query: {
                filter: {
                    id: user.user
                }
            }
        })
        .subscribe(
            (users: {password: string}[]) => {
                if (users.length === 0)
                    res.status(400).json({err: 'User not found'});
                else if (users.length > 0 && users[0].password !== user.password)
                    res.status(401).json({err: 'Password does not match'})
                else {
                    try {
                        delete users[0].password;
                        const content = [ req.headers, users[0] ];

                        const hashPass = crypto.createHash('sha256').update(SECRET).digest();
                        const cipher = crypto.createCipheriv('aes-256-ctr', hashPass, 'a2xhcgAAAAAAAAAA');
                        let cripted = cipher.update(JSON.stringify(content), 'utf8', 'hex');
                        cripted += cipher.final('hex');
                        res.status(200).json({token: cripted});
                    } catch (err) {
                        console.log(err)
                        res.status(400).json({err: err});
                    }
                }

                if (!dbAuthSubscription.closed)
                    dbAuthSubscription.unsubscribe();
            },
            err => res.status(400).json({err: err})
        );
}

export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const [config, token] = req.body as [IRethinkDBAPIConfig, string];

    try {
        const hashPass = crypto.createHash('sha256').update(SECRET).digest();
        const decipher = crypto.createDecipheriv('aes-256-ctr', hashPass, 'a2xhcgAAAAAAAAAA');
        let decripted = decipher.update(token, 'hex', 'utf8');
        decripted += decipher.final('utf8');

        let [headers, userInToken] = JSON.parse(decripted) as [ Object, {id: string} ];
        // If user has been authenticated, his token must match with user in db
        let dbIsAuthSubscription = DBControl.list({
                api_key: config.api_key,
                db: config.database,
                table: config.auth_table,
                query: {
                    filter: {
                        id: userInToken.id
                    }
                }
            })
            .subscribe(
                (users: {password: string}[]) => {
                    if (users.length === 0)
                        res.status(401).json({err: 'User not authenticated'})            
                    else {
                        if (req.header('host') == headers['host'] && req.header('user-agent') == headers['user-agent'])
                            res.status(200).json({msj: 'User authenticated'});
                        else
                            res.status(401).json({err: 'User authenticated elsewhere'})
                    }

                    if (!dbIsAuthSubscription.closed)
                        dbIsAuthSubscription.unsubscribe();
                },
                err => res.status(400).json({err: err})
            );
    } catch(err) {
        res.status(400).json({err: 'Token error: ' + err});
    }
}

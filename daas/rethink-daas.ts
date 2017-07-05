import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import * as io from 'socket.io';
import {DBControl, IQuery} from './controller';
import {Realtime} from './realtime';
export * from './controller';

export class RethinkDaaS {
    router = express.Router();

    constructor(server: http.Server | https.Server) {

        this.router.get('/api', (req: express.Request, res: express.Response) => {
            res.status(200).send('Rethink DaaS - API Ready!');
        });
        
        this.router.post('/api/put', (req: express.Request, res: express.Response) => {
            let dbSubscription = DBControl.put(req.body as IQuery).subscribe(
                response => {
                    res.status(200).json(response);
                    // Finalizar la conexión
                    if (!dbSubscription.closed)
                        dbSubscription.unsubscribe();
                },
                err => res.status(400).json(err)
            );
        });
        
        this.router.post('/api/list', (req: express.Request, res: express.Response) => {
            let dbSubscription = DBControl.list(req.body as IQuery).subscribe(
                response => {
                    res.status(200).json(response);
                    // Finalizar la conexión
                    if (!dbSubscription.closed)
                        dbSubscription.unsubscribe();
                },
                err => res.status(400).json(err)
            );
        });
        
        this.router.post('/api/update', (req: express.Request, res: express.Response) => {
            let dbSubscription = DBControl.update(req.body as IQuery).subscribe(
                response => {
                    res.status(200).json(response);
                    // Finalizar la conexión
                    if (!dbSubscription.closed)
                        dbSubscription.unsubscribe();
                },
                err => res.status(400).json(err)
            );
        });
        
        this.router.post('/api/delete', (req: express.Request, res: express.Response) => {
            let dbSubscription = DBControl.remove(req.body as IQuery).subscribe(
                response => {
                    res.status(200).json(response);
                    // Finalizar la conexión
                    if (!dbSubscription.closed)
                        dbSubscription.unsubscribe();
                },
                err => res.status(400).json(err)
            );
        });
        
        this.initRealtime(server);
    }

    private initRealtime(server: http.Server | https.Server): void {
        new Realtime(io(server));
    }

    getRethinkDBRoutes(): express.Router {
        return this.router;
    }
}

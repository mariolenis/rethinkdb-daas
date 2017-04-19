import * as express from 'express';
import * as http from 'http';
import * as debug from 'morgan';
import * as bodyParser from 'body-parser';
import * as fn from './routes/routes';
import { Realtime } from './realtime';
import * as io from 'socket.io';

export class Server {
    
    app: express.Application = express();
    
    constructor() {
        
        
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        let httpServer = http.createServer(this.app);        
        let realtime = new Realtime(io(httpServer));
        this.app.use('/api/list', (req, res, next) => realtime.enrollNameSpace(req, next));
        
        this.app.post('/api/put',       fn.putRoute.bind(fn.putRoute));
        this.app.post('/api/list',      fn.listRoute.bind(fn.listRoute));
        this.app.post('/api/update',    fn.updateRoute.bind(fn.updateRoute));
        this.app.post('/api/filter',    fn.filterRoute.bind(fn.filterRoute));
        this.app.post('/api/delete',    fn.deleteRoute.bind(fn.deleteRoute));
        
        this.app.get('/api', (req, res: express.Response) => {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        
        httpServer.listen(3200);
    }
}

new Server();
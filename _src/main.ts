import * as express from 'express';
import * as http from 'http';
import * as debug from 'morgan';
import * as bodyParser from 'body-parser';
import * as io from 'socket.io';
import * as fn from './routes/routes';
import { Realtime } from './realtime';

export class Server {
    
    app: express.Application = express();
    
    constructor() {
        
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        let httpServer = http.createServer(this.app);        
        new Realtime(io(httpServer));
        
        //<editor-fold defaultstate="collapsed" desc="Access-Control">
        this.app.use((req, res, next) => {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', 'true');

            // Pass to next layer of middleware
            next();
        });
        //</editor-fold>
        
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
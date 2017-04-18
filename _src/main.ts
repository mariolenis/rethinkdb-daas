import * as express from 'express';
import * as http from 'http';
import * as debug from 'morgan';
import * as bodyParser from 'body-parser';
import * as fn from './routes/routes';

export class Server {
    
    app: express.Application = express();
    
    constructor() {
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        this.app.post('/api/put',       fn.putRoute.bind(fn.putRoute));
        this.app.post('/api/list',      fn.listRoute.bind(fn.listRoute));
        this.app.post('/api/update',    fn.updateRoute.bind(fn.updateRoute));
        this.app.post('/api/filter',    fn.filterRoute.bind(fn.filterRoute));
        this.app.post('/api/delete',    fn.deleteRoute.bind(fn.deleteRoute));
        
        this.app.get('/api', (req, res: express.Response) => {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        
        let httpServer = http.createServer(this.app);
        httpServer.listen(3200);
    }
}

new Server();
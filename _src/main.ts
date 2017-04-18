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
        
        this.app.put('/api', fn.putRoute.bind(fn.putRoute));
        
        this.app.get('/api', (req, res: express.Response) => {
            res.status(200).send('API Ready!');
        })
        
        let httpServer = http.createServer(this.app);
        httpServer.listen(3200);
    }
}

new Server();
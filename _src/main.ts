import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as debug from 'morgan';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as io from 'socket.io';
import * as fn from './routes/routes';
import { Realtime } from './realtime';

export class Server {
    
    app: express.Application = express();
    
    constructor() {
        
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        let port = 443;
        let server: http.Server | https.Server;
        try {
            let sslOptions: {key: Buffer, cert: Buffer} = {
                key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
            }
            server = https.createServer(sslOptions, this.app);
        } catch (e) {
            port = 3200;
            server = http.createServer(this.app);
        }
        
        new Realtime(io(server));
        
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
        
        server.listen(port, () => {
            console.log('Listening on port ' + port);
        });
    }
}

new Server();
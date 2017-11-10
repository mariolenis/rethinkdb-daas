import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as debug from 'morgan';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as io from 'socket.io';
import * as routerFn from './routes';
import { Realtime } from './realtime';
import { web_api } from './env.config';

export class Server {
    
    app: express.Application = express();
    
    constructor() {
        
        this.app.use(debug('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

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
        
        this.app.post('/api/put',       routerFn.putRoute.bind(routerFn.putRoute));
        this.app.post('/api/list',      routerFn.listRoute.bind(routerFn.listRoute));
        this.app.post('/api/update',    routerFn.updateRoute.bind(routerFn.updateRoute));
        this.app.post('/api/filter',    routerFn.filterRoute.bind(routerFn.filterRoute));
        this.app.post('/api/delete',    routerFn.deleteRoute.bind(routerFn.deleteRoute));
        
        this.app.get('/api', (req, res: express.Response) => {
            res.status(200).send('Rethink Daas - API Ready!');
        });
        
        let server: http.Server | https.Server;
        try {

            // start server with SSL support
            let sslOptions: {key: Buffer, cert: Buffer} = {
                key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
            }

            server = https.createServer(sslOptions, this.app);
            server.listen(web_api.SSL_PORT, () => {
                console.log('Listening on SSL port ' + web_api.SSL_PORT);
            });

            // Redirect web traffic to SSL 
            http.createServer((req, res) => {
                res.writeHead(301, {
                    "Location" : "https://" + req.headers['host'] + req.url
                });
                res.end();
            }).listen(web_api.PORT);

        } catch (e) {
            server = http.createServer(this.app);
            server.listen(web_api.PORT, () => {
                console.log('Listening on port ' + web_api.PORT);
            });
        }
        
        new Realtime(io(server));
    }
}

new Server();
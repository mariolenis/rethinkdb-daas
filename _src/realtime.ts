import * as express from 'express';
import * as _ from 'lodash';
import * as db from './routes/db';
import * as crypto from 'crypto';
import {Subscription} from 'rxjs/Subscription';

interface INameSpace {id: string, subs: Subscription}

export class Realtime {
    private nameSpaces: INameSpace[];
    
    constructor(private ioSocket: SocketIO.Server) {
        
        this.nameSpaces = [];        
        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            
            console.log("Cliente " + socket.id + " conectado");
            
            // Desconexión
            socket.on('disconnect', () => {
                console.log("Cliente desconectado " + socket.id);
            });
        });
    }
    
    enrollNameSpace(req: express.Request, next: express.NextFunction) {
        let dbName  = req.header('db');
        let table   = (req.body as {table: string}).table;
        let hashid  = crypto.createHash('md5').update(dbName + table).digest('hex');;
        
        let nsp = _.find(this.nameSpaces, {id: hashid});
        
        if (!nsp) {            
            console.log('Enrolando ' + dbName + '/' + table)
            nsp = {
                id: hashid,
                subs: db.connectDB({host: 'localhost', port: 28015, db: dbName})
                    .flatMap(conn => db.changes(conn, table))                    
                    .subscribe(changes => {
                        this.ioSocket.of('/' + dbName).to(table).emit(JSON.stringify(changes));
                    })
            }
            this.nameSpaces.push(nsp);
        }
        
        next();
    }
}
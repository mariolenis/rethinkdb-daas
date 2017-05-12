import * as _ from 'lodash';
import * as db from './routes/db';
import * as crypto from 'crypto';
import { Subscription } from 'rxjs/Subscription';

interface INameSpace {id: string, subs: Subscription}

export class Realtime {
    private nameSpaces: INameSpace[];
    
    constructor(private ioSocket: SocketIO.Server) {
        
        this.nameSpaces = [];        
        
        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            console.log('Client Connected ' + socket.id)
            
            // Joining to room according to table
            socket.on('join', (data: string) => {
                try {
                    let query = JSON.parse(data) as {db: string, table: string};
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + query.db);
                    this.enrollRoom(query);
                    socket.join(query.db);
                } catch (e) {
                    console.error(e);
                    socket.emit('err', e);
                } 
           });
            
            // Disconnect
            socket.on('disconnect', () => {
                console.log("Client Disconnected " + socket.id);
            });
        });
    }
    
    enrollRoom(query: {db: string, table: string}) {
        let hashid  = crypto.createHash('md5').update(query.db + query.table).digest('hex');
        let nsp = _.find(this.nameSpaces, {id: hashid});

        if (!nsp) {            
            console.log('[realtime.enrollNameSpace] Enroll (' + query.db + ') for ' + query.table)

            nsp = {
                id: hashid,
                subs: db.connectDB({host: 'localhost', port: 28015, db: query.db})
                    .flatMap(conn => db.changes(conn, query.table))                    
                    .subscribe(changes => {
                        // Deliver changes to room <db> with subject <table>
                        this.ioSocket.to(query.db).emit(query.table, JSON.stringify(changes));
                    })
            }
            this.nameSpaces.push(nsp);
        }
    }
}
import * as _ from 'lodash';
import * as db from './routes/db';
import * as crypto from 'crypto';
import { Subscription } from 'rxjs/Subscription';
import { rethinkDBConfig } from './routes/env.config';

interface IObservableWatcher {id: string, subs: Subscription}

export class Realtime {
    private watcher: IObservableWatcher[];
    
    constructor(private ioSocket: SocketIO.Server) {
        
        this.watcher = [];        
        
        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            console.log('Client Connected ' + socket.id)
            
            // Joining to room according to table
            socket.on('join', (conn: string) => {
                try {
                    
                    // Parse incoming message
                    let connRequest = JSON.parse(conn) as {db: string, table: string, api_key: string};
                    
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + connRequest.db);
                    
                    // Initilizes an observable of changes related to db and table
                    this.enrollRoom(connRequest);
                    
                    // Verify the connection is authorized
                    db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: rethinkDBConfig.authDb})
                        .flatMap(conn => db.auth(conn, connRequest.api_key))
                        .subscribe(isAuth => {
                            // Join current socket to room
                            isAuth ? 
                                socket.join(connRequest.db) : 
                                socket.emit('err', 'Unathorized to db ' + connRequest.db)
                        });
                    
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
    
    /**
     * @description Function to create a Observable watcher of changes
     * @param query: { db: string, table: string }
     */
    //<editor-fold defaultstate="collapsed" desc="enrollRoom(query: {db: string, table: string}) : void">
    enrollRoom(query: {db: string, table: string}) : void {
        
        // Build a simple hash as id in 
        let hashid  = crypto.createHash('md5').update(query.db + query.table).digest('hex');
        
        // Find in array of memory the observable
        let observer = _.find(this.watcher, {id: hashid});

        // If exist, don't mind to create a new one, the subcriber will emit changes 
        // to every socket joined in db
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + query.db + ') for ' + query.table)

            observer = {
                id: hashid,
                subs: db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db})
                    .flatMap(conn => db.changes(conn, query.table))                    
                    .subscribe(changes => {
                        // Deliver changes to room <db> with subject <table>
                        this.ioSocket.to(query.db).emit(query.table, JSON.stringify(changes));
                    })
            }
            
            // Push new watcher
            this.watcher.push(observer);
        }
    }
    //</editor-fold>
}
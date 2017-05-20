import * as db from './routes/db';
import * as crypto from 'crypto';
import { Subscription } from 'rxjs/Subscription';
import { rethinkDBConfig } from './routes/env.config';

interface IObservableWatcher {id: string, subs: Subscription}

export class Realtime {
    
    // Collection in memory
    private watcher: IObservableWatcher[] = [];
    
    constructor(private ioSocket: SocketIO.Server) {
        
        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            console.log('Client Connected ' + socket.id)
            
            // Joining to room according to table
            socket.on('join', (conn: string, responseFn: (response: string) => void) => {
                try {

                    // Parse incoming message
                    let connRequest = JSON.parse(conn) as {db: string, table: string, api_key: string};
                    
                    console.log('[realtime.constructor] Connecting ' + socket.id + ' to room ' + connRequest.db + ' with API_KEY ' + connRequest.api_key);
                    
                    // Verify the connection is authorized
                    db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: rethinkDBConfig.authDb})
                        .flatMap(conn => db.auth(conn, connRequest.api_key))
                        .map(conn => conn.open)
                        .subscribe(
                            () => {
                                socket.join(socket.id);
                                responseFn('ok');
                            },
                            () => responseFn('err')
                        );
                    
                } catch (e) {
                    console.error(e);
                    responseFn('err: ' + JSON.stringify(e));
                } 
            });
            
            // Enroll listen to changes according to query with an observable
            socket.on('listenChanges', (message: string) => this.enrollChangeListener(message, socket.id));
            
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
    private enrollChangeListener(queryString: string, room: string) : void {
        
        let query = JSON.parse(queryString) as {db: string, table: string, query: db.IRethinkQuery};
        
        // Find in array of memory the observable
        let observer = this.watcher.filter(w => w.id === room).pop();
        
        // If it does not exists, create a new watcher
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + query.table)

            // Create a new Subsciption of changes and then push new watcher
            this.watcher.push({
                id: room,
                subs: this.changesSubscription(query, room)
            });
        }
        // If exist, just update the subscription based on the new query
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + query.table)
            
            // unsubscribe the current listener of changes
            observer.subs.unsubscribe();
            
            // Create a new one based on the query
            observer.subs = this.changesSubscription(query, room)
        }
    }
    //</editor-fold>
    
    private changesSubscription(query: {db: string, table: string, query: db.IRethinkQuery}, room: string): Subscription {
        return db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db})
            .flatMap(conn => db.changes(conn, query))                    
            .subscribe(changes => {
                // Deliver changes to room <socket.id> with subject <table>
                this.ioSocket.to(room).emit(query.table, JSON.stringify(changes));
            })
    }
}
import * as db from './routes/db';
import { Subscription } from 'rxjs/Subscription';
import { rethinkDBConfig } from './routes/env.config';

interface IObservableWatcher {id: string, subs: Subscription}

export class Realtime {
    
    // Collection in memory
    private watcher: IObservableWatcher[] = [];
    
    /**
     * @constructor creates the connection to the socket.io server
     * @param <Socket.Server> ioSocket
     */
    //<editor-fold defaultstate="collapsed" desc="constructor(private ioSocket: SocketIO.Server)">
    constructor(private ioSocket: SocketIO.Server) {
        
        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            console.log('Client Connected ' + socket.id)
            
            // Joining to room according to table
            socket.on('validate', (conn: string, response: (response: string) => void) => {
                try {

                    // Parse incoming message
                    let connRequest = JSON.parse(conn) as {db: string, table: string, api_key: string};
                    
                    console.log('[realtime.constructor] Validating ' + socket.id + ' to connect to ' + connRequest.db + ' with API_KEY ' + connRequest.api_key);
                    
                    // Verify the connection is authorized
                    db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: rethinkDBConfig.authDb})
                        .flatMap(conn => db.auth(conn, connRequest.api_key))
                        .map(conn => conn.close())
                        
                        // Reconnect to the authorized db
                        .flatMap(() => db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: connRequest.db}))
                        
                        // Verify if it exists, if not, create a new one
                        .flatMap(conn => db.tableVerify(conn, connRequest.db, connRequest.table))
                        
                        // Subscribe
                        .map(conn => conn.open)
                        .subscribe(
                            () => response('ok'),
                            () => response('err')
                        );
                    
                } catch (e) {
                    console.error(e);
                    response('err: ' + JSON.stringify(e));
                } 
            });
            
            // Enroll listen to changes according to query with an observable
            socket.on('listenChanges', (message: string) => this.enrollChangeListener(message, socket.id));
            
            // Disconnect
            socket.on('disconnect', () => {
                console.log("Client Disconnected " + socket.id);
                // Find in array of memory the observable
                let indexObserver = this.watcher.findIndex(w => w.id === socket.id);
                if (indexObserver > -1) {
                    console.log('Cleaning watcher ' + socket.id);
                    this.watcher[indexObserver].subs.unsubscribe();
                    this.watcher.splice(indexObserver);
                }
            });
        });
    }
    //</editor-fold>
    
    /**
     * @description Function to create a Observable watcher of changes
     * @param <db: string, table: string> query
     * @param <string> room which matches socket.id
     */
    //<editor-fold defaultstate="collapsed" desc="enrollRoom(query: {db: string, table: string}) : void">
    private enrollChangeListener(queryString: string, room: string) : void {
        
        let query = JSON.parse(queryString) as {db: string, table: string, query: db.IRethinkQuery};
        
        // Find in array of memory the observable
        let observer = this.watcher.find(w => w.id === room);
        
        // If it does not exists, create a new watcher
        if (!observer) {
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(query))

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
    
    /**
     * @description Subscribe to a changes
     * @param <db: string, table: string, query: db.IRethinkQuery> query
     * @param <string> room which matches socket.id
     */
    //<editor-fold defaultstate="collapsed" desc="private changesSubscription(query: {db: string, table: string, query: db.IRethinkQuery}, room: string): Subscription">
    private changesSubscription(query: {db: string, table: string, query: db.IRethinkQuery}, room: string): Subscription {
        
        return db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: query.db})
            // Start the changes listener
            .flatMap(conn => db.changes(conn, query))
            
            // Deliver changes to room <socket.id> with subject <table>
            .subscribe(changes => {
                console.log('Emitting changes to ' + room);
                // By default every socket on connection joins to a room with the .id
                this.ioSocket.to(room)
                    .emit(query.table, JSON.stringify(changes))
            })
    }
    //</editor-fold>
}
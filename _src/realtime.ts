import * as db from './daas/db';
import * as http from 'http';
import * as https from 'https';
import * as io from 'socket.io';
import { Subscription } from 'rxjs/Subscription';
import { rethinkDBConfig } from './env.config';
import { IRethinkDBAPIConfig, IRethinkQuery } from './daas/db';

interface IObservableWatcher {id: string, subs: Subscription}

export class Realtime {
    
    // Collection in memory
    private watcher: IObservableWatcher[] = [];
    
    /**
     * @constructor creates the connection to the socket.io server
     * @param <Socket.Server> ioSocket
     */
    constructor(private ioSocket: SocketIO.Server) {

        /**
         * Middleware to authenticate the connection
         */
        this.ioSocket.use((socket, next) => {
            const query = (socket.handshake.query as {payload: string}).payload;
            const dbConf = JSON.parse(query) as IRethinkDBAPIConfig;             
            
            console.log('[realtime.constructor.middleware] Validating ' + socket.id + ' to connect to ' + dbConf.database + ' with API_KEY ' + dbConf.api_key);

            // Verify the connection is authorized
            db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: rethinkDBConfig.authDb}, 'auth')
                .flatMap(conn => db.auth(conn, dbConf.api_key))
                .map(conn => conn.close())
                .subscribe(
                    () => next(),
                    err => next(new Error(err))
                );
        })

        this.ioSocket.on('connection', (socket: SocketIO.Socket) => {
            console.log('Client Connected ' + socket.id)
            
            socket.on('register', 
                (params: string, response: (response: string) => void) => this.registerConnection(socket, params, response)
            );

            // Disconnect
            socket.on('disconnect', () => {
                console.log("Client Disconnected " + socket.id);
                // Find watcher in array of memory, unsubscribe from listening to changes and remove item
                let indexObserver = this.watcher.findIndex(w => w.id === socket.id);
                if (indexObserver > -1) {
                    console.log('Cleaning watcher ' + socket.id);
                    this.watcher[indexObserver].subs.unsubscribe();
                    this.watcher.splice(indexObserver, 1);
                }
            });
            
            // Let know that connection is ok
            socket.emit('connection', socket.id);
        });
    }

    private registerConnection(socket: SocketIO.Socket, params: string, responseFn: (response: string) => void): void {
        
        const  queryParams = JSON.parse(params) as {database: string, table: string, query: IRethinkQuery};

        // Connect to the authorized db
        db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: queryParams.database}, 'table-veryf')
            
            // Verify if table exists, if not, create a new one
            .flatMap(conn => db.tableVerify(conn, queryParams.database, queryParams.table))
            
            // Enroll Listener
            .map(conn => {
                this.enrollChangeListener(queryParams, socket.id);
                return conn;
            })

            // Execute 1st query
            .switchMap(r_conn => db.list(r_conn, queryParams.table, queryParams.query))

            // emit to socket
            .map(result => {
                console.log('[realtime.registerConnection] Emiting result of query to ' + socket.id + ' ['+ result.length + ']');
                
                // clear the current state 
                this.ioSocket.to(socket.id)
                    .emit(socket.id, JSON.stringify({}));
                
                // Send each value of results
                result.forEach(new_val => {
                    this.ioSocket.to(socket.id)
                        .emit(socket.id, JSON.stringify({new_val: new_val}));
                });
                console.log('[realtime.registerConnection] Done!');
            })
            .subscribe(
                ()  => responseFn(JSON.stringify({msj: 'SUCCESS'})),
                err => responseFn(JSON.stringify({err: err}))
            );
    }
    
    /**
     * @description Function to create a Observable watcher of changes
     * @param <db: string, table: string> query
     * @param <string> room which matches socket.id
     */
    private enrollChangeListener(queryParams: {database: string, table: string, query: IRethinkQuery}, room: string) : void {
        
        // Find in array of memory the observable
        let observer = this.watcher.find(w => w.id === room);
        
        // If it does not exists, create a new watcher
        if (!observer) {
            
            // Create a new Subsciption of changes and then push new watcher
            this.watcher.push({
                id: room,
                subs: this.startSubscription(queryParams, room)
            });
            
            console.log('[realtime.enrollNameSpace] Enroll (' + room + ') for ' + JSON.stringify(queryParams) + " " + this.watcher.length)
        }
        // If exist, just update the subscription based on the new query
        else {
            console.log('[realtime.enrollNameSpace] Renewing (' + room + ') for ' + JSON.stringify(queryParams))
            
            // unsubscribe the current listener of changes
            observer.subs.unsubscribe();
            
            // Create a new one based on the query
            observer.subs = this.startSubscription(queryParams, room)
        }
    }
    
    /**
     * @description Subscribe to a changes
     * @param <db: string, table: string, query: db.IRethinkQuery> query
     * @param <string> room which matches socket.id
     */
    private startSubscription(queryParams: {database: string, table: string, query: IRethinkQuery}, room: string): Subscription {
        
        return db.connectDB({host: rethinkDBConfig.host, port: rethinkDBConfig.port, db: queryParams.database}, 'realtime')
        
            // Start the changes listener
            .flatMap(conn => db.changes(conn, {query: queryParams.query, table: queryParams.table}))
            
            // Deliver changes to room <socket.id> with subject <table>
            .subscribe(
                changes => {
                    console.log('Emitting changes to ' + room + ' ' + JSON.stringify(queryParams));
                    // By default every socket on connection joins to a room with the .id
                    this.ioSocket.to(room)
                        .emit(room, JSON.stringify(changes))
                },
                err => {
                    this.ioSocket.to(room)
                        .emit(room, JSON.stringify({err: err}))
                }
            )
    }
}
import RPC from '@hyperswarm/rpc'
import b4a from 'b4a'

const rpc = new RPC()
let client = null;
const clients = [];

if (!Pear.config.args[0]) {
    const server = rpc.createServer();
    await server.listen();
    console.log("Server PublicKey:", server.publicKey.toString('hex'));



    server.on('connection', conn => {
        clients.push(conn);
        console.log("New client connected");

        conn.on('close', () => {
            console.log("Client disconnected");
            const index = clients.indexOf(conn);
            if (index > -1) {
                clients.splice(index, 1);
            }
        });
    });

    // Handle incoming 'echo' requests
    server.respond('echo', async (req) => {
        console.log('Received echo request:', req.toString());
        // Broadcast to all clients
        for (const conn of clients) {
            console.log(clients.length)
            conn.request('echo'); // Send the same data to all other clients
        }
        return req; // Respond back to the requester
    });

    // client = rpc.connect(server.publicKey);
} else {
    const key = b4a.from(Pear.config.args[0], 'hex');
    client = rpc.connect(key, { client: true, server: true });

    const clientServer = rpc.createServer();
    // Listen for incoming requests
    await clientServer.listen();

    clientServer.respond('echo', (req) => {
        console.log(`Server called clientFunction with message: ${req.toString()}`);
        return b4a.from('Client received your message');
    });

    client.on('connect', () => {
        console.log('Connected to server');
    });

    // Listen for echoed data from the server
    client.on('data', (data) => {
        console.log('Received data from server:', data.toString());
    });

    client.on('connection', () => {
        console.log('Connected to server');
    });

    console.log("Client listening for server requests...");

    // Handle connection event

    setTimeout(() => client.request('echo', Buffer.from('hello world')), 3000);

}

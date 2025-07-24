import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { createClient } from '@libsql/client';


process.loadEnvFile();
const PORT = process.env.PORT;

const db = createClient({
    url : process.env.DB_URL,
    authToken : process.env.DB_TOKEN
});

await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
    id_message INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    user TEXT default "anonimo",
    fecha TIMESTAMP default CURRENT_TIMESTAMP
    )
    `);
   
const app = express();
const server = createServer(app);

const io = new Server(server, {
    connectionStateRecovery : {}
});



app.use(logger('dev'));
app.use(express.static(process.cwd() + "/client"));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(PORT, () => {
    console.log(`Servidor abierto en http://localhost:${PORT}`);
});



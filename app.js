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

io.on('connection', async (socket) => {
    console.log("Usuario conectado");

    // Evento de desconexión
    socket.on('disconnect', () => {
        console.log("Usuario desconectado");
    });

    socket.on('chat message', async(msg, username) => {
        let result;
        let fechaObj = new Date();
        // Formato: dd/mm/yyyy hh:mm
        let fecha = fechaObj.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        try {
            result = await db.execute({
                sql : `INSERT INTO messages (content, user, fecha) VALUES (:msg, :username, :fecha)`,
                args : {msg, username, fecha: fechaObj.toISOString()}
            });
        } catch (err) {
            console.log(err);
            return;
        }
        io.emit('chat message', msg, result.lastInsertRowid.toLocaleString(), username, fecha);
    });

    console.log(socket.handshake.auth);

    if(!socket.recovered) {
        try {
            const result = await db.execute({
                sql : `SELECT * FROM messages WHERE id_message > ?`,
                args : [socket.handshake.auth.serverOffset ?? 0]
            });

            result.rows.forEach(row => {
                // Formatear la fecha al emitir mensajes antiguos
                let fechaFormateada = new Date(row.fecha).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                socket.emit('chat message', row.content, row.id_message.toLocaleString(), row.user, fechaFormateada);
            });
            
        } catch (err) {
            console.log(err);
            return;
        }
    }
});

app.use(logger('dev'));
app.use(express.static(process.cwd() + "/client"));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(PORT, () => {
    console.log(`Servidor abierto en http://localhost:${PORT}`);
});



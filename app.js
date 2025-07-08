import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

process.loadEnvFile();
const PORT = process.env.PORT;

const app = express();
const server = createServer(app);




app.use(logger('dev'));
app.use(express.static(process.cwd() + "/client"));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(PORT, () => {
    console.log(`Servidor abierto en http://localhost:${PORT}`);
});



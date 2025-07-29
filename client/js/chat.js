import {io} from 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js';

const formUserName = document.getElementById('formUserName');
const form = document.getElementById('form'); // formulario de los mensajes
const input = document.getElementById('message'); // mensaje
const messages = document.getElementById('messages'); // lista de mensajes

let userName = ""; // nombre del usuario actual
let socket;

let userColors = {}; // guardar los colores de cada usuario

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
}


let socketInitialized = false;
formUserName.addEventListener('submit', (e) => {
    e.preventDefault();
    if (socketInitialized) return; // Evita múltiples sockets/listeners
    userName = document.getElementById('userName').value.trim();
    if (!userName) return;
    userColors[userName] = getRandomColor();

    socket = io({
        auth : {
            serverOffset: 0,
            userName
        }
    });
    socketInitialized = true;

    socket.on('chat message', (msg, serverOffset, usuarioMensaje) => {
        if (!userColors[usuarioMensaje]) {
            userColors[usuarioMensaje] = getRandomColor();
        }
        const isOwn = usuarioMensaje === userName;
        const color = userColors[usuarioMensaje];
        let item = `<li class="message${isOwn ? ' own' : ' other'}" style="background:${color}">`;
        item += `${msg}<span>${usuarioMensaje}</span></li>`;
        messages.innerHTML += item;
        socket.auth.serverOffset = serverOffset;
        messages.scrollTop = messages.scrollHeight;
    });
    // Opcional: ocultar el formulario de usuario tras iniciar sesión
    formUserName.style.display = 'none';
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (input.value && socket) {
        socket.emit('chat message', input.value, userName);
        input.value = "";
    }
})
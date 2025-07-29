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

// Calcula si el texto debe ser oscuro o claro según el fondo
function getContrastTextColor(bgColor) {
    // Extrae los valores HSL
    const hsl = bgColor.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!hsl) return '#181c20';
    const l = parseInt(hsl[3], 10); // lightness
    // Si la luminosidad es alta, texto oscuro; si es baja, texto claro
    return l > 70 ? '#181c20' : '#e3e6ea';
}


let socketInitialized = false;
formUserName.addEventListener('submit', (e) => {
    e.preventDefault();
    if (socketInitialized) return; // Evita múltiples sockets/listeners
    userName = document.getElementById('userName').value.trim();
    if (!userName) return;
    userColors[userName] = getRandomColor();

    // Mostrar usuario actual en la parte superior
    const userInfo = document.getElementById('userInfo');
    userInfo.textContent = `Usuario actual: ${userName}`;
    userInfo.style.display = 'block';
    userInfo.style.textAlign = 'center';
    userInfo.style.fontWeight = 'bold';
    userInfo.style.marginBottom = '10px';
    userInfo.style.color = '#43c6ac';
    userInfo.style.fontSize = '1.1rem';

    socket = io({
        auth : {
            serverOffset: 0,
            userName
        }
    });
    socketInitialized = true;

    socket.on('chat message', (msg, serverOffset, usuarioMensaje, fecha) => {
        // Soporta ambos casos: 3 o 4 argumentos
        let nombre = usuarioMensaje;
        let colorUser = usuarioMensaje;
        let fechaMostrar = fecha;
        if (typeof usuarioMensaje === 'undefined' && typeof serverOffset === 'string') {
            // Mensaje antiguo: msg, id, user, fecha
            nombre = serverOffset;
            colorUser = serverOffset;
            serverOffset = null;
        }
        if (!userColors[nombre]) {
            userColors[nombre] = getRandomColor();
        }
        const isOwn = nombre === userName;
        const color = userColors[nombre];
        // Determinar color de texto según fondo
        function getAutoTextColor(bg) {
            // Si es un gradiente, tomar el primer color
            let bgColor = bg;
            if (bg.startsWith('linear-gradient')) {
                const match = bg.match(/#([0-9a-fA-F]{6})/);
                if (match) bgColor = `#${match[1]}`;
                else bgColor = '#d6d7ef';
            }
            // Si es hsl o rgb, convertir a rgb
            let r, g, b;
            if (bgColor.startsWith('#')) {
                const hex = bgColor.replace('#', '');
                r = parseInt(hex.substring(0,2),16);
                g = parseInt(hex.substring(2,4),16);
                b = parseInt(hex.substring(4,6),16);
            } else if (bgColor.startsWith('rgb')) {
                [r,g,b] = bgColor.match(/\d+/g).map(Number);
            } else if (bgColor.startsWith('hsl')) {
                const hsl = bgColor.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
                if (hsl) {
                    // Conversión simple hsl a rgb
                    let h = parseInt(hsl[1],10)/360, s = parseInt(hsl[2],10)/100, l = parseInt(hsl[3],10)/100;
                    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    let p = 2 * l - q;
                    function hue2rgb(p, q, t) {
                        if(t < 0) t += 1;
                        if(t > 1) t -= 1;
                        if(t < 1/6) return p + (q - p) * 6 * t;
                        if(t < 1/2) return q;
                        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    }
                    r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
                    g = Math.round(hue2rgb(p, q, h) * 255);
                    b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
                } else {
                    r = g = b = 220;
                }
            } else {
                r = g = b = 220;
            }
            // Luminancia relativa
            const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
            return luminance > 0.6 ? '#23233a' : '#fff';
        }
        const textColor = getAutoTextColor(isOwn ? 'linear-gradient(90deg, #a59edb 0%, #5a4ca6 100%)' : color);
        // Si no hay fecha, usar la fecha actual SOLO si es mensaje propio y no viene del backend
        if (!fechaMostrar) {
            if (isOwn) {
                const hoy = new Date();
                fechaMostrar = hoy.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
                    ' ' + hoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            } else {
                fechaMostrar = '';
            }
        }
        let item = `<li class="message${isOwn ? ' own' : ' other'}" style="background:${isOwn ? 'linear-gradient(90deg, #a59edb 0%, #5a4ca6 100%)' : color};color:${textColor}">`;
        item += `<span style=\"color:${textColor};\">${nombre}${fechaMostrar ? ' (' + fechaMostrar + ')' : ''}</span>${msg}</li>`;
        messages.innerHTML += item;
        if (serverOffset && socket && socket.auth) socket.auth.serverOffset = serverOffset;
        messages.scrollTop = messages.scrollHeight;
    });
    // Ocultar el formulario de usuario tras iniciar sesión
    formUserName.style.display = 'none';
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (input.value && socket) {
        socket.emit('chat message', input.value, userName);
        input.value = "";
    }
})
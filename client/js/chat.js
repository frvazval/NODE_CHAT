import {io} from 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js';

const formUserName = document.getElementById('formUserName');

let username = ""; // nombre del usuario actual
let socket;

let userColors = {}; // guardar los colores de cada usuario



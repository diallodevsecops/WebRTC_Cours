// Initialisation de Socket.IO
const socket = io();

// Variables globales
let username = '';
let connected = false;

// Éléments du DOM
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messages');
const numUsersSpan = document.getElementById('numUsers');

// Événements de connexion
loginBtn.addEventListener('click', login);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});

// Événements d'envoi de message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Fonction de connexion
function login() {
    const usernameValue = usernameInput.value.trim();

    if (usernameValue) {
        username = usernameValue;
        socket.emit('add user', username);
    }
}

// Fonction d'envoi de message
function sendMessage() {
    const message = messageInput.value.trim();

    if (message && connected) {
        socket.emit('new message', message);
        messageInput.value = '';
    }
}

// Fonction pour afficher un message
function displayMessage(data, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;

    messageDiv.innerHTML = `
        <div class="message-header">
            ${escapeHtml(data.username)} -${data.timestamp}
        </div>
        <div class="message-text">${escapeHtml(data.message)}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fonction pour afficher un message système
function displaySystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fonction pour échapper le HTML (sécurité XSS)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Événements Socket.IO

// Connexion réussie
socket.on('login', (data) => {
    connected = true;
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    messageInput.focus();
    numUsersSpan.textContent = data.numUsers;
    displaySystemMessage(`Bienvenue dans le chat, ${username} !`);
});

// Messages précédents
socket.on('previous messages', (messages) => {
    messages.forEach(message => {
        displayMessage(message, message.username === username);
    });
});

// Nouveau message
socket.on('new message', (data) => {
    displayMessage(data, data.username === username);
});

// Utilisateur rejoint
socket.on('user joined', (data) => {
    numUsersSpan.textContent = data.numUsers;
    displaySystemMessage(`${data.username} a rejoint le chat`);
});

// Utilisateur quitte
socket.on('user left', (data) => {
    numUsersSpan.textContent = data.numUsers;
    displaySystemMessage(`${data.username} a quitté le chat`);
});

// Gestion des erreurs de connexion
socket.on('connect_error', () => {
    displaySystemMessage('Erreur de connexion au serveur');
});

socket.on('disconnect', () => {
    connected = false;
    displaySystemMessage('Connexion perdue');
});

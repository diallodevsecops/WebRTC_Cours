const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration
const PORT = process.env.PORT || 3000;

// Stockage en mémoire des messages
let messages = [];
let users = [];

// Configuration du moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.render('index', { title: 'Chat App' });
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté:', socket.id);

    // Envoyer les messages existants au nouvel utilisateur
    socket.emit('previous messages', messages);

    // Gérer l'ajout d'un utilisateur
    socket.on('add user', (username) => {

        if (username && !users.find(user => user.name === username)) {

            const user = {
                id: socket.id,
                name: username
            };

            users.push(user);
            socket.username = username;

            // Informer tous les clients qu'un utilisateur s'est connecté
            socket.broadcast.emit('user joined', {
                username: username,
                numUsers: users.length
            });

            // Confirmer à l'utilisateur qu'il est connecté
            socket.emit('login', {
                numUsers: users.length
            });

            console.log(`${username} a rejoint le chat`);
        }
    });

    // Gérer les nouveaux messages
    socket.on('new message', (data) => {

        if (socket.username) {

            const message = {
                username: socket.username,
                message: data,
                timestamp: new Date().toLocaleTimeString()
            };

            // Ajouter le message au stockage
            messages.push(message);

            // Limiter à 50 messages en mémoire
            if (messages.length > 50) {
                messages.shift();
            }

            // Diffuser le message à tous les clients
            io.emit('new message', message);

            console.log(`Message de ${socket.username} : ${data}`);
        }
    });

    // Gérer la déconnexion
    socket.on('disconnect', () => {

        if (socket.username) {

            // Retirer l'utilisateur de la liste
            users = users.filter(user => user.id !== socket.id);

            // Informer les autres utilisateurs
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: users.length
            });

            console.log(`${socket.username} a quitté le chat`);
        }
    });
});

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

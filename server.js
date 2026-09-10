const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {}; // socket.id -> { username, currentRoom }
const rooms = {}; // roomId -> { id, title, desc, limit, ownerId, users: [], banned: [] }

function getPublicRooms() {
    return Object.values(rooms).map(r => ({
        id: r.id,
        title: r.title,
        desc: r.desc,
        limit: r.limit,
        userCount: r.users.length
    }));
}

io.on('connection', (socket) => {
    socket.on('set_username', (username) => {
        const trimmed = (username || '').trim();
        if (trimmed.length < 2 || trimmed.length > 16) {
            return socket.emit('login_error', 'Kullanıcı adı 2-16 karakter olmalıdır.');
        }

        const isTaken = Object.values(users).some(u => u.username.toLowerCase() === trimmed.toLowerCase());
        if (isTaken) {
            return socket.emit('login_error', 'Bu kullanıcı adı zaten alınıyor.');
        }

        users[socket.id] = { username: trimmed, currentRoom: null };
        socket.emit('login_success', { username: trimmed });
        socket.emit('rooms_update', getPublicRooms());
    });

    socket.on('create_room', (data) => {
        const user = users[socket.id];
        if (!user) return socket.emit('create_error', 'Oturum bulunamadı.');

        // Kullanıcı zaten bir odanın sahibi mi kontrol et (Spam Engeli)
        const existingOwnedRoom = Object.values(rooms).find(r => r.ownerId === socket.id);
        if (existingOwnedRoom) {
            return socket.emit('create_error', 'Zaten aktif bir odanız var! Yeni oda oluşturamazsınız.');
        }

        const title = (data.title || '').trim();
        const desc = (data.desc || '').trim();
        const limit = parseInt(data.limit, 10) || 10;

        if (title.length < 2 || title.length > 16) {
            return socket.emit('create_error', 'Başlık 2-16 karakter olmalıdır.');
        }
        if (limit < 3 || limit > 32) {
            return socket.emit('create_error', 'Kişi limiti 3-32 arasında olmalıdır.');
        }

        const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newRoom = {
            id: roomId,
            title,
            desc,
            limit,
            ownerId: socket.id,
            users: [],
            banned: []
        };

        rooms[roomId] = newRoom;
        
        socket.emit('room_created', newRoom);
        io.emit('rooms_update', getPublicRooms());
    });

    socket.on('join_room', (roomId) => {
        const user = users[socket.id];
        const room = rooms[roomId];

        if (!user) return socket.emit('room_error', 'Oturum geçersiz.');
        if (!room) return socket.emit('room_error', 'Oda bulunamadı.');

        if (room.banned.includes(socket.id)) {
            return socket.emit('room_error', 'Bu odadan yasaklandınız.');
        }

        if (room.users.length >= room.limit && !room.users.some(u => u.id === socket.id)) {
            return socket.emit('room_error', 'Oda dolu.');
        }

        // Önceki odadan ayrıl
        if (user.currentRoom && rooms[user.currentRoom]) {
            leaveRoom(socket);
        }

        user.currentRoom = roomId;
        socket.join(roomId);

        if (!room.users.some(u => u.id === socket.id)) {
            room.users.push({ id: socket.id, username: user.username });
        }

        socket.emit('room_joined', {
            id: room.id,
            title: room.title,
            desc: room.desc,
            limit: room.limit,
            ownerId: room.ownerId,
            users: room.users
        });

        io.to(roomId).emit('sys_message', {
            type: 'info',
            text: `${user.username} odaya katıldı.`
        });

        io.to(roomId).emit('room_users_update', {
            users: room.users,
            limit: room.limit,
            ownerId: room.ownerId
        });

        io.emit('rooms_update', getPublicRooms());
    });

    function leaveRoom(socket) {
        const user = users[socket.id];
        if (!user || !user.currentRoom) return;

        const roomId = user.currentRoom;
        const room = rooms[roomId];
        user.currentRoom = null;
        socket.leave(roomId);

        if (room) {
            room.users = room.users.filter(u => u.id !== socket.id);

            if (room.users.length === 0) {
                delete rooms[roomId];
            } else {
                if (room.ownerId === socket.id) {
                    room.ownerId = room.users[0].id;
                }
                io.to(roomId).emit('sys_message', {
                    type: 'info',
                    text: `${user.username} ayrıldı.`
                });
                io.to(roomId).emit('room_users_update', {
                    users: room.users,
                    limit: room.limit,
                    ownerId: room.ownerId
                });
            }
        }
        io.emit('rooms_update', getPublicRooms());
    }

    socket.on('leave_room', () => {
        leaveRoom(socket);
    });

    socket.on('send_message', (text) => {
        const user = users[socket.id];
        if (!user || !user.currentRoom) return;

        const msgText = (text || '').trim();
        if (!msgText || msgText.length > 150) return;

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        io.to(user.currentRoom).emit('new_message', {
            sender: user.username,
            text: msgText,
            time: timeStr
        });
    });

    socket.on('disconnect', () => {
        leaveRoom(socket);
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

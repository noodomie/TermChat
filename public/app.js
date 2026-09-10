const socket = io();

class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBlup() {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    playSend() {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {}
    }

    playReceive() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(680, now + 0.06);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    playSystem() {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }
}

const sfx = new SoundFX();

document.addEventListener('click', (e) => {
    sfx.init();
    if (e.target.closest('button, .room-card, .drawer-handle-notch, .close-notch, .tab-btn')) {
        sfx.playBlup();
    }
});

let myUsername = '';
let currentRoomId = null;

const screenLogin = document.getElementById('screen-login');
const screenLobby = document.getElementById('screen-lobby');
const screenChat = document.getElementById('screen-chat');

const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');

const tabRoomsBtn = document.getElementById('tab-rooms-btn');
const tabCreateBtn = document.getElementById('tab-create-btn');
const tabRooms = document.getElementById('tab-rooms');
const tabCreate = document.getElementById('tab-create');
const roomsList = document.getElementById('rooms-list');

const createTitle = document.getElementById('create-title');
const createDesc = document.getElementById('create-desc');
const createLimit = document.getElementById('create-limit');
const createSubmitBtn = document.getElementById('create-submit-btn');

const chatRoomTitle = document.getElementById('chat-room-title');
const chatRoomCount = document.getElementById('chat-room-count');
const leaveRoomBtn = document.getElementById('leave-room-btn');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMsgBtn = document.getElementById('send-msg-btn');

const drawerHandle = document.getElementById('drawer-handle');
const drawerPanel = document.getElementById('drawer-panel');
const drawerCloseBtn = document.getElementById('drawer-close-btn');
const userList = document.getElementById('user-list');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close-btn');

function showModal(title, text) {
    modalTitle.textContent = title;
    modalBody.textContent = text;
    modalOverlay.classList.add('active');
    sfx.playSystem();
}

modalCloseBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

function switchScreen(targetScreen) {
    screenLogin.classList.remove('active');
    screenLobby.classList.remove('active');
    screenChat.classList.remove('active');
    targetScreen.classList.add('active');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

loginBtn.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    const username = usernameInput.value.trim();
    if (username.length < 2 || username.length > 16) {
        showModal('ERROR', 'Username must be between 2 and 16 characters!');
        return;
    }
    myUsername = username;
    socket.emit('set_username', username);
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

socket.on('login_success', () => {
    switchScreen(screenLobby);
});

socket.on('login_error', (msg) => {
    showModal('ERROR', msg);
});

tabRoomsBtn.addEventListener('click', () => {
    tabRoomsBtn.classList.add('active');
    tabCreateBtn.classList.remove('active');
    tabRooms.classList.add('active');
    tabCreate.classList.remove('active');
});

tabCreateBtn.addEventListener('click', () => {
    tabCreateBtn.classList.add('active');
    tabRoomsBtn.classList.remove('active');
    tabCreate.classList.add('active');
    tabRooms.classList.remove('active');
});

createSubmitBtn.addEventListener('click', (e) => {
    if (e) e.preventDefault();

    const title = createTitle ? createTitle.value.trim() : '';
    const desc = createDesc ? createDesc.value.trim() : '';
    const valLimit = createLimit ? parseInt(createLimit.value, 10) : 10;
    const limit = isNaN(valLimit) ? 10 : valLimit;

    if (title.length < 2 || title.length > 16) {
        showModal('ERROR', 'Title must be 2-16 characters long!');
        return;
    }
    if (limit < 3 || limit > 32) {
        showModal('ERROR', 'Limit must be between 3 and 32!');
        return;
    }

    // Butonu geçici olarak kilitle (spam engeli)
    createSubmitBtn.disabled = true;
    socket.emit('create_room', { title, desc, limit });
});

socket.on('create_error', (msg) => {
    createSubmitBtn.disabled = false;
    showModal('ERROR', msg || 'Could not create room!');
});

socket.on('room_error', (msg) => {
    createSubmitBtn.disabled = false;
    showModal('ERROR', msg || 'Room operation failed!');
});

socket.on('room_created', (room) => {
    createSubmitBtn.disabled = false;
    // Form alanlarını temizle
    if (createTitle) createTitle.value = '';
    if (createDesc) createDesc.value = '';
    
    joinRoom(room.id);
});

socket.on('rooms_update', (rooms) => {
    roomsList.innerHTML = '';
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div style="text-align:center; padding:20px; color:#8b949e;">No active rooms. Create one!</div>';
        return;
    }

    rooms.forEach(r => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-card-header">
                <span>${escapeHtml(r.title)}</span>
                <span>[${r.userCount}/${r.limit}]</span>
            </div>
            <div class="room-card-desc">${escapeHtml(r.desc || 'No description')}</div>
        `;
        card.addEventListener('click', () => {
            joinRoom(r.id);
        });
        roomsList.appendChild(card);
    });
});

function joinRoom(roomId) {
    socket.emit('join_room', roomId);
}

socket.on('room_joined', (roomData) => {
    currentRoomId = roomData.id;
    chatRoomTitle.textContent = roomData.title;
    chatRoomCount.textContent = `[${roomData.users.length}/${roomData.limit}]`;
    chatMessages.innerHTML = '';
    switchScreen(screenChat);
    updateDrawerUsers(roomData.users, roomData.ownerId);
});

leaveRoomBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('leave_room');
        currentRoomId = null;
        switchScreen(screenLobby);
        drawerPanel.classList.remove('open');
    }
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    if (text.length > 150) {
        showModal('ERROR', 'Message too long!');
        return;
    }

    socket.emit('send_message', text);
    messageInput.value = '';
}

sendMsgBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

socket.on('new_message', (msg) => {
    const isMe = msg.sender === myUsername;
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isMe ? 'me' : 'other'}`;

    wrapper.innerHTML = `
        <div class="msg-sender">${escapeHtml(msg.sender)}</div>
        <div class="msg-box">
            ${escapeHtml(msg.text)}
            <span class="msg-time">${msg.time}</span>
        </div>
    `;

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (isMe) {
        sfx.playSend();
    } else {
        sfx.playReceive();
    }
});

socket.on('sys_message', (data) => {
    const sysDiv = document.createElement('div');
    sysDiv.className = `sys-msg sys-${data.type}`;
    sysDiv.textContent = data.text;
    chatMessages.appendChild(sysDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    sfx.playSystem();
});

socket.on('room_users_update', (data) => {
    chatRoomCount.textContent = `[${data.users.length}/${data.limit}]`;
    updateDrawerUsers(data.users, data.ownerId);
});

socket.on('kicked_or_banned', (reason) => {
    currentRoomId = null;
    switchScreen(screenLobby);
    drawerPanel.classList.remove('open');
    showModal('NOTICE', reason);
});

function updateDrawerUsers(users, ownerId) {
    userList.innerHTML = '';
    const isOwner = socket.id === ownerId;

    users.forEach(u => {
        const li = document.createElement('li');
        li.className = 'user-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'user-item-name';
        
        let crownHtml = u.id === ownerId ? `<svg class="crown-icon" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>` : '';
        nameSpan.innerHTML = `${crownHtml} ${escapeHtml(u.username)}`;

        li.appendChild(nameSpan);

        if (isOwner && u.id !== socket.id) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'user-item-actions';

            const kickBtn = document.createElement('button');
            kickBtn.className = 'term-btn action-btn danger-btn';
            kickBtn.textContent = 'KICK';
            kickBtn.addEventListener('click', () => {
                socket.emit('admin_action', { action: 'kick', targetId: u.id });
            });

            const banBtn = document.createElement('button');
            banBtn.className = 'term-btn action-btn danger-btn';
            banBtn.textContent = 'BAN';
            banBtn.addEventListener('click', () => {
                socket.emit('admin_action', { action: 'ban', targetId: u.id });
            });

            actionsDiv.appendChild(kickBtn);
            actionsDiv.appendChild(banBtn);
            li.appendChild(actionsDiv);
        }

        userList.appendChild(li);
    });
}

drawerHandle.addEventListener('click', () => {
    drawerPanel.classList.toggle('open');
});

drawerCloseBtn.addEventListener('click', () => {
    drawerPanel.classList.remove('open');
});

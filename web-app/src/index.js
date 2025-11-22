const PROXY_URL = 'http://localhost:3001';

// Navegación entre secciones
function showSection(sectionId, evt) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav button').forEach((button) => {
        button.classList.remove('active');
    });
    if (evt && evt.target) {
        evt.target.classList.add('active');
    }
}

// Cambiar etiquetas según tipo de mensaje
document.getElementById('messageType').addEventListener('change', function () {
    const type = this.value;
    const label = document.getElementById('recipientLabel');
    const input = document.getElementById('recipient');

    if (type === 'private') {
        label.textContent = 'Para (Usuario):';
        input.placeholder = 'Nombre del usuario';
    } else {
        label.textContent = 'Para (Grupo):';
        input.placeholder = 'Nombre del grupo';
    }
});

// Cambiar etiquetas en historial
function toggleHistoryInput() {
    const type = document.getElementById('historyType').value;
    const label = document.getElementById('historyLabel');
    const input = document.getElementById('historyInput');

    if (type === 'private') {
        label.textContent = 'Usuario:';
        input.placeholder = 'Nombre del usuario';
    } else {
        label.textContent = 'Grupo:';
        input.placeholder = 'Nombre del grupo';
    }
}

// Enviar mensaje
async function sendMessage(e) {
    const type = document.getElementById('messageType').value;
    const recipient = document.getElementById('recipient').value;
    const message = document.getElementById('messageText').value;
    const statusDiv = document.getElementById('chatStatus');

    if (!recipient || !message) {
        showStatus('Por favor completa todos los campos', 'error', statusDiv);
        return;
    }

    try {
        const endpoint = type === 'private' ? '/api/messages/private' : '/api/messages/group';
        const body = type === 'private' ?
            { to: recipient, message } :
            { group: recipient, message };

        const response = await fetch(PROXY_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (result.success) {
            showStatus(result.message, 'success', statusDiv);
            document.getElementById('messageText').value = '';
        } else {
            showStatus('Error: ' + (result.error || 'No se pudo enviar'), 'error', statusDiv);
        }
    } catch (error) {
        showStatus('Error de conexión: ' + error.message, 'error', statusDiv);
    }
}

// Crear grupo
async function createGroup() {
    const groupName = document.getElementById('groupName').value;
    const groupMembers = document.getElementById('groupMembers').value;

    const statusDiv = document.getElementById('groupStatus');

    if (!groupName) {
        showStatus('Por favor ingresa un nombre para el grupo', 'error', statusDiv);
        return;
    }

    if (!groupMembers) {
        showStatus('Por favor ingresa un usarios para el grupo', 'error', statusDiv);
        return;
    }

    try {
        const response = await fetch(PROXY_URL + '/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: groupName, members: groupMembers })
        });

        const result = await response.json();

        showStatus(result.success ? (result.message || 'Operación realizada') : ('Error: ' + result.error), result.success ? 'success' : 'error', statusDiv);
    } catch (error) {
        showStatus('Error de conexión: ' + error.message, 'error', statusDiv);
    }
}

// Cargar historial
async function loadHistory() {
    const type = document.getElementById('historyType').value;
    const input = document.getElementById('historyInput').value;
    const container = document.getElementById('historyContainer');

    if (!input) {
        container.innerHTML = '<div class="status error">Por favor ingresa un nombre</div>';
        return;
    }

    try {
        const endpoint = type === 'private' ? '/api/history/private' : '/api/history/group';
        const param = type === 'private' ? 'user' : 'group';

        const response = await fetch(`${PROXY_URL}${endpoint}?${param}=${encodeURIComponent(input)}`);
        const result = await response.json();

        if (!result.success) {
            container.innerHTML = `<div class="status error">${result.error || 'Historial no disponible via RPC'}</div>`;
            return;
        }

        if (result.history && result.history.length > 0) {
            let html = '<h3>Historial:</h3>';
            result.history.forEach(item => {
                const isAudio = item.includes('[AUDIO:');
                html += `<div class="message ${isAudio ? 'audio' : ''}">${item}</div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="status">No hay historial disponible</div>';
        }
    } catch (error) {
        container.innerHTML = `<div class="status error">Error: ${error.message}</div>`;
    }
}

// Cargar usuarios conectados
async function loadOnlineUsers() {
    const container = document.getElementById('usersContainer');

    try {
        const response = await fetch(PROXY_URL + '/api/users/online');
        const result = await response.json();

        if (result.success && Array.isArray(result.users) && result.users.length > 0) {
            const html = result.users.map(user => `<div class="user-card">${user}</div>`).join('');
            container.innerHTML = html || '<div class="status">No hay usuarios conectados</div>';
        } else {
            container.innerHTML = '<div class="status">No hay usuarios conectados</div>';
        }
    } catch (error) {
        container.innerHTML = `<div class="status error">Error: ${error.message}</div>`;
    }
}

// Miembros de grupo
async function loadGroupMembers() {
    const group = document.getElementById('groupName').value;
    const statusDiv = document.getElementById('groupStatus');
    if (!group) {
        showStatus('Ingresa un grupo para ver sus miembros', 'error', statusDiv);
        return;
    }

    try {
        const response = await fetch(`${PROXY_URL}/api/groups/${encodeURIComponent(group)}/members`);
        const result = await response.json();
        if (result.success) {
            const members = result.members || [];
            showStatus(`Miembros (${members.length}): ${members.join(', ') || 'Ninguno'}`, 'success', statusDiv);
        } else {
            showStatus('Error: ' + (result.error || 'No se pudo obtener miembros'), 'error', statusDiv);
        }
    } catch (error) {
        showStatus('Error de conexión: ' + error.message, 'error', statusDiv);
    }
}

// Llamadas RPC
async function startCall() {
    const to = document.getElementById('callTo').value;
    const statusDiv = document.getElementById('callStatus');
    if (!to) {
        showStatus('Ingresa un usuario destino', 'error', statusDiv);
        return;
    }
    try {
        const response = await fetch(`${PROXY_URL}/api/calls/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to })
        });
        const result = await response.json();
        if (result.success) {
            showStatus(result.message || 'Llamada iniciada', 'success', statusDiv);
        } else {
            showStatus('Error: ' + (result.error || 'No se pudo iniciar'), 'error', statusDiv);
        }
    } catch (error) {
        showStatus('Error de conexión: ' + error.message, 'error', statusDiv);
    }
}

async function endCall() {
    const user = document.getElementById('callUser').value;
    const statusDiv = document.getElementById('callStatus');
    try {
        const response = await fetch(`${PROXY_URL}/api/calls/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        const result = await response.json();
        if (result.success) {
            showStatus(result.message || 'Llamada terminada', 'success', statusDiv);
        } else {
            showStatus('Error: ' + (result.error || 'No se pudo terminar'), 'error', statusDiv);
        }
    } catch (error) {
        showStatus('Error de conexión: ' + error.message, 'error', statusDiv);
    }
}

// Mostrar estado
function showStatus(message, type, container) {
    container.innerHTML = `<div class="status ${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}
// Agregar event listeners para navegación
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav button').forEach(button => {
        button.addEventListener('click', function (evt) {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId, evt);
        });
    });


});

window.loadOnlineUsers = loadOnlineUsers;
window.loadHistory = loadHistory;
window.showSection = showSection;
window.sendMessage = sendMessage;
window.createGroup = createGroup;
window.toggleHistoryInput = toggleHistoryInput;
window.loadGroupMembers = loadGroupMembers;
window.startCall = startCall;
window.endCall = endCall;

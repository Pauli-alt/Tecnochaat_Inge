import express from 'express';
import cors from 'cors';
import IceClient from './IceClient.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);
const ICE_HOST = process.env.ICE_HOST || 'localhost';
const ICE_PORT = parseInt(process.env.ICE_PORT || '10000', 10);

app.use(cors());
app.use(express.json());

// Cliente Ice persistente
const iceClient = new IceClient({ host: ICE_HOST, port: ICE_PORT });
iceClient.connect().then(() => {
    console.log('Cliente Ice conectado y listo');
}).catch(err => {
    console.error('Error conectando cliente Ice:', err);
});


// ENDPOINTS TECNOCHAT


// 1. OBTENER USUARIOS EN LÍNEA
app.get('/api/users/online', async (req, res) => {
    try {
        console.log(' Obteniendo usuarios en línea...');
        const users = await iceClient.getOnlineUsers();

        console.log(' Usuarios encontrados:', users.length);

        res.json({
            success: true,
            users: users,
            count: users.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error en /api/users/online:', error);
        res.json({
            success: true,
            users: [],
            count: 0,
            error: error.message
        });
    }
});

// 2. ENVIAR MENSAJE PRIVADO
app.post('/api/messages/private', async (req, res) => {
    try {
        const { to, message } = req.body;

        // Valida los datos
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: to y message'
            });
        }

        console.log(' ENVIANDO MENSAJE PRIVADO:');
        console.log('   De: WebCliente');
        console.log('   Para:', to);
        console.log('   Mensaje:', message);
        console.log('   Timestamp:', new Date().toLocaleString());

        await iceClient.sendMessage('WebCliente', to, message);

        console.log(' Mensaje privado enviado exitosamente');

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            to: to,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error enviando mensaje privado:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'No se pudo enviar el mensaje al servidor'
        });
    }
});

// 3. ENVIAR MENSAJE A GRUPO
app.post('/api/messages/group', async (req, res) => {
    try {
        const { group, message } = req.body;
        console.log(req.body)
        
        if (!group || !message) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: group y message'
            });
        }

        console.log(' ENVIANDO MENSAJE A GRUPO:');
        console.log('   De: WebCliente');
        console.log('   Grupo:', group);
        console.log('   Mensaje:', message);
        console.log('   Timestamp:', new Date().toLocaleString());

        await iceClient.sendGroupMessage('WebCliente', group, message);

        console.log(' Mensaje grupal enviado exitosamente');

        res.json({
            success: true,
            message: 'Mensaje enviado al grupo correctamente',
            group: group,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error enviando mensaje grupal:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'No se pudo enviar el mensaje al grupo'
        });
    }
});

// 4. INICIAR LLAMADA (RPC)
app.post('/api/calls/start', async (req, res) => {
    try {
        const { to, from } = req.body;
        const caller = from || 'WebCliente';

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros requeridos: to'
            });
        }

        console.log(' INICIANDO LLAMADA (Ice):', caller, '->', to);
        await iceClient.startCall(caller, to);

        res.json({
            success: true,
            message: 'Llamada iniciada via RPC',
            to,
            from: caller,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error iniciando llamada:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'No se pudo iniciar la llamada via Ice'
        });
    }
});

// 5. TERMINAR LLAMADA (RPC)
app.post('/api/calls/end', async (req, res) => {
    try {
        const { user } = req.body;
        const target = user || 'WebCliente';

        console.log(' TERMINANDO LLAMADA (Ice) para:', target);
        await iceClient.endCall(target);

        res.json({
            success: true,
            message: 'Llamada terminada via RPC',
            user: target,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error terminando llamada:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'No se pudo terminar la llamada via Ice'
        });
    }
});

// 6. CREAR GRUPO (no soportado aún en Ice)
app.post('/api/groups', async (req, res) => {
    try {
        
        const { name, members } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'El nombre del grupo es requerido'
            });
        }
        console.log({ name, members})
        if (!members || (Array.isArray(members) && members.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'Debe especificar al menos un miembro para el grupo'
            });
        }

        console.log(' CREANDO GRUPO:');
        console.log('   Nombre:', name);
        console.log('   Creador: WebCliente');
        console.log('   Miembros:', members);
        console.log('   Timestamp:', new Date().toLocaleString());

        const result = await iceClient.createGroup(name, members);
        if (result) {
            console.log(' Grupo creado via Ice');
            res.json({
                success: true,
                message: 'Grupo creado correctamente via RPC',
                groupName: name,
                members: Array.isArray(members) ? members : members.split(',').map(m => m.trim()),
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'No se pudo crear el grupo via RPC'
            });
        }
    } catch (error) {
        console.error(' Error creando grupo:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'No se pudo crear el grupo'
        });
    }
});

// 7. OBTENER MIEMBROS DE GRUPO (RPC)
app.get('/api/groups/:group/members', async (req, res) => {
    try {
        const group = req.params.group;

        if (!group) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro group es requerido'
            });
        }

        console.log(' OBTENIENDO MIEMBROS DE GRUPO (Ice):', group);
        const members = await iceClient.getGroupMembers(group);

        res.json({
            success: true,
            group,
            members,
            count: members.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error obteniendo miembros de grupo:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            members: [],
            details: 'No se pudieron obtener los miembros del grupo'
        });
    }
});

// 8. enpoint para obtenr historial de los chats privados 
app.get('/api/history/private', async (req, res) => {
    try {
        const { user } = req.query;

        
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro user es requerido'
            });
        }

        console.log(' OBTENIENDO HISTORIAL PRIVADO:');
        console.log('   Usuario actual: WebCliente');
        console.log('   Usuario consulta:', user);
        console.log('   Timestamp:', new Date().toLocaleString());

        const history = await iceClient.getPrivateHistory('WebCliente', user);

        res.json({
            success: true,
            user: user,
            history: history,
            count: history.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error obteniendo historial privado:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            history: [],
            details: 'No se pudo obtener el historial'
        });
    }
});

// 9. Historial del grupo
app.get('/api/history/group', async (req, res) => {
    try {
        const { group } = req.query;

        
        if (!group) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro group es requerido'
            });
        }

        console.log(' OBTENIENDO HISTORIAL DE GRUPO:');
        console.log('   Grupo:', group);
        console.log('   Timestamp:', new Date().toLocaleString());

        const history = await iceClient.getGroupHistory(group);

        res.json({
            success: true,
            group: group,
            history: history,
            count: history.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(' Error obteniendo historial de grupo:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            history: [],
            details: 'No se pudo obtener el historial del grupo'
        });
    }
});

// 7. ENDPOINT (Health Check)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        ice: {
            connected: iceClient.connected,
            host: ICE_HOST,
            port: ICE_PORT
        },
        timestamp: new Date().toISOString()
    });
});

// 8. Este es el manejo de errores global 
app.use((err, req, res, next) => {
    console.error(' Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Proxy HTTP mejorado corriendo en http://localhost:${PORT}`);
    console.log(`Conectando via Ice al servidor Java en ${ICE_HOST}:${ICE_PORT}`);
});

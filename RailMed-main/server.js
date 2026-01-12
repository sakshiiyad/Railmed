const { PeerServer } = require('peer');
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

const app = express();
const client = new OAuth2Client('1022558921661-p3703amn4sp7vct9rjgv5bkalbba0g7e.apps.googleusercontent.com'); // Replace with your Google Client ID

// Enable CORS
app.use(cors());
app.use(express.json());

// Verify Google token
async function verifyGoogleToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '1022558921661-p3703amn4sp7vct9rjgv5bkalbba0g7e.apps.googleusercontent.com' // Replace with your Google Client ID
        });
        return ticket.getPayload();
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

// Create PeerServer with authentication
const peerServer = PeerServer({
    port: 9000,
    path: '/myapp',
    corsOptions: {
        origin: ['http://localhost:3000', 'http://localhost'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    async authorize(req) {
        try {
            const token = req.query.token;
            if (!token) {
                throw new Error('No token provided');
            }
            
            const payload = await verifyGoogleToken(token);
            if (!payload) {
                throw new Error('Invalid token');
            }

            return true;
        } catch (error) {
            console.error('Authorization failed:', error);
            return false;
        }
    }
});

// Event handlers
peerServer.on('connection', (client) => {
    console.log('Client connected:', client.id);
});

peerServer.on('disconnect', (client) => {
    console.log('Client disconnected:', client.id);
});

// Serve static files
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log('PeerJS server running on port 9000');
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const http = require('http');
const {
    handleListCommand,
    handleSholatCommand,
    handleResetCommand,
    sendMenu,
} = require('./command');

const SESSION_FILE_PATH = './session.json';

client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    },
    webVersionCache: {
        type: 'remote',
        remotePath:
            'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});
let qrDisplayed = false;

// Function to check and load the saved session
const loadSession = () => {
    if (fs.existsSync(SESSION_FILE_PATH)) {
        const sessionData = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
        return JSON.parse(sessionData);
    }
    return null;
};

client.on('qr', (qr) => {
    console.log('QR code received, scan please');
    qrcode.generate(qr, { small: true });
    qrDisplayed = true;
});

client.on('authenticated', (session) => {
    console.log('Authenticated');

    // Check if the session object is defined before writing it to the file
    if (session) {
        fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
            if (err) {
                console.error('Error saving session:', err);
            } else {
                console.log('Session saved successfully');
            }
        });
    } else {
        console.error('Session is undefined');
    }
});

client.on('ready', () => {
    console.log('Client is ready');
    qrDisplayed = false;
});

client.on('message', async (message) => {
    console.log('New message:', message.body, 'new caption:', message.caption);

    if (message.body === '!ping') {
        await message.reply('pong');
    } else if (message.body.startsWith('.stiker')) {
        if (message.body === '!ping') {
            await message.reply('pong');
        } else if (
            message.type === 'image' ||
            (message.type === 'video' && message.body.startsWith('.sticker'))
        ) {
            if (message.isViewOnce) {
                const mediaData = await client.decryptMedia(message);
                await client.sendMessage(message.from, mediaData, {
                    caption: '!stail',
                });
            } else {
                const media = await message.downloadMedia();
                await client.sendMessage(message.from, media, {
                    caption: '!stail',
                });
            }
        }
    } else if (message.body.startsWith('.list')) {
        await handleListCommand(message);
    } else if (message.body.startsWith('.resetlist')) {
        await handleResetCommand(message);
    } else if (message.body === '.menu' || message.body === '.allmenu') {
        await sendMenu(message);
    }

    // if (message.body === '!ping') {
    //     await message.reply('pong');
    // } else if (message.type === 'image' || message.type === 'video' && message.body.startsWith(".sticker")) {
    //     if (message.isViewOnce) {
    //         const mediaData = await client.decryptMedia(message);
    //         await client.sendMessage(message.from, mediaData, { caption: "!stail" });
    //     } else {
    //         const media = await message.downloadMedia();
    //         await client.sendMessage(message.from, media, { caption: "!stail" });
    //     }
    // }
});

client.on('disconnect', (reason) => {
    console.log('Disconnect whatsapp bot', reason);
});

http.createServer((req, res) => {
    res.write('server running');
    res.end();
}).listen(8080);

// Try to load the saved session
const savedSession = loadSession();

// Initialize the client with the saved session or perform a new authentication
client.initialize(savedSession);

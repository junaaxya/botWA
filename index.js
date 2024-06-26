const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const http = require('http');
const {
    handleListCommand,
    handleSholatCommand,
    handleResetCommand,
    sendMenu,
} = require('./command');

let sessionData = null;

client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'client-one', // This can be any string for client ID
        dataPath: './wwebjs_auth', // Use a writable path, e.g., a directory in your project
    }),
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

client.on('qr', (qr) => {
    console.log('QR code received, scan please');
    qrcode.generate(qr, { small: true });
    qrDisplayed = true;
});

client.on('authenticated', (session) => {
    console.log('Authenticated');
    sessionData = session; // Store session data in memory
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
});

client.on('disconnect', (reason) => {
    console.log('Disconnect whatsapp bot', reason);
});

http.createServer((req, res) => {
    res.write('server running');
    res.end();
}).listen(8080);

client.initialize();

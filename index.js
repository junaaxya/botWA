const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const http = require('http');
const puppeteer = require('puppeteer');
const path = require('path');
const {
    handleListCommand,
    handleResetCommand,
    sendMenu,
} = require('./command');

const SESSION_DIR = path.join('/tmp', 'wwebjs_auth'); // Menggunakan /tmp

if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Fungsi untuk memulai klien
async function startClient() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-gpu'],
        headless: true,
    });

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'client-one', // Client ID bisa berupa string apa saja
            dataPath: SESSION_DIR, // Menentukan direktori yang dapat ditulis
        }),
        puppeteer: {
            browserWSEndpoint: browser.wsEndpoint(),
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
    });

    client.on('qr', (qr) => {
        console.log('QR code received, scan please');
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', async (session) => {
        console.log('Authenticated');
    });

    client.on('ready', () => {
        console.log('Client is ready');
    });

    client.on('message', async (message) => {
        console.log('New message:', message.body, 'new caption:', message.caption);

        try {
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
                        await client.sendMessage(message.from, mediaData, { caption: '!stail' });
                    } else {
                        const media = await message.downloadMedia();
                        await client.sendMessage(message.from, media, { caption: '!stail' });
                    }
                }
            } else if (message.body.startsWith('.list')) {
                await handleListCommand(message);
            } else if (message.body.startsWith('.resetlist')) {
                await handleResetCommand(message);
            } else if (message.body === '.menu' || message.body === '.allmenu') {
                await sendMenu(message);
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    client.on('disconnect', (reason) => {
        console.log('Disconnect whatsapp bot', reason);
    });

    http.createServer((req, res) => {
        res.write('server running');
        res.end();
    }).listen(8080);

    try {
        await client.initialize();
    } catch (err) {
        console.error('Error initializing client:', err);
    }
}

startClient();

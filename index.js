const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const http = require('http');
const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const {
    handleListCommand,
    handleSholatCommand,
    handleResetCommand,
    sendMenu,
} = require('./command');

// Ensure the directory for storing session exists
const SESSION_DIR = path.join(__dirname, 'wwebjs_auth');

if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

const startClient = async () => {
    const browser = await puppeteer.launch({
        args: [...chrome.args, '--no-sandbox', '--disable-gpu'],
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'client-one', // Client ID can be any string
            dataPath: SESSION_DIR,  // Specify the writable directory
        }),
        puppeteer: {
            browserWSEndpoint: browser.wsEndpoint(),
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
    });

    client.on('ready', () => {
        console.log('Client is ready');
        qrDisplayed = false;
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
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    client.on('disconnect', (reason) => {
        console.log('WhatsApp bot disconnected', reason);
    });

    http.createServer((req, res) => {
        res.write('server running');
        res.end();
    }).listen(8080);

    try {
        client.initialize();
    } catch (err) {
        console.error('Error initializing client:', err);
    }
};

startClient();

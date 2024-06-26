const { format } = require('date-fns');
const { isSameDay } = require('date-fns/isSameDay');
const { id } = require('date-fns/locale');
// const handleStickerCommand = async (client, message) => {

// };

const handleListTilawahCommand = async (message) => {
    await message.reply(`test`);
};

// Menyimpan daftar nama dalam memori
let tilawahList = [];
let lastUpdate = new Date();

// Fungsi untuk menangani perintah .list
const handleListCommand = async (message) => {
    const parts = message.body.split(' ');
    console.log(tilawahList);
    if (parts.length < 2) {
        await message.reply('Silakan masukkan nama setelah perintah .list');
        return;
    }
    const name = parts[1];

    const newToday = new Date();
    if (!isSameDay(newToday, lastUpdate)) {
        tilawahList = [];
        lastUpdate = newToday;
    }
    // Memeriksa apakah nama sudah ada dalam daftar
    if (
        tilawahList.find(
            (item) => item.name.toLowerCase() === name.toLowerCase()
        )
    ) {
        await message.reply(`${name} sudah ada dalam daftar.`);
        return;
    }

    // Menambahkan nama ke dalam daftar
    tilawahList.push({ name, status: '✅' });

    // Mendapatkan tanggal real-time dengan format bahasa Indonesia
    const today = new Date();
    const formattedDate = format(today, 'eeee, dd MMMM yyyy', { locale: id });

    // Membuat pesan daftar
    let listMessage = `List Tilawah ${formattedDate}📝\n\n`;
    tilawahList.forEach((item, index) => {
        listMessage += `${index + 1}. ${item.name} ${item.status}\n`;
        console.log({ item });
    
    });

    // Mengirim balasan pesan
    await message.reply(listMessage);
};

const handleResetCommand = async (message) => {
    tilawahList = [];
    lastUpdate = new Date();
    await message.reply('daftar list tilawah sudah di reset broww ');
};

const sendMenu = async (message) => {
    const menu = `
┌───「 Menu 」───
│ ∘ .stail
│ ∘ .list <nama kamu>
│ ∘ .resetlist
└─────────────
    `;
    await message.reply(menu);
};

module.exports = {
    handleResetCommand,
    handleListTilawahCommand,
    handleListCommand,
    sendMenu,
};

require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
var cron = require("node-cron");
const axios = require("axios");
let price = require("crypto-price");
const token = process.env.BOT_TOKEN;
const baseurl = process.env.BASE_URL;
const bot = new TelegramBot(token, {polling: true});
const emailedHeroes = []

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(793210862, 'Bot received your message');
});


async function findCheapestHero() {
  try {
    const response = await axios.get(baseurl);
    let heroes = response.data.data || [];
    const currentBnbPriceObj = await price.getCryptoPrice("USDT", "BNB");
    const currentBnbPrice = Number(currentBnbPriceObj.price);
    heroes = await Promise.all(
      heroes.map(async (hero) => {
        const heroPriceBybnbPrice = Number(`0.${hero.price}`);
        const heroPriceByUSD = heroPriceBybnbPrice * currentBnbPrice;
        hero.usdPrice = parseFloat(heroPriceByUSD).toFixed(2);
        return hero;
      })
    );
    for (let i = 0; i < heroes.length; i++) {
      const currentHero = heroes[i];
      if (currentHero.usdPrice < 100 && currentHero.battleCap < 100 && !emailedHeroes.includes(currentHero.refId)) {
        emailedHeroes.push(currentHero.refId)
        bot.sendMessage(793210862, `Giá: ${currentHero.usdPrice}, Đã chơi: ${currentHero.battleCap} trận, Link mua: https://marketplace.thetanarena.com/item/${currentHero.refId}`);
      }
    }
  } catch (error) {
    console.error({ error });
  }
}

cron.schedule("*/10 * * * * *", () => {
  findCheapestHero();
});

// bot.telegram.sendMessage(process.env.CHAT_ID, `hello world from bit4you.io`).catch(console.error);
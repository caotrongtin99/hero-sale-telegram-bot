require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
var cron = require("node-cron");
const axios = require("axios");
let price = require("crypto-price");
const token = process.env.BOT_TOKEN;
const baseurl = process.env.BASE_URL;
const bot = new TelegramBot(token, {polling: true});
const emailedHeroes = []
const listContacts = []

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  listContacts.push(chatId)
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Bot received your message');
});


async function findCheapestHero() {
  try {
    const response = await axios.get(baseurl);
    let heroes = response.data.data || [];
    const currentBnbPriceObj = await price.getCryptoPrice("USDT", "BNB");
    const currentBnbPrice = Number(currentBnbPriceObj.price);
    heroes = await Promise.all(
      heroes.map(async (hero) => {
        let heroProfile = await axios.get(`https://data.thetanarena.com/thetan/v1/hero?id=${hero.refId}`)
        heroProfile = heroProfile.data.data;
        hero.heroProfile = heroProfile
        const heroPriceBybnbPrice = Number(`0.${hero.price}`);
        const heroPriceByUSD = heroPriceBybnbPrice * currentBnbPrice;
        hero.usdPrice = parseFloat(heroPriceByUSD).toFixed(2);
        return hero;
      })
    );
    for (let i = 0; i < heroes.length; i++) {
      const currentHero = heroes[i];
      if (Number(currentHero.usdPrice) < 80 && Number(currentHero.heroProfile.heroRanking.battleCapTHC) < 70 && !emailedHeroes.includes(currentHero.refId)) {
        emailedHeroes.push(currentHero.refId)
        for (let j = 0; j < listContacts.length; j++) {
          const contact = listContacts[j];
          const message = `Tên tướng: ${currentHero.heroProfile.heroInfo.name},\n Giá: ${currentHero.usdPrice},\n Đã chơi: ${currentHero.heroProfile.heroRanking.battleCapTHC}/${currentHero.heroProfile.heroRanking.totalBattleCapTHC} trận,\n Link mua: https://marketplace.thetanarena.com/item/${currentHero.refId}`
          bot.sendMessage(contact, message);
        }
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
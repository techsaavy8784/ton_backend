const express = require("express");
const bodyParser = require("body-parser");

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Initialize Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Handler for /start command without parameters
bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const userId = msg.from.id;

  const webAppUrl = `https://eaveai-miniapp.vercel.app/`;

  // Send welcome message
  const welcomeMessage = username
    ? `Hi @${username}!\nWelcome to EAVEAI! 🎉`
    : `Hi there!\nWelcome to EAVEAI! 🎉`;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Open Mini App", web_app: { url: webAppUrl } }],
      ],
    },
  });
});

// Callback query handler
// bot.on("callback_query", (callbackQuery) => {
//   const message = callbackQuery.message;
//   const chatId = message.chat.id;
//   const userId = callbackQuery.from.id;

//   // Acknowledge the callback query first
//   bot.answerCallbackQuery(callbackQuery.id);

//   if (callbackQuery.data === "start_intro") {
//     const webAppUrl = `https://ton-pi.vercel.app/?userId=${userId}`;

//     bot.sendPhoto(
//       chatId,
//       "https://gateway.pinata.cloud/ipfs/QmUCPe2VrtMJtWbL9J1kkoB6cwvVRaQBcZsWeLVgd8uRtz",
//       {
//         caption:
//           "🏁 Rev up your engines and join the ultimate blockchain racing experience! 🚗",
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: "Open Mini App", web_app: { url: webAppUrl } }],
//           ],
//         },
//       }
//     );
//   }
// });

console.log("Bot server started in the polling mode...");

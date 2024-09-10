require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const db = require("../Models");
const schedule = require("node-schedule");

// Initialize Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
bot.setWebHook(`https://ton-back.vercel.app/webhook/telegram`);

const rule = new schedule.RecurrenceRule();
rule.hour = 18;
rule.minute = 0;
rule.tz = "CET";

async function getPhotoUrl(file_id) {
  try {
    const file = await bot.getFile(file_id);
    return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  } catch (error) {
    console.error("Failed to get file:", error);
    return "";
  }
}

async function getFirstName(userId) {
  try {
    const chat = await bot.getChat(userId);
    return chat.first_name;
  } catch (error) {
    console.error("Failed to get First name:", error);
  }
}

async function getUsername(userId) {
  try {
    const chat = await bot.getChat(userId);

    if (!chat.username) {
      return "";
    } else {
      return chat.username;
    }
  } catch (error) {
    console.error("Something happened :", error);
    res.status(500).send({ message: "Internal server error" });
  }
}

const setUsername = async (req, res) => {
  try {
    const users = await db.user.findAll();

    for (let i = 0; i < users.length; i++) {
      const username = await getUsername(
        parseInt(users[i].dataValues.tg_user_id)
      );

      await db.user
        .update(
          { username: username },
          { where: { tg_user_id: users[i].dataValues.tg_user_id } }
        )
        .then((res) => {
          console.log(`success ::::: ${i}`);
        });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Handler for /start command with parameters
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const params = match[1];
  const parts = params.split("-");
  const username = msg.from.username;
  const sponser_userId = parts[1] || "there";
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "";
  const lastName = msg.from.last_name || "";

  // Get user profile photo URL
  let photoUrl = "";
  const photos = await bot.getUserProfilePhotos(userId);
  if (photos.total_count > 0) {
    let file_id = photos.photos[0][0].file_id;
    photoUrl = await getPhotoUrl(file_id);
  }

  const message = username
    ? `Hi @${username}! Thank you for joining with the invite link! 📩 Click start to learn more.`
    : `Hi there! Thank you for joining with the invite link! 📩 Click start to learn more.`;

  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [[{ text: "Start", callback_data: "start_intro" }]],
      resize_keyboard: true,
      one_time_keyboard: true,
      remove_keyboard: true,
      force_reply: true,
    },
  });

  try {
    const user = await db.user.findOne({
      where: { tg_user_id: userId.toString() },
    });

    const sponsor_first_name = await getFirstName(parseInt(userId));

    if (!user) {
      const id = Date.now();
      await db.user.create({
        id,
        tg_user_id: userId.toString(),
        wallet_address: "",
        first_name: firstName,
        last_name: lastName,
        username: username ? username : "",
        photo_url: photoUrl,
        sponsor_userId: sponser_userId,
        is_whitelist: false,
      });
      console.log("New user created with ID:", id);

      const message_text = `Congratulations! ✨✨✨\n\n<a href="tg://user?id=${userId}">@${sponsor_first_name}</a> has accepted your invitation.`;
      bot.sendMessage(sponser_userId, message_text, { parse_mode: "HTML" });
    } else {
      console.log("This user already exists @", user.dataValues.tg_user_id);
      const sponsors = await db.user.findAll({
        where: { sponsor_userId: sponser_userId },
      });

      if (user.dataValues.is_whitelist === false) {
        if (sponsors.length === 1) {
          await db.user.update(
            { is_whitelist: true },
            { where: { tg_user_id: userId.toString() } }
          );
        }
      }

      if (user.dataValues.sponsor_userId === "") {
        await db.user.update(
          { sponsor_userId: sponser_userId.toString() },
          { where: { tg_user_id: userId.toString() } }
        );
        const message_text = `Congratulations! ✨✨✨\n\n<a href="tg://user?id=${userId}">@${sponsor_first_name}</a> has accepted your invitation.`;
        bot.sendMessage(sponser_userId, message_text, { parse_mode: "HTML" });
      } else if (user.dataValues.tg_user_id === sponser_userId) {
        const message_text = `Oops! <a href="tg://user?id=${userId}">@${sponsor_first_name}</a>, \n\nYou can't invite yourself. Please try to invite another user`;
        bot.sendMessage(sponser_userId, message_text, { parse_mode: "HTML" });
      } else {
        const message_text = `Oops! <a href="tg://user?id=${userId}">@${sponsor_first_name}</a> is already invited by someone. \n\nPlease try to invite another user.`;
        bot.sendMessage(sponser_userId, message_text, { parse_mode: "HTML" });
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    bot.sendMessage(
      chatId,
      "Oops! Something went wrong. Please try again later."
    );
  }
});

// Handler for /start command without parameters
bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "";
  const lastName = msg.from.last_name || "";
  const botId = (await bot.getMe()).id;

  // Get user profile photo URL
  let photoUrl = "";
  const photos = await bot.getUserProfilePhotos(userId);
  if (photos.total_count > 0) {
    let file_id = photos.photos[0][0].file_id;
    photoUrl = await getPhotoUrl(file_id);
  }

  try {
    const user = await db.user.findOne({
      where: { tg_user_id: userId.toString() },
    });

    if (!user) {
      const id = Date.now();
      await db.user.create({
        id,
        tg_user_id: userId.toString(),
        wallet_address: "",
        first_name: firstName,
        last_name: lastName,
        username: username ? username : "",
        photo_url: photoUrl,
        sponsor_userId: "",
        is_whitelist: false,
      });
      console.log("New user created with ID:", id);
    } else {
      console.log("This user already exists @", user.dataValues.tg_user_id);
    }
  } catch (error) {
    console.error("Database error:", error);
    bot.sendMessage(
      chatId,
      "Oops! Something went wrong. Please try again later."
    );
  }

  // Send welcome message
  const welcomeMessage = username
    ? `Hi @${username}!\nWelcome to TONCARS! 🎉\nPlease click the button below to travel our TONCARS NFT Racing Game!`
    : `Hi there!\nWelcome to TONCARS! 🎉\nPlease click the button below to travel our TONCARS NFT Racing Game!`;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [[{ text: "Start", callback_data: "start_intro" }]],
      resize_keyboard: true,
      one_time_keyboard: true,
      remove_keyboard: true,
      force_reply: true,
    },
  });
});

// Callback query handler
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;

  // Acknowledge the callback query first
  bot.answerCallbackQuery(callbackQuery.id);

  if (callbackQuery.data === "start_intro") {
    const webAppUrl = `https://ton-pi.vercel.app/?userId=${userId}`;

    bot.sendPhoto(
      chatId,
      "https://gateway.pinata.cloud/ipfs/QmUCPe2VrtMJtWbL9J1kkoB6cwvVRaQBcZsWeLVgd8uRtz",
      {
        caption:
          "🏁 Rev up your engines and join the ultimate blockchain racing experience! 🚗",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Open Mini App", web_app: { url: webAppUrl } }],
          ],
        },
      }
    );
  }
});

console.log("Scheduling job to send messages to all users...");
schedule.scheduleJob(rule, function () {
  sendMessagesToAllUsers();
});

const sendMessagesToAllUsers = async () => {
  try {
    const users = await db.user.findAll({
      attributes: ["tg_user_id"],
      group: ["tg_user_id"],
    });

    const BATCH_SIZE = 30; // Adjust this size according to what you find works best
    const DELAY_BETWEEN_BATCHES = 1500; // Delay in milliseconds (1.5 second)

    console.log(`Found ${users.length} unique users to message.`);
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const currentBatch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(
        currentBatch.map((user) => {
          return bot
            .sendMessage(
              user.dataValues.tg_user_id,
              "🏁 Shift into gear with TONCARS! Invite your friends to get more coins. 🚗 Don't miss the race, play today!",
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🎮 Open Mini App",
                        web_app: {
                          url: `https://ton-pi.vercel.app/?userId=${user.tg_user_id}`,
                        },
                      },
                    ],
                  ],
                },
              }
            )
            .catch((error) => {
              console.error(
                `Failed to send message to ${user.dataValues.tg_user_id}: ${error}`
              );
            });
        })
      );

      if (i + BATCH_SIZE < users.length) {
        console.log(
          `Waiting ${DELAY_BETWEEN_BATCHES}ms before sending next batch...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }
  } catch (error) {
    console.log("Something went wrong.", error);
  }
};

console.log("Bot server started in the polling mode...");

module.exports = {
  getUsername,
  setUsername,
};

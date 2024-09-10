const { Op, where } = require("sequelize");
const db = require("../Models");

const getAllUserCount = async (req, res) => {
  try {
    const result = await db.user.findAndCountAll();

    res.status(200).json(result.count);
  } catch (error) {
    console.log("Error occurred:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};

const addWalletAddress = async (req, res) => {
  const { userId, walletAddress } = req.body;

  try {
    // Check if user exists by userId only
    const user = await db.user.findOne({
      where: { tg_user_id: userId },
    });

    if (user) {
      // If user exists, update the wallet address
      await db.user.update(
        { wallet_address: walletAddress },
        { where: { tg_user_id: userId } }
      );
      // Fetch and return the updated user
      const updatedUser = await db.user.findOne({
        where: { tg_user_id: userId },
      });
      res.status(200).json(updatedUser);
    } else {
      // Handle case where no user is found
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.log("Error occurred:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};

const getInviteFriendList = async (req, res) => {
  const userId = req.params.userId;

  try {
    const users = await db.user.findAll({
      where: { sponsor_userId: userId },
    });

    const friendsPromises = users.map(async (item) => {
      const result = await db.user.findAndCountAll({
        where: { sponsor_userId: item.tg_user_id },
      });
      return {
        tg_user_id: item.tg_user_id,
        is_whitelist: item.is_whitelist,
        photo_url: item.photo_url,
        first_name: item.first_name,
        last_name: item.last_name,
        username: item.username,
        count: result.count,
      };
    });
    let friends = await Promise.all(friendsPromises);

    if (users.length === 0) {
      return res
        .status(404)
        .send({ message: "No friends found for the user." });
    }

    // Sort friends array by count in descending order
    friends = friends.sort((a, b) => b.count - a.count);

    res.status(200).json(friends);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

const setWhiteListByID = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await db.user.findOne({
      where: { tg_user_id: userId },
    });

    if (user) {
      await db.user.update(
        { is_whitelist: true },
        { where: { tg_user_id: userId } }
      );

      res.status(200).json({
        tg_user_id: userId,
        is_whitelist: true,
      });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

const getTopRankings = async (req, res) => {
  try {
    const sponsors = await db.user.findAll({
      attributes: [
        "sponsor_userId",
        [
          db.sequelize.fn("COUNT", db.sequelize.col("sponsor_userId")),
          "numberOfSponsees",
        ],
      ],
      where: {
        sponsor_userId: {
          [Op.not]: "", // Not an empty string
          [Op.ne]: null, // Not null
          [Op.ne]: "null", // Not the string "null"
        },
      },
      group: ["sponsor_userId"],
      order: [["numberOfSponsees", "desc"]],
      // limit: 101,
      raw: true,
    });

    const topRanking = sponsors.map(async (item) => {
      // console.log(item.sponsor_userId);
      const result = await db.user.findOne({
        where: { tg_user_id: item.sponsor_userId.toString() },
      });

      return {
        tg_user_id: result.dataValues.tg_user_id,
        first_name: result.dataValues.first_name,
        last_name: result.dataValues.last_name,
        username: result.dataValues.username,
        count: item.numberOfSponsees,
      };
    });
    let friends = await Promise.all(topRanking);

    res.status(200).json(friends);
  } catch (error) {
    console.error("Failed to fetch top users:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  addWalletAddress,
  getInviteFriendList,
  setWhiteListByID,
  getAllUserCount,
  getTopRankings,
};

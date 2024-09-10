module.exports = (sequelize, Sequelize) => {
  const Users = sequelize.define("users", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    tg_user_id: {
      type: Sequelize.STRING,
    },
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    wallet_address: {
      type: Sequelize.STRING,
    },
    photo_url: {
      type: Sequelize.STRING,
    },
    username: {
      type: Sequelize.STRING,
    },
    sponsor_userId: {
      type: Sequelize.STRING,
    },
    is_whitelist: {
      type: Sequelize.BOOLEAN,
    },
  });

  return Users;
};

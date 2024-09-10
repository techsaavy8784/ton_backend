const dbConfig = require("../db-config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.connectionString, {
  dialect: dbConfig.dialect,
  dialectModule: dbConfig.dialectModule,
  pool: dbConfig.pool,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Necessary for self-signed certificates if applicable
    },
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model")(sequelize, Sequelize);

module.exports = db;

require('dotenv').config();
const pg = require('pg');

module.exports = {
  HOST: process.env.POSTGRES_HOST || "localhost",
  USER: process.env.POSTGRES_USER || "postgres",
  PASSWORD: process.env.POSTGRES_PASSWORD || "lotus",
  DB: process.env.POSTGRES_DATABASE || "toncars",
  dialect: "postgres",
  dialectModule: pg,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Optional: Use a full connection string if available
  connectionString: process.env.POSTGRES_URL || `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}?sslmode=require`
};

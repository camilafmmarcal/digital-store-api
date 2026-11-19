
require("dotenv").config({ quiet: true });

const { Sequelize } = require("sequelize");

const environment = process.env.NODE_ENV || "development";

const databaseName =
  environment === "test"
    ? process.env.DB_TEST_NAME
    : process.env.DB_NAME;

if (environment === "test") {
  if (!databaseName) {
    throw new Error(
      "Configure DB_TEST_NAME para executar os testes."
    );
  }

  if (databaseName === process.env.DB_NAME) {
    throw new Error(
      "O banco de testes deve ser diferente do banco principal."
    );
  }
}

const sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false
  }
);

module.exports = sequelize;

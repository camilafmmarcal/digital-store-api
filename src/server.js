
require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const PORT = Number(process.env.PORT || 3000);

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres");
    }

    await sequelize.authenticate();

    console.log("MySQL conectado com sucesso!");

    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar API:", error.message);
    process.exitCode = 1;
  }
}

start();

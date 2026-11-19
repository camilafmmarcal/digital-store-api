
const sequelize = require("./database");

async function testarConexao() {
  try {
    await sequelize.authenticate();

    console.log("Conexão com MySQL realizada com sucesso!");
    console.log("Banco de dados: digital_store");
  } catch (error) {
    console.error("Erro ao conectar ao MySQL:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

testarConexao();

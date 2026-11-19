
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Store API",
      version: "1.0.0",
      description:
        "API REST de e-commerce desenvolvida com Node.js, Express, Sequelize, MySQL e JWT."
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    tags: [
      { name: "Usuários", description: "Cadastro e autenticação" },
      { name: "Categorias", description: "Gerenciamento de categorias" },
      { name: "Produtos", description: "Gerenciamento de produtos" }
    ]
  },

  apis: [
    path.resolve(__dirname, "../docs/swagger.yaml")
  ]
};

module.exports = swaggerJsdoc(options);


const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");

const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// Cabeçalhos de segurança
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Origens autorizadas para o frontend
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Limita o tamanho do corpo JSON
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Digital Store API funcionando!"
  });
});

// Documentação Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Especificação OpenAPI em JSON
app.get("/api-docs.json", (req, res) => {
  return res.status(200).json(swaggerSpec);
});

// Rotas da API
app.use("/v1/user", userRoutes);
app.use("/v1/category", categoryRoutes);
app.use("/v1/product", productRoutes);

// Rota inexistente
app.use((req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada"
  });
});

module.exports = app;

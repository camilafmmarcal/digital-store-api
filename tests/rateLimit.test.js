
const request = require("supertest");
const express = require("express");

const loginLimiter = require("../src/middleware/loginLimiter");

describe("Segurança - Rate Limiting", () => {
  test("deve retornar HTTP 429 após 10 tentativas", async () => {
    const app = express();

    app.set("trust proxy", false);

    // Ativa o middleware mesmo no ambiente de testes
    const limiter = loginLimiter.createLoginLimiter();

    app.post("/login", limiter, (req, res) => {
      res.status(401).json({
        error: "Credenciais inválidas"
      });
    });

    const responses = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app).post("/login");
      responses.push(response.status);
    }

    expect(responses.slice(0, 10)).toEqual(
      Array(10).fill(401)
    );

    expect(responses[10]).toBe(429);
  });
});

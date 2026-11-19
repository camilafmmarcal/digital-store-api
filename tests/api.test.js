
const request = require("supertest");
const app = require("../src/app");
const sequelize = require("../src/config/database");

afterAll(async () => {
  await sequelize.close();
});

describe("Digital Store API", () => {
  test("GET / deve retornar HTTP 200", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  test("GET /v1/category/search deve retornar HTTP 200", async () => {
    const response = await request(app)
      .get("/v1/category/search");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("GET /v1/product/search deve retornar HTTP 200", async () => {
    const response = await request(app)
      .get("/v1/product/search");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("GET /v1/product/999999 deve retornar HTTP 404", async () => {
    const response = await request(app)
      .get("/v1/product/999999");

    expect(response.status).toBe(404);
  });

  test("POST /v1/product sem token deve retornar HTTP 401", async () => {
    const response = await request(app)
      .post("/v1/product")
      .send({
        name: "Produto Teste",
        slug: "produto-teste",
        price: 100,
        price_with_discount: 90
      });

    expect(response.status).toBe(401);
  });

  test("GET em rota inexistente deve retornar HTTP 404", async () => {
    const response = await request(app)
      .get("/rota-inexistente");

    expect(response.status).toBe(404);
  });
});

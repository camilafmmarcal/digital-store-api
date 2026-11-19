
const request = require("supertest");
const app = require("../src/app");
const sequelize = require("../src/config/database");
const { User, Category, Product } = require("../src/models");

jest.setTimeout(20000);

const api = request(app);

const unique = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

let userId;
let token;
let categoryId;
let productId;

beforeAll(async () => {
  const database = sequelize.getDatabaseName();

  if (
    process.env.NODE_ENV !== "test" ||
    database !== "digital_store_test" ||
    database === process.env.DB_NAME
  ) {
    throw new Error(
      "SEGURANÇA: os testes exigem o banco digital_store_test."
    );
  }

  await sequelize.authenticate();
});

afterAll(async () => {
  // Remove somente os registros criados por esta suíte.
  // A ordem respeita os relacionamentos entre as tabelas.
  try {
    if (productId) {
      await Product.destroy({ where: { id: productId } });
    }

    if (categoryId) {
      await Category.destroy({ where: { id: categoryId } });
    }

    if (userId) {
      await User.destroy({ where: { id: userId } });
    }
  } finally {
    await sequelize.close();
  }
});

describe("CRUD e autenticação - Digital Store API", () => {
  describe("Usuários e JWT", () => {
    test("01 - Deve cadastrar um usuário", async () => {
      const response = await api
        .post("/v1/user")
        .send({
          firstname: "Usuario",
          surname: "Automatizado",
          email: `teste-${unique()}@example.com`,
          password: "SenhaTeste123!"
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).not.toHaveProperty("password");

      userId = response.body.id;

      global.testUserEmail = response.body.email;
    });

    test("02 - Deve autenticar e retornar JWT", async () => {
      const response = await api
        .post("/v1/user/token")
        .send({
          email: global.testUserEmail,
          password: "SenhaTeste123!"
        });

      expect(response.status).toBe(200);

      const jwt =
        response.body.token ||
        response.body.access_token ||
        response.body.accessToken;

      expect(typeof jwt).toBe("string");
      expect(jwt.length).toBeGreaterThan(10);

      token = jwt;
    });

    test("03 - Deve rejeitar login com senha incorreta", async () => {
      const response = await api
        .post("/v1/user/token")
        .send({
          email: global.testUserEmail,
          password: "SenhaIncorreta123!"
        });

      expect(response.status).toBe(401);
    });

    test("04 - Deve consultar o próprio usuário", async () => {
      const response = await api
        .get(`/v1/user/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body).not.toHaveProperty("password");
    });

    test("05 - Deve atualizar o próprio usuário", async () => {
      const response = await api
        .put(`/v1/user/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstname: "Usuario Atualizado"
        });

      expect(response.status).toBe(200);
      expect(response.body.firstname).toBe("Usuario Atualizado");
    });
  });

  describe("Categorias", () => {
    test("06 - Deve cadastrar uma categoria", async () => {
      const response = await api
        .post("/v1/category")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Categoria Automatizada",
          slug: `categoria-${unique()}`,
          use_in_menu: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");

      categoryId = response.body.id;
    });

    test("07 - Deve consultar a categoria criada", async () => {
      const response = await api.get(
        `/v1/category/${categoryId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(categoryId);
    });

    test("08 - Deve atualizar a categoria", async () => {
      const response = await api
        .put(`/v1/category/${categoryId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Categoria Atualizada",
          use_in_menu: false
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Categoria Atualizada");
      expect(response.body.use_in_menu).toBe(false);
    });

    test("09 - Deve rejeitar categoria inválida", async () => {
      const response = await api
        .post("/v1/category")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "",
          slug: "",
          use_in_menu: "sim"
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Produtos", () => {
    test("10 - Deve cadastrar produto com relacionamentos", async () => {
      const response = await api
        .post("/v1/product")
        .set("Authorization", `Bearer ${token}`)
        .send({
          enabled: true,
          name: "Produto Automatizado",
          slug: `produto-${unique()}`,
          stock: 10,
          description: "Produto criado por teste automatizado",
          price: 199.90,
          price_with_discount: 149.90,
          category_ids: [categoryId],
          images: [
            {
              enabled: true,
              path: "https://example.com/produto.jpg"
            }
          ],
          options: [
            {
              title: "Tamanho",
              shape: "square",
              radius: 0,
              type: "text",
              values: ["P", "M", "G"]
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");

      productId = response.body.id;

      expect(response.body.categories).toHaveLength(1);
      expect(response.body.images).toHaveLength(1);
      expect(response.body.options).toHaveLength(1);
    });

    test("11 - Deve consultar o produto criado", async () => {
      const response = await api.get(
        `/v1/product/${productId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
      expect(response.body.name).toBe("Produto Automatizado");
    });

    test("12 - Deve atualizar o produto", async () => {
      const response = await api
        .put(`/v1/product/${productId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Produto Atualizado",
          stock: 25,
          price: 189.90,
          price_with_discount: 139.90
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Produto Atualizado");
      expect(response.body.stock).toBe(25);
    });

    test("13 - Deve rejeitar preço inválido", async () => {
      const response = await api
        .post("/v1/product")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Produto Inválido",
          slug: `invalido-${unique()}`,
          price: 100,
          price_with_discount: 200
        });

      expect(response.status).toBe(400);
    });

    test("14 - Deve excluir o produto", async () => {
      const response = await api
        .delete(`/v1/product/${productId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const check = await api.get(
        `/v1/product/${productId}`
      );

      expect(check.status).toBe(404);

      productId = null;
    });
  });

  describe("Exclusão de categoria e usuário", () => {
    test("15 - Deve excluir categoria e usuário", async () => {
      const categoryResponse = await api
        .delete(`/v1/category/${categoryId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(categoryResponse.status).toBe(204);
      categoryId = null;

      const userResponse = await api
        .delete(`/v1/user/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(userResponse.status).toBe(204);
      userId = null;
    });
  });
});

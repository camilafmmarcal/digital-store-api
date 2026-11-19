
const {
  Product,
  Category,
  ProductImage,
  ProductOption
} = require("../models");

const sequelize = require("../config/database");
const { Op } = require("sequelize");

const PRODUCT_FIELDS = [
  "enabled",
  "name",
  "slug",
  "stock",
  "description",
  "price",
  "price_with_discount"
];

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0;
}

function pickFields(body) {
  const data = {};

  for (const field of PRODUCT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  if (typeof data.name === "string") {
    data.name = data.name.trim();
  }

  if (typeof data.slug === "string") {
    data.slug = data.slug.trim().toLowerCase();
  }

  return data;
}

function validPrice(value) {
  return (
    (typeof value === "number" || typeof value === "string") &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0 &&
    Math.round(Number(value) * 100) === Number(value) * 100
  );
}

function validateProduct(data, creation = false) {
  if (creation) {
    for (const field of [
      "name",
      "slug",
      "price",
      "price_with_discount"
    ]) {
      if (data[field] === undefined) {
        return `Campo obrigatório: ${field}`;
      }
    }
  }

  if (data.name !== undefined &&
      (typeof data.name !== "string" || !data.name.trim())) {
    return "Nome inválido";
  }

  if (data.slug !== undefined &&
      (typeof data.slug !== "string" || !data.slug.trim())) {
    return "Slug inválido";
  }

  if (data.enabled !== undefined &&
      typeof data.enabled !== "boolean") {
    return "enabled deve ser booleano";
  }

  if (data.stock !== undefined &&
      (!Number.isSafeInteger(data.stock) || data.stock < 0)) {
    return "Estoque inválido";
  }

  if (data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string") {
    return "Descrição inválida";
  }

  for (const field of ["price", "price_with_discount"]) {
    if (data[field] !== undefined && !validPrice(data[field])) {
      return `${field} deve ser um valor monetário válido`;
    }
  }

  return null;
}

function validateRelations(body) {
  if (body.category_ids !== undefined) {
    if (
      !Array.isArray(body.category_ids) ||
      !body.category_ids.every(validId) ||
      new Set(body.category_ids.map(Number)).size !==
        body.category_ids.length
    ) {
      return "category_ids deve conter IDs válidos e únicos";
    }
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      return "images deve ser um array";
    }

    for (const image of body.images) {
      if (
        !image ||
        typeof image !== "object" ||
        Array.isArray(image) ||
        typeof image.path !== "string" ||
        !image.path.trim() ||
        image.path.length > 500 ||
        (image.enabled !== undefined &&
          typeof image.enabled !== "boolean")
      ) {
        return "Imagem inválida";
      }
    }
  }

  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) {
      return "options deve ser um array";
    }

    for (const option of body.options) {
      if (
        !option ||
        typeof option !== "object" ||
        Array.isArray(option) ||
        typeof option.title !== "string" ||
        !option.title.trim() ||
        option.title.length > 100 ||
        !["square", "circle"].includes(option.shape) ||
        !["text", "color"].includes(option.type) ||
        !Array.isArray(option.values) ||
        !option.values.every(
          value => typeof value === "string"
        ) ||
        (option.radius !== undefined &&
          (!Number.isSafeInteger(option.radius) ||
            option.radius < 0))
      ) {
        return "Opção de produto inválida";
      }
    }
  }

  return null;
}

function handleError(error, res) {
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Já existe um registro com esse valor único"
    });
  }

  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeDatabaseError" ||
    error.name === "SequelizeForeignKeyConstraintError"
  ) {
    return res.status(400).json({
      error: "Dados inválidos ou relacionamento inconsistente"
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Erro interno do servidor"
  });
}

async function validateCategories(categoryIds, transaction) {
  if (categoryIds === undefined || categoryIds.length === 0) {
    return true;
  }

  const count = await Category.count({
    where: { id: { [Op.in]: categoryIds } },
    transaction
  });

  return count === categoryIds.length;
}

async function saveRelations(product, body, transaction) {
  if (body.category_ids !== undefined) {
    await product.setCategories(body.category_ids, {
      transaction
    });
  }

  if (body.images !== undefined) {
    await ProductImage.destroy({
      where: { product_id: product.id },
      transaction
    });

    if (body.images.length > 0) {
      await ProductImage.bulkCreate(
        body.images.map(image => ({
          product_id: product.id,
          enabled: image.enabled ?? true,
          path: image.path.trim()
        })),
        { transaction }
      );
    }
  }

  if (body.options !== undefined) {
    await ProductOption.destroy({
      where: { product_id: product.id },
      transaction
    });

    if (body.options.length > 0) {
      await ProductOption.bulkCreate(
        body.options.map(option => ({
          product_id: product.id,
          title: option.title.trim(),
          shape: option.shape,
          radius: option.radius ?? 0,
          type: option.type,
          values: option.values
        })),
        { transaction }
      );
    }
  }
}

async function findCompleteProduct(id, transaction) {
  return Product.findByPk(id, {
    include: [
      {
        association: "images",
        attributes: ["id", "enabled", "path"]
      },
      {
        association: "options",
        attributes: [
          "id", "title", "shape", "radius", "type", "values"
        ]
      },
      {
        association: "categories",
        attributes: ["id", "name", "slug"],
        through: { attributes: [] }
      }
    ],
    transaction
  });
}

class ProductController {
  async index(req, res) {
    try {
      const page = Math.max(
        1, parseInt(req.query.page, 10) || 1
      );

      const limit = Math.min(
        100, Math.max(1, parseInt(req.query.limit, 10) || 10)
      );

      const where = {};

      if (req.query.name) {
        where.name = {
          [Op.like]: `%${req.query.name}%`
        };
      }

      if (req.query.enabled === "true") {
        where.enabled = true;
      } else if (req.query.enabled === "false") {
        where.enabled = false;
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]],
        include: [
          {
            association: "images",
            attributes: ["id", "enabled", "path"]
          },
          {
            association: "options",
            attributes: [
              "id", "title", "shape", "radius", "type", "values"
            ]
          },
          {
            association: "categories",
            attributes: ["id", "name", "slug"],
            through: { attributes: [] }
          }
        ],
        distinct: true
      });

      return res.status(200).json({
        data: rows,
        total: count,
        page,
        limit
      });
    } catch (error) {
      return handleError(error, res);
    }
  }

  async show(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          error: "ID inválido"
        });
      }

      const product = await findCompleteProduct(req.params.id);

      if (!product) {
        return res.status(404).json({
          error: "Produto não encontrado"
        });
      }

      return res.status(200).json(product);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async store(req, res) {
    try {
      const body = req.body || {};
      const data = pickFields(body);

      const error =
        validateProduct(data, true) ||
        validateRelations(body);

      if (error) {
        return res.status(400).json({ error });
      }

      if (
        Number(data.price_with_discount) >
        Number(data.price)
      ) {
        return res.status(400).json({
          error: "Preço com desconto não pode superar o preço"
        });
      }

      const productId = await sequelize.transaction(
        async transaction => {
          const categoriesExist = await validateCategories(
            body.category_ids,
            transaction
          );

          if (!categoriesExist) {
            const err = new Error("Categoria não encontrada");
            err.status = 400;
            throw err;
          }

          const product = await Product.create(
            {
              enabled: true,
              stock: 0,
              ...data
            },
            { transaction }
          );

          await saveRelations(product, body, transaction);

          return product.id;
        }
      );

      const product = await findCompleteProduct(productId);

      return res.status(201).json(product);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({
          error: error.message
        });
      }

      return handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          error: "ID inválido"
        });
      }

      const body = req.body || {};
      const changes = pickFields(body);

      const error =
        validateProduct(changes) ||
        validateRelations(body);

      if (error) {
        return res.status(400).json({ error });
      }

      const hasRelations = [
        "category_ids", "images", "options"
      ].some(key =>
        Object.prototype.hasOwnProperty.call(body, key)
      );

      if (
        Object.keys(changes).length === 0 &&
        !hasRelations
      ) {
        return res.status(400).json({
          error: "Nenhum campo válido informado"
        });
      }

      await sequelize.transaction(async transaction => {
        const product = await Product.findByPk(
          req.params.id,
          { transaction }
        );

        if (!product) {
          const err = new Error("Produto não encontrado");
          err.status = 404;
          throw err;
        }

        const price = changes.price !== undefined
          ? Number(changes.price)
          : Number(product.price);

        const discount =
          changes.price_with_discount !== undefined
            ? Number(changes.price_with_discount)
            : Number(product.price_with_discount);

        if (discount > price) {
          const err = new Error(
            "Preço com desconto não pode superar o preço"
          );
          err.status = 400;
          throw err;
        }

        const categoriesExist = await validateCategories(
          body.category_ids,
          transaction
        );

        if (!categoriesExist) {
          const err = new Error("Categoria não encontrada");
          err.status = 400;
          throw err;
        }

        if (Object.keys(changes).length > 0) {
          await product.update(changes, { transaction });
        }

        await saveRelations(product, body, transaction);
      });

      const product = await findCompleteProduct(req.params.id);

      return res.status(200).json(product);
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          error: error.message
        });
      }

      return handleError(error, res);
    }
  }

  async destroy(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          error: "ID inválido"
        });
      }

      const deleted = await sequelize.transaction(
        async transaction => {
          const product = await Product.findByPk(
            req.params.id,
            { transaction }
          );

          if (!product) {
            return false;
          }

          await product.destroy({ transaction });
          return true;
        }
      );

      if (!deleted) {
        return res.status(404).json({
          error: "Produto não encontrado"
        });
      }

      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
}

module.exports = new ProductController();

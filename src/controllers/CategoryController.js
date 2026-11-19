
const { Category } = require("../models");
const { Op } = require("sequelize");

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0;
}

function handleError(error, res) {
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Já existe uma categoria com esse slug"
    });
  }

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Dados inválidos"
    });
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      error: "Categoria possui vínculos que impedem a operação"
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Erro interno do servidor"
  });
}

class CategoryController {
  async index(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit, 10) || 10)
      );

      const where = {};

      if (req.query.name) {
        where.name = {
          [Op.like]: `%${req.query.name}%`
        };
      }

      const { count, rows } = await Category.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [["id", "ASC"]]
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
        return res.status(400).json({ error: "ID inválido" });
      }

      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({
          error: "Categoria não encontrada"
        });
      }

      return res.status(200).json(category);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async store(req, res) {
    try {
      const { name, slug, use_in_menu = false } = req.body;

      if (
        typeof name !== "string" || !name.trim() ||
        typeof slug !== "string" || !slug.trim() ||
        typeof use_in_menu !== "boolean"
      ) {
        return res.status(400).json({
          error: "Informe nome, slug e use_in_menu válidos"
        });
      }

      const category = await Category.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        use_in_menu
      });

      return res.status(201).json(category);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({
          error: "Categoria não encontrada"
        });
      }

      const { name, slug, use_in_menu } = req.body;
      const changes = {};

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return res.status(400).json({ error: "Nome inválido" });
        }
        changes.name = name.trim();
      }

      if (slug !== undefined) {
        if (typeof slug !== "string" || !slug.trim()) {
          return res.status(400).json({ error: "Slug inválido" });
        }
        changes.slug = slug.trim().toLowerCase();
      }

      if (use_in_menu !== undefined) {
        if (typeof use_in_menu !== "boolean") {
          return res.status(400).json({
            error: "use_in_menu deve ser booleano"
          });
        }
        changes.use_in_menu = use_in_menu;
      }

      if (Object.keys(changes).length === 0) {
        return res.status(400).json({
          error: "Nenhum campo válido informado"
        });
      }

      await category.update(changes);

      return res.status(200).json(category);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async destroy(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({
          error: "Categoria não encontrada"
        });
      }

      await category.destroy();

      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
}

module.exports = new CategoryController();

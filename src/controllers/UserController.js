
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const publicFields = [
  "id",
  "firstname",
  "surname",
  "email",
  "created_at",
  "updated_at"
];

function validEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password) {
  return typeof password === "string" &&
    password.length >= 8;
}

function handleError(error, res) {
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "E-mail já cadastrado"
    });
  }

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Dados inválidos"
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Erro interno do servidor"
  });
}

class UserController {
  async show(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido" });
      }

      if (req.userId !== id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const user = await User.findByPk(id, {
        attributes: publicFields
      });

      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado"
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async store(req, res) {
    try {
      const { firstname, surname, email, password } = req.body;

      if (
        typeof firstname !== "string" || !firstname.trim() ||
        typeof surname !== "string" || !surname.trim() ||
        !validEmail(email) || !validPassword(password)
      ) {
        return res.status(400).json({
          error: "Informe nome, sobrenome, e-mail válido e senha com pelo menos 8 caracteres"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return res.status(400).json({
          error: "E-mail já cadastrado"
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        firstname: firstname.trim(),
        surname: surname.trim(),
        email: normalizedEmail,
        password: passwordHash
      });

      const result = await User.findByPk(user.id, {
        attributes: publicFields
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido" });
      }

      if (req.userId !== id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado"
        });
      }

      const { firstname, surname, email, password } = req.body;
      const changes = {};

      if (firstname !== undefined) {
        if (typeof firstname !== "string" || !firstname.trim()) {
          return res.status(400).json({ error: "Nome inválido" });
        }
        changes.firstname = firstname.trim();
      }

      if (surname !== undefined) {
        if (typeof surname !== "string" || !surname.trim()) {
          return res.status(400).json({ error: "Sobrenome inválido" });
        }
        changes.surname = surname.trim();
      }

      if (email !== undefined) {
        if (!validEmail(email)) {
          return res.status(400).json({ error: "E-mail inválido" });
        }
        changes.email = email.trim().toLowerCase();
      }

      if (password !== undefined) {
        if (!validPassword(password)) {
          return res.status(400).json({
            error: "Senha deve ter pelo menos 8 caracteres"
          });
        }
        changes.password = await bcrypt.hash(password, 12);
      }

      if (Object.keys(changes).length === 0) {
        return res.status(400).json({
          error: "Nenhum campo válido informado"
        });
      }

      await user.update(changes);

      const result = await User.findByPk(id, {
        attributes: publicFields
      });

      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido" });
      }

      if (req.userId !== id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado"
        });
      }

      await user.destroy();

      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
}

module.exports = new UserController();


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          error: "E-mail e senha são obrigatórios"
        });
      }

      const user = await User.findOne({
        where: { email: email.trim().toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          error: "Credenciais inválidas"
        });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatches) {
        return res.status(401).json({
          error: "Credenciais inválidas"
        });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h",
          algorithm: "HS256"
        }
      );

      return res.status(200).json({
        token,
        token_type: "Bearer",
        expires_in: 7200
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Erro interno do servidor"
      });
    }
  }
}

module.exports = new AuthController();

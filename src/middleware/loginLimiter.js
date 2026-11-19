
const { rateLimit } = require("express-rate-limit");

function createLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Muitas tentativas de login. Tente novamente em 15 minutos."
    }
  });
}

const loginLimiter = createLoginLimiter();

module.exports = loginLimiter;
module.exports.createLoginLimiter = createLoginLimiter;

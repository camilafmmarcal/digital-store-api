
const { Router } = require("express");

const UserController = require("../controllers/UserController");
const AuthController = require("../controllers/AuthController");
const auth = require("../middleware/auth");
const loginLimiter = require("../middleware/loginLimiter");

const router = Router();

router.post("/token", loginLimiter, AuthController.login);
router.post("/", UserController.store);
router.get("/:id", auth, UserController.show);
router.put("/:id", auth, UserController.update);
router.delete("/:id", auth, UserController.destroy);

module.exports = router;

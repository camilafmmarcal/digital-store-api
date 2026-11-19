
const { Router } = require("express");

const CategoryController = require("../controllers/CategoryController");
const auth = require("../middleware/auth");

const router = Router();

router.get("/search", CategoryController.index);
router.get("/:id", CategoryController.show);

router.post("/", auth, CategoryController.store);
router.put("/:id", auth, CategoryController.update);
router.delete("/:id", auth, CategoryController.destroy);

module.exports = router;


const { Router } = require("express");

const ProductController = require("../controllers/ProductController");
const auth = require("../middleware/auth");

const router = Router();

router.get("/search", ProductController.index);
router.get("/:id", ProductController.show);

router.post("/", auth, ProductController.store);
router.put("/:id", auth, ProductController.update);
router.delete("/:id", auth, ProductController.destroy);

module.exports = router;

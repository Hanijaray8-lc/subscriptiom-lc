const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Get all products for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const products = await Product.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new product
router.post("/", async (req, res) => {
  try {
    const { name, image, description, link, userId } = req.body; // <-- userId from frontend
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const product = new Product({ name, image, description, link, createdBy: userId });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;



// const express = require("express");
// const router = express.Router();
// const Product = require("../models/Product");

// // Get all products
// router.get("/", async (req, res) => {
//   try {
//     const products = await Product.find().sort({ createdAt: -1 });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Add a new product
// router.post("/", async (req, res) => {
//   try {
//     const { name, image, description, link } = req.body;
//     const product = new Product({ name, image, description, link });
//     await product.save();
//     res.status(201).json(product);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Delete a product
// router.delete("/:id", async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.json({ message: "Product deleted" });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// module.exports = router;
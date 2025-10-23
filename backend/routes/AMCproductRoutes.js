const express = require('express');
const router = express.Router();
const AMCproduct = require('../models/AMCproduct');
const mongoose = require('mongoose');

// GET all products for a specific owner
// Query param: ?owner=<ownerId>
router.get('/', async (req, res) => {
  try {
    const { owner } = req.query;

    if (!owner) {
      return res.status(400).json({ message: 'Owner ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: 'Invalid Owner ID format' });
    }

    const products = await AMCproduct.find({ owner }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  try {
    const { name, image, description, link, owner, userEmail } = req.body;

    if (!name || !image || !owner) {
      return res.status(400).json({ message: 'name, image and owner are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: 'Invalid Owner ID format' });
    }

    const newProduct = new AMCproduct({
      name: name.trim(),
      image,
      description: description?.trim() || '',
      link: link?.trim() || '',
      owner,
      userEmail
    });

    const savedProduct = await newProduct.save();
    return res.status(201).json({ message: 'Product added successfully!', product: savedProduct });
  } catch (error) {
    console.error('❌ Error saving product:', error);
    // for development return error details; remove details in production
    return res.status(500).json({ message: 'Failed to save product', error: error.message });
  }
});

// DELETE a product by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await AMCproduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await AMCproduct.findByIdAndDelete(id);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

module.exports = router;

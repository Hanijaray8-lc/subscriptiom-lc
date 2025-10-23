const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    link: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // <-- Add this
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);


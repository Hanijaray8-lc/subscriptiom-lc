const mongoose = require('mongoose');

const AMCproductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true }, // base64 string or URL
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String } // optional (safer)
  },
  { timestamps: true }
);

module.exports = mongoose.model('AMCProduct', AMCproductSchema);

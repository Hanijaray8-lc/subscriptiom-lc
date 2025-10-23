// models/AmcInvoice.js
const mongoose = require("mongoose");

// Sub-schema for products in invoice
const ProductSchema = new mongoose.Schema({
  productId: { type: String, trim: true },
  productName: { type: String, required: true, trim: true },
  duration: { type: String, default: "" }, // e.g., "12 months", "1 Year"
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 }
});

const AmcInvoiceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  invoiceNumber: { type: String, required: true, unique: true },

  customerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, default: "" },
  address: { type: String, required: true },

  subscription: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },

  renewalDueDate: { type: Date },            // 7 days before endDate
  daysUntilRenewal: { type: Number, default: null }, // auto-calculated

  paymentMethod: { type: String, default: "Cash" },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Overdue'], 
    default: 'Pending' 
  },

  products: { type: [ProductSchema], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Middleware: auto-calc endDate, totalAmount, renewal info
AmcInvoiceSchema.pre('save', function (next) {
  const today = new Date();

  // 1️⃣ Auto-calc endDate based on first product duration
  if (!this.endDate && this.startDate) {
    try {
      const start = new Date(this.startDate);
      let months = 0;

      if (this.products.length > 0 && this.products[0].duration) {
        const match = this.products[0].duration.match(/(\d+)\s*(Month|Year)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          months = unit.startsWith('year') ? value * 12 : value;
        }
      }

      start.setMonth(start.getMonth() + months);
      this.endDate = start;
    } catch (err) {
      console.warn("⚠️ Could not auto-calc endDate:", err.message);
    }
  }

  // 2️⃣ Auto-calc totalAmount
  this.totalAmount = this.products.reduce((sum, p) => {
    return sum + (parseFloat(p.price) || 0) * (parseInt(p.quantity) || 1);
  }, 0);

  // 3️⃣ Auto-calc renewal info
  if (this.endDate) {
    const renewalDate = new Date(this.endDate);
    renewalDate.setDate(renewalDate.getDate() - 7); // 7 days before endDate
    this.renewalDueDate = renewalDate;

    const diff = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    this.daysUntilRenewal = diff; // positive = days left, negative = overdue

    // Auto-update payment status
    if (this.paymentStatus !== 'Paid') {
      this.paymentStatus = diff < 0 ? 'Overdue' : 'Pending';
    }
  }

  next();
});

// Include virtuals in JSON
AmcInvoiceSchema.set("toJSON", { virtuals: true });
AmcInvoiceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("AmcInvoice", AmcInvoiceSchema);

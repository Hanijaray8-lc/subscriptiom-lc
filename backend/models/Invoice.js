const mongoose = require("mongoose");
const InvoiceSchema = new mongoose.Schema({
  date: String,
  name: String,
  phone: String,
  company: String,
  address: String,
  product: String,
  subscription: String,
  duration: String,
  startDate: String,
  endDate: String,
  price: Number,
  paymentMethod: String,
  email: String,
  invoiceNo: String,
  paymentStatus: { type: String, default: "Pending" },
  invoiceItems: [
    {
      subscription: String,
      product: String,
      service: String,
      quantity: Number,
      amount: Number,
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// 🔹 Virtual field for renewal due days
InvoiceSchema.virtual("renewalDueDays").get(function () {
  if (!this.endDate) return null;
  const endDate = new Date(this.endDate);
  const today = new Date();

  // reset time to avoid time diff issues
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : -1; // -1 means expired
});

// Ensure virtuals are included in JSON output
InvoiceSchema.set("toJSON", { virtuals: true });
InvoiceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Invoice", InvoiceSchema);



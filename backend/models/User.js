const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  company: { type: String, required: true },
  companyAddress: { type: String },
  companyLogo: { type: String },
  option: { type: String, enum: ["Subscription", "AMC"], required: true },
  password: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Route imports
const userRoute = require("./routes/userRoute");
const invoiceRoute = require("./routes/invoiceRoute");   
const productRoute = require("./routes/productRoute");   

const AMCproductRoutes = require("./routes/AMCproductRoutes"); 
const AmcInvoiceRoutes = require("./routes/Amcinvoiceroutes"); 

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Adjust for your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

// Routes
app.use("/api/users", userRoute);
app.use("/api/invoices", invoiceRoute);
app.use("/api/products", productRoute);

app.use("/api/amc-products", AMCproductRoutes);
app.use("/api/amcinvoices", AmcInvoiceRoutes);

// Health check
app.get("/ping", (req, res) => res.send("pong"));

// API Info
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Unified Invoice Management API running with MongoDB Atlas!",
    endpoints: {
      users: "/api/users",
      invoices: "/api/invoices",
      products: "/api/products",
      amcProducts: "/api/amc-products",
      amcInvoices: "/api/amcinvoices",
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

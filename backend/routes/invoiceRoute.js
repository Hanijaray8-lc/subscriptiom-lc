const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const User = require("../models/User"); 

router.post("/", async (req, res) => {
  try {
    const { createdBy } = req.body; // ID of the user creating the invoice

    if (!createdBy) return res.status(400).json({ error: "createdBy is required" });

    // 1️⃣ Get the user to fetch their company
    const user = await User.findById(createdBy);
    if (!user) return res.status(404).json({ error: "User not found" });

    const company = user.company; // company name from the user

    // 2️⃣ Get the last invoice for this company only
    const lastInvoice = await Invoice.findOne({ company }).sort({ createdAt: -1 });

    // 3️⃣ Generate new invoice number
    let newInvoiceNo = `${company}-001`; // default first invoice
    if (lastInvoice && lastInvoice.invoiceNo) {
      const lastNum = parseInt(lastInvoice.invoiceNo.split("-")[1]); // numeric part
      newInvoiceNo = `${company}-${(lastNum + 1).toString().padStart(3, "0")}`;
    }

    // 4️⃣ Create the new invoice
    const invoice = new Invoice({
      ...req.body,
      company,           // ensure invoice has company field
      invoiceNo: newInvoiceNo
    });

    await invoice.save();
    res.status(201).json(invoice);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ READ - Get all invoices, optionally filter by client name
router.get("/", async (req, res) => {
  try {
    const { name, userId } = req.query;
    let query = {};
    if (userId) query.createdBy = userId;
    if (name) query.name = name;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ READ - Get single invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE - Edit invoice
router.put("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE - Remove invoice
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Amcinvoice = require('../models/Amcinvoice');
const User = require('../models/User');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
  try {
    const { owner, ...invoiceData } = req.body;

    if (!owner || !mongoose.Types.ObjectId.isValid(owner))
      return res.status(400).json({ success: false, message: 'Valid owner ID is required' });

    // Fetch user (manager)
    const user = await User.findById(owner);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Always use the user's company from DB
    const company = user.company;
    if (!company) return res.status(400).json({ success: false, message: 'User has no company assigned' });

    // Generate invoice number based on user's company
    const companyKey = company.replace(/\s+/g, '_'); // handle spaces
    const lastInvoice = await Amcinvoice.findOne({ company }).sort({ createdAt: -1 });
    let newInvoiceNumber = `${companyKey}-001`;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]) || 0;
      newInvoiceNumber = `${companyKey}-${(lastNum + 1).toString().padStart(3, '0')}`;
    }

    // Create invoice
    const newInvoice = new Amcinvoice({
      ...invoiceData,
      company, // company from logged-in manager
      invoiceNumber: newInvoiceNumber,
      owner,
      startDate: new Date(invoiceData.startDate),
      endDate: new Date(invoiceData.endDate),
      date: new Date(invoiceData.date),
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json({ success: true, message: 'Invoice created', data: savedInvoice });

  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: 'Error creating invoice', error: error.message });
  }
});


// GET all invoices for owner
router.get('/', async (req, res) => {
  try {
    const { owner } = req.query;
    if (!owner || !mongoose.Types.ObjectId.isValid(owner))
      return res.status(400).json({ success: false, message: 'Valid owner ID is required' });

    const invoices = await Amcinvoice.find({ owner }).sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Amcinvoice.findById(req.params.id)
      .populate('owner', 'username email company');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// UPDATE invoice
router.put('/:id', async (req, res) => {
  try {
    const updatedInvoice = await Amcinvoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!updatedInvoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice updated', data: updatedInvoice });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating invoice', error: error.message });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ success: false, message: 'Invalid invoice ID' });

  try {
    const deletedInvoice = await Amcinvoice.findByIdAndDelete(id);
    if (!deletedInvoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted', data: deletedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET /api/amcinvoices/:invoiceId/history
// GET /api/amcinvoices/:invoiceId/history
router.get("/:invoiceId/history", async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    // 1️⃣ அந்த invoice-ஐ கண்டுபிடிக்க
    const currentInvoice = await Amcinvoice.findById(invoiceId);
    if (!currentInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // 2️⃣ அந்த invoice-லிருந்து company + customerName எடுக்க
    const companyName = currentInvoice.company?.trim();
    const customerName = currentInvoice.customerName?.trim();

    if (!companyName || !customerName) {
      return res.status(400).json({
        success: false,
        message: "Company or Customer name missing in invoice"
      });
    }

    // 3️⃣ அதே company + அதே customerName கொண்ட invoices-யை எடுக்க
    const relatedInvoices = await Amcinvoice.find({
      company: companyName,
      customerName: customerName
    }).sort({ createdAt: 1 });

    if (!relatedInvoices.length) {
      return res.json({ success: true, data: [] });
    }

    // 4️⃣ Renewal history வடிவமைக்க
    const history = relatedInvoices.map((inv) => ({
      renewalDate: inv.date ? new Date(inv.date).toISOString().split("T")[0] : null,
      previousEndDate: inv.startDate ? new Date(inv.startDate).toISOString().split("T")[0] : null,
      newendDate: inv.endDate ? new Date(inv.endDate).toISOString().split("T")[0] : null,
      productName: inv.products?.[0]?.productName || "AMC Service",
      subscriptionDetails: inv.subscription || "1 Year",
      amount: inv.totalAmount || 0,
      invoiceNumber: inv.invoiceNumber,
      company: inv.company,
      customerName: inv.customerName
    }));

    res.json({ success: true, data: history });
  } catch (err) {
    console.error("Error fetching renewal history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});




module.exports = router;

import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Modal } from "bootstrap";
import axios from "axios";
import { Button, Dropdown } from "react-bootstrap";
import Navbar from "./Navbar";
import Footer from "./Footer";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

function MaintenanceUpdateHistoryPage() {
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRenewalFilter, setShowRenewalFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);

  // formData with multiple products support
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    email: "",
    company: "",
    customerName: "",
    phone: "",
    address: "",
    subscription: "",
    startDate: "",
    paymentMethod: "Cash",
    dueDate: "",
    products: [
      {
        productId: "",
        productName: "",
        duration: "",
        price: "",
        quantity: 1,
      },
    ],
  });

  // Refs for modals
  const invoiceModalRef = useRef(null);
  const shareModalRef = useRef(null);

  // API Base URLs
  const INVOICE_API_URL = "https://subscriptiom-lc.onrender.com/api/amcinvoices";
  const PRODUCTS_API_URL = "https://subscriptiom-lc.onrender.com/api/amc-products";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setError("User not logged in.");
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (!user?._id) {
        setError("Invalid user data.");
        return;
      }
      setCurrentUser(user);
      fetchUserProducts(user._id);
      fetchUserInvoices(user._id);
    } catch (err) {
      console.error("Error parsing user data:", err);
      setError("Invalid user data. Please login again.");
    }
  }, []);

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    return formData.products.reduce((total, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 1;
      return total + price * quantity;
    }, 0);
  };

  // Fetch user's products from backend
  const fetchUserProducts = async (userId) => {
    try {
      if (!userId) {
        setError("Invalid user ID");
        return;
      }

      const response = await axios.get(PRODUCTS_API_URL, {
        params: { owner: userId },
      });

      setUserProducts(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Error fetching user products:", err);
      setError(
        "Failed to fetch products: " + (err.response?.data?.message || err.message)
      );
    }
  };

  // Fetch user invoices - FIXED: Only fetch invoices due for renewal
  const fetchUserInvoices = async (userId) => {
    if (!userId) {
      setError("Invalid user ID");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(INVOICE_API_URL, {
        params: { owner: userId },
      });

      if (response.data && response.data.success) {
        const userInvoices = response.data.data || [];
        
        // Filter invoices that are due for renewal within 7 days
        const renewalDueInvoices = userInvoices.filter(invoice => {
          if (!invoice.dueDate) return false;
          const today = new Date();
          const due = new Date(invoice.dueDate);
          const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
          return diffDays <= 7 && diffDays >= 0; // Due within 7 days
        });

        setInvoiceData(renewalDueInvoices);
        setFilteredInvoices(renewalDueInvoices);
      } else {
        throw new Error(response.data.message || "Failed to fetch invoices");
      }
    } catch (err) {
      console.error("❌ Error fetching invoices:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters based on search term
  useEffect(() => {
    let result = invoiceData;

    // Apply search filter only (removed renewal filter since we're only showing renewal invoices)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          (invoice.customerName || "").toLowerCase().includes(term) ||
          (invoice.email || "").toLowerCase().includes(term) ||
          (invoice.phone || "").includes(term) ||
          (invoice.invoiceNumber || "").toLowerCase().includes(term) ||
          (invoice.products &&
            invoice.products.some((p) =>
              (p.productName || "").toLowerCase().includes(term)
            ))
      );
    }

    setFilteredInvoices(result);
  }, [searchTerm, invoiceData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];

    if (field === "productId") {
      const selectedProduct = userProducts.find((p) => p._id === value);
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: value,
        productName: selectedProduct ? selectedProduct.name : "",
        price: selectedProduct ? selectedProduct.price : updatedProducts[index].price,
        duration: selectedProduct
          ? selectedProduct.duration || ""
          : updatedProducts[index].duration,
      };
    } else {
      updatedProducts[index][field] = value;
    }

    setFormData({
      ...formData,
      products: updatedProducts,
    });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [
        ...formData.products,
        {
          productId: "",
          productName: "",
          duration: "",
          price: "",
          quantity: 1,
        },
      ],
    });
  };

  const removeProductRow = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = [...formData.products];
      updatedProducts.splice(index, 1);
      setFormData({
        ...formData,
        products: updatedProducts,
      });
    }
  };

  const openInvoiceModal = () => {
    if (invoiceModalRef.current) {
      const modal = new Modal(invoiceModalRef.current, { backdrop: true });
      modal.show();
    }
  };

  const closeInvoiceModal = () => {
    if (invoiceModalRef.current) {
      const modal = Modal.getInstance(invoiceModalRef.current);
      if (modal) modal.hide();
    }
    setEditMode(false);
    setEditInvoiceId(null);
  };

  // Edit handler
  const handleEdit = (invoice) => {
    setEditMode(true);
    setEditInvoiceId(invoice._id);

    // Format dates properly for input fields
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
      } catch (error) {
        return "";
      }
    };

    setFormData({
      date: formatDateForInput(invoice.date) || new Date().toISOString().split("T")[0],
      email: invoice.email || "",
      company: invoice.company || "",
      customerName: invoice.customerName || "",
      phone: invoice.phone || "",
      address: invoice.address || "",
      subscription: invoice.subscription || "",
      startDate: formatDateForInput(invoice.startDate) || "",
      paymentMethod: invoice.paymentMethod || "Cash",
      dueDate: formatDateForInput(invoice.dueDate) || "",
      products:
        invoice.products && invoice.products.length > 0
          ? invoice.products.map((p) => ({
              productId: p.productId || "",
              productName: p.productName || "",
              duration: p.duration || "",
              price: p.price ? p.price.toString() : "",
              quantity: p.quantity || 1,
            }))
          : [{ productId: "", productName: "", duration: "", price: "", quantity: 1 }],
    });

    openInvoiceModal();
  };

  // Delete handler
  const handleDelete = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await axios.delete(`${INVOICE_API_URL}/${invoiceId}`);
      if (response.data && response.data.success) {
        setInvoiceData(invoiceData.filter((inv) => inv._id !== invoiceId));
        alert("Invoice deleted successfully!");
      } else {
        throw new Error(response.data.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert(`Failed to delete invoice: ${error.response?.data?.message || error.message}`);
    }
  };

  // Save handler (create or update)
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.customerName?.trim() || 
          !formData.phone?.trim() || 
          !formData.address?.trim() || 
          !formData.subscription?.trim() || 
          !formData.startDate || 
          !formData.dueDate) {
        alert("Please fill in all required fields.");
        return;
      }

      if (formData.products.some((p) => !p.productName?.trim() || !p.price || p.price === "")) {
        alert("Please ensure all products have a name and price.");
        return;
      }

      // Prepare data for backend
      const invoiceDataToSend = {
        owner: currentUser._id,
        customerName: formData.customerName.trim(),
        email: (formData.email || currentUser?.email || "").trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        company: formData.company?.trim() || "",
        subscription: formData.subscription.trim(),
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        date: formData.date,
        paymentMethod: formData.paymentMethod || "Cash",
        products: formData.products.map((p) => ({
          productId: p.productId || "",
          productName: p.productName.trim(),
          price: parseFloat(p.price) || 0,
          quantity: parseInt(p.quantity) || 1,
          duration: p.duration?.trim() || "",
        })),
        totalAmount: calculateTotal(),
      };

      console.log("Sending invoice data:", invoiceDataToSend);

      let response;
      if (editMode && editInvoiceId) {
        response = await axios.put(`${INVOICE_API_URL}/${editInvoiceId}`, invoiceDataToSend);
      } else {
        response = await axios.post(INVOICE_API_URL, invoiceDataToSend);
      }

      if (response.data && response.data.success) {
        const savedInvoice = response.data.data;

        if (editMode) {
          setInvoiceData(invoiceData.map((inv) => (inv._id === editInvoiceId ? savedInvoice : inv)));
          alert("Invoice updated successfully!");
        } else {
          setInvoiceData([savedInvoice, ...invoiceData]);
          alert("Invoice created successfully!");
        }

        closeInvoiceModal();
        resetFormData();
        
        // Refresh the invoice list
        fetchUserInvoices(currentUser._id);
      } else {
        throw new Error(response.data.message || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Failed to save invoice: ${errorMessage}`);
    }
  };

  const resetFormData = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      email: currentUser?.email || "",
      company: "",
      customerName: "",
      phone: "",
      address: "",
      subscription: "",
      startDate: "",
      paymentMethod: "Cash",
      dueDate: "",
      products: [
        {
          productId: "",
          productName: "",
          duration: "",
          price: "",
          quantity: 1,
        },
      ],
    });
    setEditMode(false);
    setEditInvoiceId(null);
  };

  // Calculate days remaining
  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return "N/A";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return `${diffDays} Days`;
    if (diffDays === 1) return `1 Day`;
    if (diffDays === 0) return `Due Today`;
    return `${Math.abs(diffDays)} Days Ago`;
  };

  // Share functionality - Only share renewal due invoices
  const shareViaWhatsApp = (invoice) => {
    const daysRemaining = calculateDaysRemaining(invoice.dueDate);
    const message = `🔔 RENEWAL REMINDER\n\nInvoice: ${invoice.invoiceNumber}\nCustomer: ${invoice.customerName}\nAmount: ₹${invoice.totalAmount}\nDue Date: ${formatDateForDisplay(invoice.dueDate)}\nRenewal Due: ${daysRemaining}\n\nPlease renew your subscription to avoid service interruption.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = (invoice) => {
    const daysRemaining = calculateDaysRemaining(invoice.dueDate);
    const subject = `🔔 Renewal Reminder - Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`;
    const body = `Dear ${invoice.customerName},

This is a friendly reminder that your subscription is due for renewal.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ₹${invoice.totalAmount}
- Due Date: ${formatDateForDisplay(invoice.dueDate)}
- Renewal Due: ${daysRemaining}

Please complete the renewal process to continue enjoying uninterrupted service.

Thank you for your business!`;
    const url = `mailto:${invoice.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const shareViaLink = (invoice) => {
    const invoiceDataObj = {
      customerName: invoice.customerName,
      amount: invoice.totalAmount,
      dueDate: invoice.dueDate,
      invoiceNumber: invoice.invoiceNumber,
      renewalDue: calculateDaysRemaining(invoice.dueDate)
    };
    const base64Data = btoa(JSON.stringify(invoiceDataObj));
    const link = `${window.location.origin}/renewal/${base64Data}`;

    navigator.clipboard.writeText(link).then(() => {
      alert("Renewal link copied to clipboard!");
    });
  };

  // Export functionality - Only export renewal due invoices
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredInvoices.map((invoice) => ({
        "Invoice Number": invoice.invoiceNumber,
        Date: formatDateForDisplay(invoice.date),
        "Customer Name": invoice.customerName,
        Email: invoice.email,
        Phone: invoice.phone,
        Subscription: invoice.subscription,
        "Due Date": formatDateForDisplay(invoice.dueDate),
        "Renewal Due In": calculateDaysRemaining(invoice.dueDate),
        "Total Amount": invoice.totalAmount,
        "Payment Method": invoice.paymentMethod,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Renewal_Invoices");
    XLSX.writeFile(workbook, "renewal_reminders.xlsx");
  };

  const exportToPDF = () => {
    const element = document.getElementById("invoicesTable");
    const options = {
      margin: 1,
      filename: "renewal_reminders.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(element).save();
  };

  const exportSelectedToPDF = (invoice) => {
    const daysRemaining = calculateDaysRemaining(invoice.dueDate);
    const content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #333; border-bottom: 2px solid #1e6be6; padding-bottom: 10px;">RENEWAL REMINDER</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f8f9fa;">Invoice Number</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f8f9fa;">Customer Name</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${invoice.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f8f9fa;">Total Amount</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${invoice.totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f8f9fa;">Due Date</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatDateForDisplay(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #ffeb3b;">Renewal Due In</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #e65100;">${daysRemaining}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
          <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Please renew your subscription to avoid service interruption</p>
        </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    const options = {
      margin: 1,
      filename: `renewal_${invoice.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(tempDiv).save();
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border"></div>
      </div>
    );

  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div>
      <style>{`
        .page-header {
          font-size: 34px;
          font-weight: 700;
          color: #1e6be6;
          margin-bottom: 18px;
        }
        .purple-thead th {
          background: #d6b3ff !important;
          font-weight: 700;
          color: #2b1b39;
        }
        .action-circle {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
        }
        .status-pill {
          padding: .35rem .6rem;
          border-radius: .35rem;
          font-weight: 600;
        }
        .table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .invoices-container {
          min-height: 420px;
          background: #fff;
        }
        .export-share .btn {
          height: 38px;
        }
        .card-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          padding: 20px;
        }
        .invoice-card {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
          border-left: 4px solid #ff9800;
        }
        .invoice-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        .card-actions {
          display: flex;
          gap: 8px;
        }
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .card-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .card-field:last-child {
          border-bottom: none;
        }
        .field-label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
        }
        .field-value {
          font-weight: 500;
          color: #333;
          text-align: right;
        }
        .products-list {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          font-size: 0.85rem;
        }
        .renewal-badge {
          background: linear-gradient(45deg, #ff9800, #ff5722);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .urgent-renewal {
          border-left: 4px solid #f44336;
          background: #fff8e1;
        }
        .renewal-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 15px;
        }
      `}</style>

      <Navbar />

      <div className="container p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="page-header m-0">Renewal Reminders</h2>

          <div className="d-flex gap-2 export-share align-items-center">
            {/* Table View Button */}
            <Button 
              variant={viewMode === "table" ? "primary" : "outline-primary"}
              className="d-flex align-items-center"
              onClick={() => setViewMode("table")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-table me-1" viewBox="0 0 16 16">
                <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2zm1 1v10h6V3H1zm8 0v10h6V3H9z"/>
              </svg>
             
            </Button>

            {/* Card View Button */}
            <Button 
              variant={viewMode === "card" ? "primary" : "outline-primary"}
              className="d-flex align-items-center"
              onClick={() => setViewMode("card")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grid-3x3-gap me-1" viewBox="0 0 16 16">
                <path d="M4 2v2H2V2h2zm1 12v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm5 10v-2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zM9 2v2H7V2h2zm5 0v2h-2V2h2z"/>
              </svg>
             
            </Button>

            <Dropdown>
              <Dropdown.Toggle variant="warning" id="dropdown-export" className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-download me-1" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToExcel}>Export to Excel</Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}>Export to PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle variant="info" id="dropdown-share" className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell me-1" viewBox="0 0 16 16">
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
                Share 
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => filteredInvoices.length > 0 && shareViaWhatsApp(filteredInvoices[0])}>WhatsApp</Dropdown.Item>
                <Dropdown.Item onClick={() => filteredInvoices.length > 0 && shareViaEmail(filteredInvoices[0])}>Email</Dropdown.Item>
                <Dropdown.Item onClick={() => filteredInvoices.length > 0 && shareViaLink(filteredInvoices[0])}>Copy Link</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Renewal Warning Banner */}
        {filteredInvoices.length > 0 && (
          <div className="renewal-warning mb-3">
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#856404" className="bi bi-exclamation-triangle me-2" viewBox="0 0 16 16">
                <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
              </svg>
              <strong>Renewal Alert:</strong> 
              <span className="ms-2">
                {filteredInvoices.length} subscription(s) due for renewal within 7 days
              </span>
            </div>
          </div>
        )}

        <div className="row mb-3 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10.442 10.442a1 1 0 0 1 1.415 0l3.85 3.85a1 1 0 0 1-1.415 1.415l-3.85-3.85a1 1 0 0 1 0-1.415z"/>
                  <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"/>
                </svg>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search renewal invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6 d-flex justify-content-end">
            <div className="text-muted fw-bold">
              🔔 Showing only invoices due for renewal within 7 days
            </div>
          </div>
        </div>

        <div className="invoices-container p-0">
          {viewMode === "table" ? (
            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
              <table id="invoicesTable" className="table table-bordered table-hover shadow-sm mb-0">
                <thead className="text-center purple-thead">
                  <tr>
                    <th style={{ position: "sticky", top: 0 }}>S.No</th>
                    <th style={{ position: "sticky", top: 0 }}>Date</th>
                    <th style={{ position: "sticky", top: 0 }}>Invoice No</th>
                    <th style={{ position: "sticky", top: 0 }}>Client Name</th>
                    <th style={{ position: "sticky", top: 0 }}>Product Purchased</th>
                    <th style={{ position: "sticky", top: 0 }}>Price</th>
                    <th style={{ position: "sticky", top: 0 }}>Subscription Plan</th>
                    <th style={{ position: "sticky", top: 0 }}>Renewal Due In</th>
                    <th style={{ position: "sticky", top: 0 }}>Status</th>
                    <th style={{ position: "sticky", top: 0 }}>Action</th>
                  </tr>
                </thead>

                <tbody className="align-middle text-center">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => (
                      <tr key={invoice._id || index} className={calculateDaysRemaining(invoice.dueDate) === 'Due Today' ? 'table-warning' : ''}>
                        <td style={{ width: "48px" }}>{index + 1}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDateForDisplay(invoice.date)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{invoice.invoiceNumber || `LC-${String(index + 1).padStart(3, "0")}`}</td>
                        <td>{invoice.customerName || "-"}</td>
                        <td style={{ textAlign: "left" }}>
                          {invoice.products && invoice.products.length > 0 ? (
                            invoice.products.map((p, i) => (
                              <div key={i} style={{ fontSize: "0.95rem" }}>
                                {p.productName} {p.duration ? `(${p.duration})` : ""} <small className="text-muted">x{p.quantity}</small>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">No products</span>
                          )}
                        </td>
                        <td>₹{invoice.totalAmount ?? invoice.products?.reduce((s,p)=>s + ((parseFloat(p.price)||0) * (parseInt(p.quantity)||1)),0)}</td>
                        <td>
                          <span className="badge bg-info">{invoice.subscription || "Yearly"}</span>
                        </td>
                        <td>
                          <span className="renewal-badge">
                            {calculateDaysRemaining(invoice.dueDate)}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill" style={{ background: "#1b9a4a", color: "#fff" }}>
                            Acitivated
                          </span>
                        </td>
                      <div className="card-actions">
  <Button variant="light" className="action-circle" title="Renew / refresh" onClick={() => handleEdit(invoice)}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 1 1 .908-.418A6 6 0 1 1 8 2v1z"/>
      <path d="M8 1v4l3-2-3-2z"/>
    </svg>
  </Button>
  
  {/* இந்த Dropdown part முழுவதும் remove பண்ணிட்டு இதை வைக்கவும்: */}
  <Button variant="light" className="action-circle" title="Actions" onClick={() => handleEdit(invoice)}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
    </svg>
  </Button>
</div>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-muted">
                        No renewal invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Card View
            <div className="card-view">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <div key={invoice._id || index} className={`invoice-card ${calculateDaysRemaining(invoice.dueDate) === 'Due Today' ? 'urgent-renewal' : ''}`}>
                    <div className="card-header">
                      <div>
                        <h6 className="mb-1 fw-bold text-primary">{invoice.customerName || "-"}</h6>
                        <small className="text-muted">Invoice: {invoice.invoiceNumber || `LC-${String(index + 1).padStart(3, "0")}`}</small>
                      </div>
                      <div className="card-actions">
                        <Button variant="light" className="action-circle" title="Renew / refresh" onClick={() => handleEdit(invoice)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 1 1 .908-.418A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 1v4l3-2-3-2z"/>
                          </svg>
                        </Button>
                        <Dropdown>
                          <Dropdown.Toggle as={Button} variant="light" className="action-circle p-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M3 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                            </svg>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleEdit(invoice)}>Edit</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleDelete(invoice._id)}>Delete</Dropdown.Item>
                            <Dropdown.Item onClick={() => shareViaWhatsApp(invoice)}>Share via WhatsApp</Dropdown.Item>
                            <Dropdown.Item onClick={() => shareViaEmail(invoice)}>Share via Email</Dropdown.Item>
                            <Dropdown.Item onClick={() => exportSelectedToPDF(invoice)}>Export PDF</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="card-field">
                        <span className="field-label">Date:</span>
                        <span className="field-value">{formatDateForDisplay(invoice.date)}</span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Email:</span>
                        <span className="field-value">{invoice.email || "-"}</span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Phone:</span>
                        <span className="field-value">{invoice.phone || "-"}</span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Subscription:</span>
                        <span className="field-value">
                          <span className="badge bg-info">{invoice.subscription || "Yearly"}</span>
                        </span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Due Date:</span>
                        <span className="field-value">{formatDateForDisplay(invoice.dueDate)}</span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Renewal Due:</span>
                        <span className="field-value renewal-badge">
                          {calculateDaysRemaining(invoice.dueDate)}
                        </span>
                      </div>
                      
                      <div className="card-field">
                        <span className="field-label">Total Amount:</span>
                        <span className="field-value fw-bold text-success">
                          ₹{invoice.totalAmount ?? invoice.products?.reduce((s,p)=>s + ((parseFloat(p.price)||0) * (parseInt(p.quantity)||1)),0)}
                        </span>
                      </div>
                      
                      {invoice.products && invoice.products.length > 0 && (
                        <div className="products-list">
                          <strong className="mb-2 d-block">Products:</strong>
                          {invoice.products.map((p, i) => (
                            <div key={i} className="product-item">
                              <span>{p.productName} {p.duration ? `(${p.duration})` : ""}</span>
                              <span className="text-muted">x{p.quantity} - ₹{p.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5 text-muted">
                  <h5>No renewal invoices found</h5>
                  <p>All subscriptions are up to date!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <div className="modal fade" ref={invoiceModalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{editMode ? "Edit Invoice" : "Create New Invoice"}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={closeInvoiceModal}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Date *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="date" 
                      value={formData.date} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Company</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="company" 
                      value={formData.company} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Customer Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="customerName" 
                      value={formData.customerName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Subscription *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="subscription" 
                      value={formData.subscription} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Address *</label>
                <textarea 
                  className="form-control" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Start Date *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="startDate" 
                      value={formData.startDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Due Date *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="dueDate" 
                      value={formData.dueDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-select" 
                  name="paymentMethod" 
                  value={formData.paymentMethod} 
                  onChange={handleInputChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label">Products *</label>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addProductRow}>
                    + Add Product
                  </button>
                </div>

                {formData.products.map((product, index) => (
                  <div key={index} className="border p-3 mb-3 rounded">
                    <div className="row">
                      <div className="col-md-5">
                        <label className="form-label">Product</label>
                        <select
                          className="form-select"
                          value={product.productId}
                          onChange={(e) => handleProductChange(index, "productId", e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {userProducts.map((prod) => (
                            <option key={prod._id} value={prod._id}>
                              {prod.name} - ₹{prod.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Price (₹) *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, "price", e.target.value)}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-md-1 d-flex align-items-end">
                        {formData.products.length > 1 && (
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeProductRow(index)}>
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-12">
                        <label className="form-label">Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          value={product.duration}
                          onChange={(e) => handleProductChange(index, "duration", e.target.value)}
                          placeholder="e.g., 1 Year, 6 Months"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3 p-3 bg-light rounded">
                <h5 className="text-end">Total Amount: ₹{calculateTotal()}</h5>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeInvoiceModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                {editMode ? "Update Invoice" : "Save Invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default MaintenanceUpdateHistoryPage;
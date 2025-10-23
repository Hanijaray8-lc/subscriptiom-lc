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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [editMode, setEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [renewalHistory, setRenewalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");


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
    endDate: "",
    products: [{ productId: "", productName: "", duration: "", price: "", quantity: 1 }]
  });

  const invoiceModalRef = useRef(null);
  const historyModalRef = useRef(null);
  const API_BASE = "https://subscriptiom-lc.onrender.com/api";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return setError("User not logged in.");
    try {
      const user = JSON.parse(userData);
      if (!user?._id) return setError("Invalid user data.");
      setCurrentUser(user);
      fetchUserProducts(user._id);
      fetchUserInvoices(user._id);
    } catch (err) {
      setError("Invalid user data. Please login again.");
    }
  }, []);

  // 🔹 Format Date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return "Invalid Date"; }
  };

  // 🔹 Calculate Total
  const calculateTotal = () => formData.products.reduce((total, product) =>
    total + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 1), 0
  );

  // 🔹 Calculate End Date from Start Date + Duration
  const calculateEndDate = (startDate, duration) => {
    if (!startDate || !duration) return null;
    const start = new Date(startDate);
    let monthsToAdd = 0;

    if (duration.toLowerCase().includes("month")) {
      monthsToAdd = parseInt(duration) || 0;
    } else if (duration.toLowerCase().includes("year")) {
      monthsToAdd = (parseInt(duration) || 0) * 12;
    }

    start.setMonth(start.getMonth() + monthsToAdd);
    return start.toISOString().split("T")[0]; // yyyy-mm-dd
  };

  // 🔹 Calculate Days Remaining
  const calculateDaysRemaining = (endDate) => {
  if (!endDate) return "N/A";  // show N/A if no due date
  const today = new Date();
  const due = new Date(endDate);
  if (isNaN(due)) return "Invalid Date"; // handle invalid date

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return `${diffDays} Days`;
  if (diffDays === 1) return "1 Day";
  if (diffDays === 0) return "Due Today";
  return `${Math.abs(diffDays)} Days Ago`;
};


  // 🔹 Fetch Products
  const fetchUserProducts = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_BASE}/amc-products`, { params: { owner: userId } });
      setUserProducts(response.data?.data || []);
    } catch { setError("Failed to fetch products"); }
  };

  // 🔹 Fetch Invoices
  const fetchUserInvoices = async (userId) => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/amcinvoices`, { params: { owner: userId } });
      if (response.data?.success) {
        const userInvoices = response.data.data || [];

        // 🔹 Filter invoices with 7 or fewer days remaining
        const filtered = userInvoices.filter(inv => {
          const end = inv.endDate || (inv.products?.length > 0
            ? calculateEndDate(inv.startDate, inv.products[0].duration)
            : null);
          if (!end) return false;
          const today = new Date();
          const diffDays = Math.ceil((new Date(end) - today) / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });

        setInvoiceData(filtered);
        setFilteredInvoices(filtered);
      }
    } catch {
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const viewRenewalHistory = async (invoice) => {
  try {
    setSelectedCustomerName(invoice.customerName || "Customer");
    setHistoryLoading(true);
    new Modal(historyModalRef.current, { backdrop: true }).show();

    // Make API call to fetch history for this invoice
    const response = await axios.get(`${API_BASE}/amcinvoices/${invoice._id}/history`);
    
    if (response.data?.success) {
      setRenewalHistory(response.data.data || []);
    } else {
      setRenewalHistory([]);
      alert("No renewal history found.");
    }
  } catch (err) {
    setRenewalHistory([]);
    alert("Failed to fetch renewal history: " + (err.response?.data?.message || err.message));
  } finally {
    setHistoryLoading(false);
  }
};


  // 🔹 Search Filter
  useEffect(() => {
    let result = invoiceData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(invoice =>
        (invoice.customerName || "").toLowerCase().includes(term) ||
        (invoice.email || "").toLowerCase().includes(term) ||
        (invoice.phone || "").includes(term) ||
        (invoice.invoiceNumber || "").toLowerCase().includes(term)
      );
    }
    setFilteredInvoices(result);
  }, [searchTerm, invoiceData]);

  // 🔹 Input Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    if (field === "productId") {
      const selectedProduct = userProducts.find(p => p._id === value);
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: value,
        productName: selectedProduct?.name || "",
        price: selectedProduct?.price || updatedProducts[index].price,
        duration: selectedProduct?.duration || updatedProducts[index].duration,
      };
    } else updatedProducts[index][field] = value;
    setFormData(prev => ({ ...prev, products: updatedProducts }));
  };

  const addProductRow = () => setFormData(prev => ({
    ...prev,
    products: [...prev.products, { productId: "", productName: "", duration: "", price: "", quantity: 1 }]
  }));

  const removeProductRow = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, products: updatedProducts }));
    }
  };

  const closeInvoiceModal = () => {
  const modal = Modal.getInstance(invoiceModalRef.current);
  if (modal) modal.hide();
  // move focus somewhere safe (like a button outside)
  document.getElementById("openModalButton").focus();
};


  const closeHistoryModal = () => {
    const modal = Modal.getInstance(historyModalRef.current);
    if (modal) modal.hide();
    setRenewalHistory([]);
  };

  const handleEdit = (invoice) => {
    setEditMode(true);
    setEditInvoiceId(invoice._id);

    const formatDateForInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

    setFormData({
      date: formatDateForInput(invoice.date) || new Date().toISOString().split("T")[0],
      email: invoice.email || "", company: invoice.company || "", customerName: invoice.customerName || "",
      phone: invoice.phone || "", address: invoice.address || "", subscription: invoice.subscription || "",
      startDate: formatDateForInput(invoice.startDate) || "", paymentMethod: invoice.paymentMethod || "Cash",
      endDate: formatDateForInput(invoice.endDate) || "",
      products: invoice.products?.length > 0 ? invoice.products.map(p => ({
        productId: p.productId || "", productName: p.productName || "",
        duration: p.duration || "", price: p.price?.toString() || "", quantity: p.quantity || 1
      })) : [{ productId: "", productName: "", duration: "", price: "", quantity: 1 }]
    });

    new Modal(invoiceModalRef.current).show(); // open modal
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await axios.delete(`${API_BASE}/amcinvoices/${invoiceId}`);
      setInvoiceData(prev => prev.filter(inv => inv._id !== invoiceId));
      alert("Invoice deleted successfully!");
    } catch (error) {
      alert(`Failed to delete invoice: ${error.response?.data?.message || error.message}`);
    }
  };

 const handleSave = async () => {
  try {
    const requiredFields = ['customerName', 'phone', 'address', 'subscription', 'startDate', 'endDate'];
    if (requiredFields.some(field => !formData[field]?.trim())) {
      return alert("Please fill in all required fields.");
    }
    if (formData.products.some(p => !p.productName?.trim() || !p.price)) {
      return alert("Please ensure all products have a name and price.");
    }

    const invoiceDataToSend = {
      owner: currentUser._id,
      ...formData,
      products: formData.products.map(p => ({
        ...p,
        price: parseFloat(p.price) || 0,
        quantity: parseInt(p.quantity) || 1
      })),
      totalAmount: calculateTotal()
    };

    // Always create new invoice
    const response = await axios.post(`${API_BASE}/amcinvoices`, invoiceDataToSend);

    if (response.data?.success) {
      const savedInvoice = response.data.data;
      setInvoiceData(prev => [savedInvoice, ...prev]);
      alert("Invoice created successfully!");
      closeInvoiceModal();
      fetchUserInvoices(currentUser._id);
    }
  } catch (error) {
    alert(`Failed to save invoice: ${error.response?.data?.message || error.message}`);
  }
};


  // 🔹 Export Functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredInvoices.map(invoice => ({
        "Invoice Number": invoice.invoiceNumber,
        Date: formatDate(invoice.date),
        "Customer Name": invoice.customerName,
        Email: invoice.email,
        Phone: invoice.phone,
        Subscription: invoice.subscription,
        "Due Date": formatDate(invoice.endDate || calculateEndDate(invoice.startDate, invoice.products?.[0]?.duration)),
        "Renewal Due In": calculateDaysRemaining(invoice.startDate, invoice.products?.[0]?.duration, invoice.endDate),
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
    html2pdf().from(element).save("renewal_reminders.pdf");
  };

  if (loading) return (
    <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border"></div>
    </div>
  );

  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div>
      <style>{`
        .page-header { font-size: 34px; font-weight: 700; color: #1e6be6; margin-bottom: 18px; }
        .purple-thead th { background: #d6b3ff !important; font-weight: 700; color: #2b1b39; }
        .action-circle { width: 34px; height: 34px; display: inline-flex; align-items: center; 
          justify-content: center; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08); background: #fff; }
        .table thead th { position: sticky; top: 0; z-index: 2; }
        .card-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .invoice-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; border-left: 4px solid #ff9800; }
        .renewal-badge { background: linear-gradient(45deg, #ff9800, #ff5722); color: white; 
          padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .urgent-renewal { border-left: 4px solid #f44336; background: #fff8e1; }
      `}</style>

      <Navbar />

      <div className="container p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="page-header m-0">Renewal Reminders</h2>
          
          <div className="d-flex align-items-center gap-2">
            <div className="input-group me-2" style={{ maxWidth: "250px" }}>
              <span className="input-group-text bg-white">
                <i className="bi bi-search"></i>
              </span>
              <input type="text" className="form-control" placeholder="Search renewal invoices..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Button variant={viewMode === "table" ? "primary" : "outline-primary"}
              onClick={() => setViewMode("table")}>
              <i className="bi bi-table me-1"></i>
            </Button>

            <Button variant={viewMode === "card" ? "primary" : "outline-primary"}
              onClick={() => setViewMode("card")}>
              <i className="bi bi-grid-3x3-gap me-1"></i>
            </Button>

            <Dropdown>
              <Dropdown.Toggle variant="warning">Export</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToExcel}>Export to Excel</Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}>Export to PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className="invoices-container p-0">
          {viewMode === "table" ? (
            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
              <table id="invoicesTable" className="table table-bordered table-hover shadow-sm mb-0">
                <thead className="text-center purple-thead">
                  <tr>
                    {["S.No", "Date", "Invoice No", "Client Name", "Product Purchased", "Price", 
                      "Subscription Plan", "Renewal Due In", "Status", "Action"].map((header, idx) => (
                      <th key={idx} style={{ position: "sticky", top: 0 }}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody className="align-middle text-center">
                  {filteredInvoices.map((invoice, index) => (
                    <tr key={invoice._id} className={calculateDaysRemaining(invoice.endDate) === 'Due Today' ? 'table-warning' : ''}>
                      <td>{index + 1}</td>
                      <td>{formatDate(invoice.date)}</td>
                      <td>{invoice.invoiceNumber || `LC-${String(index + 1).padStart(3, "0")}`}</td>
                      <td>{invoice.customerName || "-"}</td>
                      <td style={{ textAlign: "left" }}>
                        {invoice.products?.map((p, i) => (
                          <div key={i}>{p.productName} {p.duration && `(${p.duration})`} <small className="text-muted">x{p.quantity}</small></div>
                        )) || <span className="text-muted">No products</span>}
                      </td>
                      <td>₹{invoice.totalAmount ?? invoice.products?.reduce((s,p) => s + ((parseFloat(p.price)||0) * (parseInt(p.quantity)||1)),0)}</td>
                      <td><span className="badge bg-info">{invoice.subscription || "Yearly"}</span></td>
                      <td><span className="renewal-badge">{calculateDaysRemaining(invoice.endDate)}</span></td>
                      <td>
  {(() => {
    const daysRemaining = calculateDaysRemaining(invoice.endDate);
    return daysRemaining === "Due Today" || daysRemaining.startsWith("-")
      ? <span className="badge bg-danger">Deactivated</span>
      : <span className="badge bg-success">Activated</span>;
  })()}
</td>

                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <Button variant="outline-info" className="action-circle" 
                            onClick={() => handleEdit(invoice)} title="Renew Subscription">
                            <i className="bi bi-arrow-clockwise"></i>
                          </Button>
                          <Button variant="outline-info" className="action-circle" 
                            onClick={() => viewRenewalHistory(invoice)} title="View Renewal History">
                            <i className="bi bi-clock-history"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-view-container" style={{ maxHeight: "520px", overflowY: "auto", padding: "20px" }}>
              <div className="card-view">
                {filteredInvoices.map((invoice, index) => (
                  <div key={invoice._id} className={`invoice-card ${calculateDaysRemaining(invoice.endDate) === 'Due Today' ? 'urgent-renewal' : ''}`}>
                    <div className="card-header">
                      <div>
                        <h6 className="mb-1 fw-bold text-primary">{invoice.customerName || "-"}</h6>
                        <small className="text-muted">Invoice: {invoice.invoiceNumber || ''}</small>
                      </div>
                      <div className="card-actions">
                        <Button variant="light" className="action-circle" onClick={() => handleEdit(invoice)}>
                          <i className="bi bi-arrow-clockwise"></i>
                        </Button>
                        <Button variant="outline-info" className="action-circle" onClick={() => viewRenewalHistory(invoice)}>
                          <i className="bi bi-clock-history"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      {[
                        ["Date:", formatDate(invoice.date)],
                        ["Email:", invoice.email || "-"],
                        ["Phone:", invoice.phone || "-"],
                        ["Subscription:", <span className="badge bg-info">{invoice.subscription || "Yearly"}</span>],
                        ["Due Date:", formatDate(invoice.endDate)],
                        ["Renewal Due:", <span className="renewal-badge">{calculateDaysRemaining(invoice.endDate)}</span>],
                        ["Total Amount:", <span className="fw-bold text-success">₹{invoice.totalAmount}</span>]
                      ].map(([label, value], idx) => (
                        <div key={idx} className="card-field">
                          <span className="field-label">{label}</span>
                          <span className="field-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <div className="modal fade" ref={invoiceModalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{editMode ? "New Invoice" : "Create New Invoice"}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={closeInvoiceModal}></button>
            </div>
            <div className="modal-body">
              {/* Form fields remain the same but more compact */}
              <div className="row">
                {[
                  { label: "Date *", name: "date", type: "date", col: 6 },
                  { label: "Email *", name: "email", type: "email", col: 6 },
                  { label: "Company", name: "company", type: "text", col: 6 },
                  { label: "Customer Name *", name: "customerName", type: "text", col: 6 },
                  { label: "Phone *", name: "phone", type: "text", col: 6 },
                  { label: "Subscription *", name: "subscription", type: "text", col: 6 },
                  { label: "Start Date *", name: "startDate", type: "date", col: 6 },
                  { label: "Due Date *", name: "endDate", type: "date", col: 6 }
                ].map((field, idx) => (
                  <div key={idx} className={`col-md-${field.col}`}>
                    <div className="mb-3">
                      <label className="form-label">{field.label}</label>
                      <input type={field.type} className="form-control" name={field.name} 
                        value={formData[field.name]} onChange={handleInputChange} required={field.label.includes('*')} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="form-label">Address *</label>
                <textarea className="form-control" name="address" value={formData.address} 
                  onChange={handleInputChange} required></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select className="form-select" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                  {["Cash", "Card", "UPI", "Bank Transfer"].map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
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
                        <select className="form-select" value={product.productId}
                          onChange={(e) => handleProductChange(index, "productId", e.target.value)}>
                          <option value="">Select Product</option>
                          {userProducts.map(prod => (
                            <option key={prod._id} value={prod._id}>{prod.name} - ₹{prod.price}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Quantity</label>
                        <input type="number" className="form-control" value={product.quantity}
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)} min="1" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Price (₹) *</label>
                        <input type="number" className="form-control" value={product.price}
                          onChange={(e) => handleProductChange(index, "price", e.target.value)} step="0.01" required />
                      </div>
                      <div className="col-md-1 d-flex align-items-end">
                        {formData.products.length > 1 && (
                          <button type="button" className="btn btn-sm btn-outline-danger" 
                            onClick={() => removeProductRow(index)}>×</button>
                        )}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-12">
                        <label className="form-label">Duration</label>
                        <input type="text" className="form-control" value={product.duration}
                          onChange={(e) => handleProductChange(index, "duration", e.target.value)}
                          placeholder="e.g., 1 Year, 6 Months" />
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
              <button type="button" className="btn btn-secondary" onClick={closeInvoiceModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                {editMode ? "Save Invoice" : "Save Invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal History Modal */}
<div className="modal fade" ref={historyModalRef} tabIndex="-1">
  <div className="modal-dialog modal-lg modal-dialog-centered"> {/* Added modal-dialog-centered */}
    <div className="modal-content">
      <div className="modal-header bg-info text-white">
        <h5 className="modal-title">
          Renewal History {selectedCustomerName && (
            <span className="fw-normal text-light">— {selectedCustomerName}</span>
          )}
        </h5>
        <button type="button" className="btn-close btn-close-white" onClick={closeHistoryModal}></button>
      </div>
      <div className="modal-body">
        {historyLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2">Loading renewal history...</p>
          </div>
        ) : renewalHistory.length > 0 ? (
          <div className="history-table-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="table table-bordered">
              <thead className="table-secondary">
                <tr>
                  {[ "S.No", "Invoice No", "Date",  "Product Name", "Subscription","Amount"].map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renewalHistory.map((renewal, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{renewal.invoiceNumber}</td>
                    <td>{formatDate(renewal.renewalDate)}</td>
                    <td>{renewal.productName || "Maintenance Contract"}</td>
                    <td>{renewal.subscriptionDetails || renewal.duration || "1 Year"}</td>
                    <td>₹{renewal.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            <p>No renewal history found.</p>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={closeHistoryModal}>Close</button>
      </div>
    </div>
  </div>
</div>


      <Footer />
    </div>
  );
}

export default MaintenanceUpdateHistoryPage;


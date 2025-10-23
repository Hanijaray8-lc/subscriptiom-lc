import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Modal } from "bootstrap";
import axios from "axios";
import { Button } from "react-bootstrap";
import Navbar from "./Navbar";
import Footer from "./Footer";
import html2pdf from "html2pdf.js";
import { QRCodeSVG } from "qrcode.react";

function MaintenanceHistoryPage() {
  const [invoiceData, setInvoiceData] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);

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
    endDate: "",
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
  const billModalRef = useRef(null);

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
      if (!userId || userId.length !== 24) {
        setError("Invalid user ID");
        return;
      }

      const response = await axios.get(PRODUCTS_API_URL, {
        params: { owner: userId },
      });

      setUserProducts(response.data || []);
    } catch (err) {
      console.error("Error fetching user products:", err);
      setError(
        "Failed to fetch products: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const fetchUserInvoices = async (userId) => {
    if (!userId) {
      setError("Invalid user ID");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${INVOICE_API_URL}?owner=${userId}`);
      const userInvoices = response.data?.data || [];
      
      // Ensure dates are properly formatted for display
      const formattedInvoices = userInvoices.map(invoice => ({
        ...invoice,
        _id: invoice._id || invoice.id, 
        date: formatDateForDisplay(invoice.date),
        startDate: formatDateForDisplay(invoice.startDate),
        dueDate: formatDateForDisplay(invoice.dueDate)
      }));
      
      setInvoiceData(formattedInvoices);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};


  // Format date for backend (ISO string)
  const formatDateForBackend = (dateString) => {
    if (!dateString) return new Date().toISOString();
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return new Date().toISOString();
      
      return date.toISOString();
    } catch (error) {
      console.error("Error formatting date for backend:", error);
      return new Date().toISOString();
    }
  };

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
        price: selectedProduct
          ? selectedProduct.price
          : updatedProducts[index].price,
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

  const openBillModal = () => {
    if (billModalRef.current) {
      const modal = new Modal(billModalRef.current, { backdrop: true });
      modal.show();
    }
  };

  const closeBillModal = () => {
    if (billModalRef.current) {
      const modal = Modal.getInstance(billModalRef.current);
      if (modal) modal.hide();
    }
  };

  const handleEdit = (invoice) => {
  setEditMode(true);
  setEditInvoiceId(invoice._id);

  setFormData({
    date: invoice.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    email: invoice.email || "",
    company: invoice.company || "",
    customerName: invoice.customerName || "",
    phone: invoice.phone || "",
    address: invoice.address || "",
    subscription: invoice.subscription || "",
    startDate: invoice.startDate?.split("T")[0] || "",
    paymentMethod: invoice.paymentMethod || "Cash",
    endDate: invoice.endDate?.split("T")[0] || "",
    products: invoice.products?.map(p => ({
      productId: p.productId || "",
      productName: p.productName || "",
      duration: p.duration || "",
      price: p.price || "",
      quantity: p.quantity || 1,
    })) || [{ productId: "", productName: "", duration: "", price: "", quantity: 1 }],
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
      alert(
        `Failed to delete invoice: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSave = async () => {
  try {
    if (!currentUser?._id) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    const invoiceDataToSend = {
      owner: currentUser._id,
      customerName: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      company: formData.company,
      subscription: formData.subscription,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(), 
      date: new Date(formData.date).toISOString(),
      paymentMethod: formData.paymentMethod || "Cash",
      products: formData.products.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        price: parseFloat(p.price) || 0,
        quantity: parseInt(p.quantity) || 1,
        duration: p.duration || "",
      })),
      totalAmount: calculateTotal(),
    };

    if (editMode && editInvoiceId) {
  await axios.put(
    `${INVOICE_API_URL}/${editInvoiceId}`,
    invoiceDataToSend
  );
} else {
  await axios.post(
    INVOICE_API_URL,
    invoiceDataToSend
  );
}

// Refresh invoices after save
await fetchUserInvoices(currentUser._id);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      email: "",
      company: "",
      customerName: "",
      phone: "",
      address: "",
      subscription: "",
      startDate: "",
      endDate: "",
      paymentMethod: "Cash",
      products: [{ productId: "", productName: "", duration: "", price: "", quantity: 1 }],
    });
    setEditMode(false);
    setEditInvoiceId(null);
    closeInvoiceModal();
  } catch (error) {
    console.error("Error saving invoice:", error);
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
      endDate: "",
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

  // Save and print
  const handleSaveAndPrint = async () => {
    await handleSave();
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const viewBill = (invoice) => {
    setCurrentBill(invoice);
    setTimeout(openBillModal, 100);
  };

  const printBill = () => {
    const printContent = document.getElementById("billPreview").innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border"></div>
      </div>
    );
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

 const generateQRCode = (invoice) => {
  if (!invoice) return null;

  const payload = {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    dueDate: invoice.endDate,
    customerName: invoice.customerName,
    company: invoice.company,
    products: invoice.products.map((p) => ({
      name: p.productName,
      qty: p.quantity,
      price: p.price,
      duration: p.duration,
    })),
    totalAmount: invoice.totalAmount,
  };

  return (
    <div className="text-center">
      <QRCodeSVG
        value={JSON.stringify(payload)}
        size={150}
        level="H"
      />
      <p className="mt-2 small text-muted">Scan to view invoice details</p>
    </div>
  );
};

  const downloadPDF = () => {
    const element = document.getElementById("billPreview");
    const options = {
      margin: 0.5,
      filename: `Invoice_${currentBill?.invoiceNumber || "Bill"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(options).from(element).save();
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
      <Navbar />
      <div className="container p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold text-primary m-0">Invoice Management</h2>
          <Button variant="success" onClick={openInvoiceModal}>
            ➕ Generate Invoice
          </Button>
        </div>

        <div className="p-0">
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-bordered table-hover shadow-sm">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>S.No</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Date</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Name</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Email</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Phone</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Product</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Subscription</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Due Date</th>
                  {/* <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Amount</th> */}
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Bill</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.map((invoice, index) => (
                  <tr key={invoice._id || index} className="text-center align-middle">
                    <td>{index + 1}</td>
                    <td>{invoice.date || "N/A"}</td>
                    <td>{invoice.customerName}</td>
                    <td>{invoice.email}</td>
                    <td>{invoice.phone}</td>
                    <td>
                      {invoice.products && invoice.products.length > 0 ? (
                        <ul className="mb-0">
                          {invoice.products.map((p, i) => (
                            <li key={i}>
                              {p.productName} (x{p.quantity}) – ₹{p.price}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">No products</span>
                      )}
                    </td>
                    <td>
                      {invoice.subscription ? (
                        <span >{invoice.subscription}</span>
                      ) : (
                        <span className="text-muted">Not specified</span>
                      )}
                    </td>
                    <td>
                      {invoice.endDate === "N/A" ? (
                        <span className="text-muted">N/A</span>
                      ) : (
                        <span className={`badge ${new Date(invoice.endDate) > new Date() ? "bg-success" : "bg-danger"}`}>
                          {new Date(invoice.endDate).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </td>
                    {/* <td>₹{invoice.totalAmount}</td> */}
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => viewBill(invoice)}>
                        View Bill
                      </button>
                    </td>
                    <td>
                      <div className="d-flex justify-content-between">
                        <Button variant="outline-warning" size="sm" onClick={() => handleEdit(invoice)}>
                          Edit
                        </Button>
                        <Button
  variant="outline-danger"
  size="sm"
  onClick={() => {
    if (!invoice._id) {
      alert("Invoice ID is missing. Cannot delete this invoice.");
      return;
    }
    handleDelete(invoice._id);
  }}
>
  Delete
</Button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <div className="modal fade" ref={invoiceModalRef} id="invoiceModal" tabIndex="-1" aria-labelledby="invoiceModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title" id="invoiceModalLabel">
                {editMode ? 'Edit Invoice' : 'Generate New Invoice'}
              </h5>
              <button type="button" className="btn-close" onClick={closeInvoiceModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Company Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="border-top pt-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">Product Details</h6>
                  <button type="button" className="btn btn-sm btn-success" onClick={addProductRow}>
                    + Add Product
                  </button>
                </div>
                
                {formData.products.map((product, index) => (
                  <div key={index} className="product-row border-bottom pb-3 mb-3">
                    <div className="row">
                      <div className="col-md-5 mb-3">
                        <label className="form-label">Product *</label>
                        <select 
                          className="form-select" 
                          value={product.productId}
                          onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {userProducts.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Duration</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. 12 months"
                          value={product.duration}
                          onChange={(e) => handleProductChange(index, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">Qty</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label">Price *</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={product.price}
                            onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    {formData.products.length > 1 && (
                      <div className="text-end">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-danger"
                          onClick={() => removeProductRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="row mt-3">
                  <div className="col-md-6 offset-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title fw-bold">Total Amount: ₹{calculateTotal()}</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
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
                <div className="col-md-6 mb-3">
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

              <div className="row">
                <div className="col-md-6 mb-3">
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
                <div className="col-md-6 mb-3">
                  <label className="form-label">Address *</label>
                  <textarea 
                    className="form-control" 
                    rows="1"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Subscription *</label>
                  <select 
                    className="form-select" 
                    name="subscription"
                    value={formData.subscription}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select Subscription --</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-select" 
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
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
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeInvoiceModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="btn btn-success" onClick={handleSaveAndPrint}>
                Save & Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Modal */}
      <div className="modal fade" ref={billModalRef} id="billModal" tabIndex="-1" aria-labelledby="billModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title" id="billModalLabel">Invoice Preview</h5>
              <button type="button" className="btn-close" onClick={closeBillModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {currentBill && (
                <div id="billPreview" className="p-4 border rounded bg-white">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      {currentUser?.companyLogo && (
                        <img
                          src={currentUser.companyLogo}
                          alt="Company Logo"
                          style={{ width: "80px", height: "80px", objectFit: "contain" }}
                          className="me-3"
                        />
                      )}
                      <div>
                        <h4 className="fw-bold text-primary mb-0">
                          {currentUser?.company || 'Company Name'}
                        </h4>
                        <small>{currentUser?.companyAddress || 'Company Address'}</small><br/>
                        <small>{currentUser?.email || 'company@email.com'}</small>
                      </div>
                    </div>

                    <div className="text-end">
                      <h6 className="fw-bold">{currentBill.invoiceNumber}</h6>
                      <p className="mb-1">Date: {formatDateForDisplay(currentBill.date)}</p>
                      <p className="mb-1">Due: <span className="text-danger">{formatDateForDisplay(currentBill.endDate)}</span></p>
                    </div>
                  </div>

                  <hr />

                  <div className="row mb-3">
                    <div className="col-md-8">
                      <h6 className="fw-bold">Billed To:</h6>
                      <p className="mb-1"><strong>Name:</strong> {currentBill.customerName}</p>
                      {/* <p className="mb-1"><strong>Company:</strong> {currentBill.company}</p> */}
                      <p className="mb-1"><strong>Address:</strong> {currentBill.address}</p>
                      <p className="mb-1"><strong>Email:</strong> {currentBill.email}</p>
                      <p className="mb-1"><strong>Ph No:</strong> {currentBill.phone}</p>
                    </div>
                    <div className="col-md-4 text-center d-print-none">
                      {generateQRCode(currentBill)} 
                    </div>
                  </div>

                  <table className="table table-bordered text-center align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>S.No</th>
                        <th>Product</th>
                        <th>Service</th>
                        <th>Plan</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBill.products && currentBill.products.map((p, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{p.productName}</td>
                          <td>{p.duration} (From {currentBill.startDate} to {currentBill.dueDate})</td>
                          <td>{currentBill.subscription}</td>
                          <td>{p.quantity}</td>
                          <td>₹{p.price}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="5" className="fw-bold text-end">Total</td>
                        <td className="fw-bold text-success">₹{currentBill.totalAmount}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-center mt-3">
                    <p className="mb-1">Thank you for your business!</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeBillModal}>Close</button>
              <button type="button" className="btn btn-primary" onClick={printBill}>Print</button>
              <button type="button" className="btn btn-success" onClick={downloadPDF}>Download PDF</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default MaintenanceHistoryPage;
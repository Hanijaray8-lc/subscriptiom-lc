import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Row,
  Col,
  Card,
  Form,
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";

const InvoiceTable = () => {
  const [show, setShow] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);

  // 🔹 Invoice list from backend
  const [invoices, setInvoices] = useState([]);

  const invoiceRef = useRef();

  // 🔹 Form Data State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    name: "",
    phone: "",
    email: "",
    company: "",
    address: "",
    product: "",
    subscription: "",
    duration: "",
    startDate: "",
    endDate: "",
    price: "",
    paymentMethod: "",
  });

  // 🔹 Handle form changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Save Invoice
const handleSaveInvoice = async (print = false) => {
  // Basic validation
  if (
    !formData.name ||
    !formData.phone ||
    !formData.email ||
    !formData.product ||
    !formData.subscription ||
    !formData.duration ||
    !formData.startDate ||
    !formData.endDate ||
    !formData.price
  ) {
    alert("⚠️ Please fill all required fields before saving.");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user")); // Get logged-in user
  const newInvoice = {
    date: formData.date,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    company: formData.company,
    address: formData.address,
    product: formData.product,
    subscription: formData.subscription,
    duration: formData.duration,
    startDate: formData.startDate,
    endDate: formData.endDate,
    price: parseFloat(formData.price),
    paymentMethod: formData.paymentMethod,
    invoiceNo: `INV${1000 + invoices.length + 1}`,
    paymentStatus: "Pending",
    invoiceItems: [
      {
        subscription: formData.subscription,
        product: formData.product,
        service: `${formData.duration} (From ${formData.startDate} to ${formData.endDate})`,
        quantity: 1,
        amount: parseFloat(formData.price),
      },
    ],
    createdBy: user?._id, // <-- Add this line
  };

  try {
    const res = await axios.post("https://subscriptiom-lc.onrender.com/api/invoices", newInvoice);
    await fetchInvoices(); // refresh from backend
    setShowForm(false);

    if (print) {
      setSelectedCustomer(res.data);
      setShow(true);
      setTimeout(() => handlePrint(), 300);
    }
  } catch (err) {
    console.error("Error saving invoice:", err);
  }
};


  // 🔹 Fetch invoices from backend
  const fetchInvoices = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) return;
    try {
      const response = await axios.get(`https://subscriptiom-lc.onrender.com/api/invoices?userId=${user._id}`);
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
  fetchInvoices();
  }, []);

const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchInvoices();
    fetchProducts(parsedUser._id); // Pass userId to fetchProducts
  }
}, []);

// Update fetchProducts to accept userId
const fetchProducts = async (userId) => {
  if (!userId) return;
  try {
    const res = await axios.get(`https://subscriptiom-lc.onrender.com/api/products?userId=${userId}`);
    setProducts(res.data);
  } catch (err) {
    console.error("Error fetching products:", err);
  }
};


  // 📌 Show invoice
  const handleShowInvoice = (customer) => {
    setSelectedCustomer(customer);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setSelectedCustomer(null);
  };

  // 📌 Print Invoice
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice_${selectedCustomer?.invoiceNo}`,
  });

  // 📌 Download PDF
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${selectedCustomer?.invoiceNo}.pdf`);
  };

  // 📌 Helper - calculate totals
  const calculateTotal = (cust) =>
    cust ? cust.invoiceItems.reduce((sum, item) => sum + item.amount, 0) : 0;

  // 📌 Share Invoice (mobile supported)
  const handleShare = async () => {
    if (!selectedCustomer) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${selectedCustomer.invoiceNo}`,
          text: `Invoice Amount: ₹${calculateTotal(selectedCustomer)}\nCustomer: ${selectedCustomer.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing is not supported on this browser. Please use mobile.");
    }
  };

  // Add Edit/Delete state
const [editModal, setEditModal] = useState(false);
const [editInvoice, setEditInvoice] = useState(null);

// Edit handler: open modal with invoice data
const handleEditInvoice = (invoice) => {
  setEditInvoice({ ...invoice });
  setEditModal(true);
};

// Save edited invoice to backend
const handleSaveEditInvoice = async (print = false) => {
  if (!editInvoice) return;
  try {
    const res = await axios.put(
      `https://subscriptiom-lc.onrender.com/api/invoices/${editInvoice._id}`,
      editInvoice
    );
    await fetchInvoices();
    setEditModal(false);

    if (print) {
      setSelectedCustomer(res.data); // set updated invoice to preview
      setShow(true); // open invoice modal
      setTimeout(() => handlePrint(), 300); // auto-print
    }

    setEditInvoice(null);
  } catch (err) {
    alert("Error updating invoice");
  }
};

// Delete invoice
const handleDeleteInvoice = async (id) => {
  if (!window.confirm("Are you sure you want to delete this invoice?")) return;
  try {
    await axios.delete(`https://subscriptiom-lc.onrender.com/api/invoices/${id}`);
    await fetchInvoices();
  } catch (err) {
    alert("Error deleting invoice");
  }
};

const qrValue = selectedCustomer
  ? `
Invoice No: ${selectedCustomer.invoiceNo}
Date: ${selectedCustomer.date}
Due Date: ${selectedCustomer.endDate}
Customer: ${selectedCustomer.name}
Email: ${selectedCustomer.email}
Phone: ${selectedCustomer.phone}
Product: ${selectedCustomer.product}
Service: ${selectedCustomer.duration}
Plan: ${selectedCustomer.subscription}
Amount: ₹${calculateTotal(selectedCustomer)}
  `
  : "";



  return (
    <>
    <Navbar />
    <Container className="mt-4">
      {/* 🔹 Title + Button Row */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold text-primary m-0">
            Invoice Management
          </h2>

          <Button variant="success" onClick={() => setShowForm(true)}>
            ➕ Generate Invoice
          </Button>
        </div>

      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
  <table className="table table-bordered table-hover shadow-sm">
    <thead className="table-light text-center">
      <tr>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>S.No</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Date</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Customer Name</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Email</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Phone</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Product</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Subscription</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Due Date</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Bill</th>
        <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {invoices.map((cust, index) => (
        <tr key={cust._id} className="text-center align-middle">
          <td>{index + 1}</td>
          <td>{cust.date}</td>
          <td>{cust.name}</td>
          <td>{cust.email}</td>
          <td>{cust.phone}</td>
          <td>{cust.product}</td>
          <td>{cust.subscription}</td>
          <td className="fw-bold text-danger">{cust.endDate || "N/A"}</td>
          <td>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleShowInvoice(cust)}
            >
              View Bill
            </Button>
          </td>
          <td>
            <Button
              variant="outline-warning"
              size="sm"
              className="me-2"
              onClick={() => handleEditInvoice(cust)}
            >
              Edit
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDeleteInvoice(cust._id)}
            >
              Delete
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* 🔹 New Invoice Form Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate New Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Customer Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Product</Form.Label>
                  <Form.Select
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                  >
                    <option value="" hidden disabled>-- Select Product --</option>
                    {products.map((prod) => (
                      <option key={prod._id} value={prod.name}>
                        {prod.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

              </Col>
              <Col md={6}>
              <Form.Group>
                <Form.Label>Subscription</Form.Label>
                <Form.Select
                  name="subscription"
                  value={formData.subscription}
                  onChange={handleChange}
                >
                  <option value="" hidden disabled>
                    -- Select Subscription --
                  </option>
                  <option value="Yearly">Yearly</option>
                  <option value="Monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 12 months"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Netbanking</option>
                    <option>Cards</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSaveInvoice(false)}>
            💾 Save
          </Button>
          <Button variant="success" onClick={() => handleSaveInvoice(true)}>
            💾 Save & Print
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🔹 Edit Invoice Modal */}
      <Modal show={editModal} onHide={() => setEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editInvoice && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={editInvoice.date}
                      onChange={e => setEditInvoice({ ...editInvoice, date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Customer Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editInvoice.name}
                      onChange={e => setEditInvoice({ ...editInvoice, name: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editInvoice.email}
                      onChange={e => setEditInvoice({ ...editInvoice, email: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={editInvoice.phone}
                      onChange={e => setEditInvoice({ ...editInvoice, phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Company</Form.Label>
                    <Form.Control
                      type="text"
                      name="company"
                      value={editInvoice.company}
                      onChange={e => setEditInvoice({ ...editInvoice, company: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={editInvoice.address}
                      onChange={e => setEditInvoice({ ...editInvoice, address: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Product</Form.Label>
                    <Form.Select
                      name="product"
                      value={editInvoice.product}
                      onChange={e => setEditInvoice({ ...editInvoice, product: e.target.value })}
                    >
                      <option value="" hidden disabled>-- Select Product --</option>
                      {products.map((prod) => (
                        <option key={prod._id} value={prod.name}>
                          {prod.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Subscription</Form.Label>
                    <Form.Select
                      name="subscription"
                      value={editInvoice.subscription}
                      onChange={e => setEditInvoice({ ...editInvoice, subscription: e.target.value })}
                    >
                      <option value="" hidden disabled>
                        -- Select Subscription --
                      </option>
                      <option value="Yearly">Yearly</option>
                      <option value="Monthly">Monthly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      name="duration"
                      value={editInvoice.duration}
                      onChange={e => setEditInvoice({ ...editInvoice, duration: e.target.value })}
                      placeholder="e.g. 12 months"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={editInvoice.startDate}
                      onChange={e => setEditInvoice({ ...editInvoice, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={editInvoice.endDate}
                      onChange={e => setEditInvoice({ ...editInvoice, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Price</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={editInvoice.price}
                      onChange={e => setEditInvoice({ ...editInvoice, price: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Payment Method</Form.Label>
                    <Form.Select
                      name="paymentMethod"
                      value={editInvoice.paymentMethod}
                      onChange={e => setEditInvoice({ ...editInvoice, paymentMethod: e.target.value })}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Netbanking</option>
                      <option>Cards</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
  <Button variant="secondary" onClick={() => setEditModal(false)}>
    Cancel
  </Button>
  <Button variant="primary" onClick={() => handleSaveEditInvoice(false)}>
    Save Changes
  </Button>
  <Button variant="success" onClick={() => handleSaveEditInvoice(true)}>
    Save & Print
  </Button>
</Modal.Footer>
      </Modal>

      {/* 🔹 Invoice Modal */}
      <Modal show={show} onHide={handleClose} size="lg" centered>
  <Modal.Body>
    {selectedCustomer && (
      <Card ref={invoiceRef} className="p-3 border-0 ">

        {/* Header */}
        <Row className="border-bottom pb-2 mb-3 align-items-center justify-content-between">
          {/* Left side: Logo + Company Info */}
          <Col xs="auto" className="d-flex align-items-center">
            {user?.companyLogo && (
              <img
                src={user.companyLogo}
                alt="Company Logo"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
                className="me-3"
              />
            )}
            <div>
              <h4 className="fw-bold text-primary mb-1">{user?.company || "Company Name"}</h4>
              <p className="small mb-0 text-muted">{user?.companyAddress || "Company Address"}</p>
              <p className="small mb-0 text-muted">{user?.email || "support@company.com"}</p>
            </div>
          </Col>

          {/* Right side: Invoice Info */}
          <Col xs="auto" className="text-end">
            <h6 className="fw-bold mb-1">Invoice #{selectedCustomer.invoiceNo}</h6>
            <small>Date: {selectedCustomer.date}</small>
            <br />
            <small>
              Due: <span className="text-danger">{selectedCustomer.endDate || "N/A"}</span>
            </small>
          </Col>
        </Row>

        {/* Customer Info + QR */}
        <Row className="mb-3 align-items-start">
          <Col md={8}>
            <h6 className="fw-bold">Billed To:</h6>
            <p className="mb-0"><strong>Name:</strong> {selectedCustomer.name}</p>
            <p className="mb-0"><strong>Company:</strong> {selectedCustomer.company}</p>
            <p className="mb-0"><strong>Address:</strong> {selectedCustomer.address}</p>
            <p className="mb-0"><strong>Email:</strong> <span className="text-muted">{selectedCustomer.email}</span></p>
            <p className="mb-0"><strong>Ph No:</strong> <span className="text-muted">{selectedCustomer.phone}</span></p>
          </Col>

          {/* QR placed on right side above table */}
          <Col md={4} className="text-end">
            <QRCodeSVG value={qrValue} size={120} />
            <div className="mt-1 small text-muted">Scan for Details</div>
          </Col>
        </Row>

        {/* Items Table */}
        <Table bordered hover responsive size="sm" className="mb-0">
          <thead className="table-secondary text-center">
            <tr>
              <th>S.No</th>
              <th>Product</th>
              <th>Service</th>
              <th>Plan</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {selectedCustomer.invoiceItems.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.product}</td>
                <td>{item.service}</td>
                <td>{item.subscription}</td>
                <td>{item.quantity}</td>
                <td>₹{item.amount}</td>
              </tr>
            ))}
            <tr className="fw-bold bg-light">
              <td colSpan="5" className="text-end">
                Total
              </td>
              <td className="text-success">
                ₹{calculateTotal(selectedCustomer)}
              </td>
            </tr>
          </tbody>
        </Table>

        {/* Footer */}
        <Row className="text-center mt-3">
          <p className="mb-0 small text-muted">
            Thank you for your business!
          </p>
        </Row>
      </Card>
    )}
  </Modal.Body>
  <Modal.Footer className="justify-content-center">
    <Button variant="outline-primary" onClick={handleDownloadPDF}>
      📄 Download PDF
    </Button>
    <Button variant="danger" onClick={handleClose}>
      Close
    </Button>
  </Modal.Footer>
</Modal>

    </Container>

    <Footer />
    </>
  );
};

export default InvoiceTable;


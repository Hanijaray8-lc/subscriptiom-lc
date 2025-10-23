import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Form, Nav } from "react-bootstrap";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import Navbar from "./Navbar";
import Footer from "./Footer";

// -------------------- InvoiceForm Component --------------------
const InvoiceForm = ({ showForm, setShowForm, onSave, initialData = {} }) => {
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
  date: new Date().toISOString().split("T")[0],
  name: initialData?.name || "",
  phone: initialData?.phone || "",
  email: initialData?.email || "",
  company: initialData?.company || "",
  address: initialData?.address || "",
  product: initialData?.product || "",
  subscription: initialData?.subscription || "",
  duration: initialData?.duration || "",
  startDate: initialData?.startDate || "",
  endDate: initialData?.endDate || "",
  price: initialData?.price || "",
  paymentMethod: "Cash",
});


  useEffect(() => {
  if (initialData) {
    setFormData({
      _id: initialData._id,  
      date: initialData.date || new Date().toISOString().split("T")[0],
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      company: initialData.company || "",
      address: initialData.address || "",
      product: initialData.product || "",
      subscription: initialData.subscription || "",
      duration: initialData.duration || "",
      startDate: initialData.startDate || "",
      endDate: initialData.endDate || "",
      price: initialData.price || "",
      paymentMethod: initialData.paymentMethod || "Cash",
    });
  }
}, [initialData]);


  // Fetch products from backend
  const fetchProducts = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?._id) return;
  try {
    const res = await axios.get(`https://subscriptiom-lc.onrender.com/api/products?userId=${user._id}`);
    setProducts(res.data);
  } catch (err) {
    console.error("Error fetching products:", err);
  }
};

useEffect(() => {
  fetchProducts();
}, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
  if (!formData.product || !formData.subscription || !formData.duration || !formData.startDate || !formData.endDate || !formData.price) {
    alert("Please fill all required fields");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user")); // Get logged-in user

  try {
    const res = await axios.post("https://subscriptiom-lc.onrender.com/api/invoices", {
  date: formData.date,
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  company: formData.company,
  address: formData.address,
  product: formData.product,
  subscription: formData.subscription,
  duration: formData.duration,
  startDate: formData.startDate,
  endDate: formData.endDate,
  price: parseFloat(formData.price),
  paymentMethod: formData.paymentMethod,
  createdBy: user?._id,
  invoiceItems: [
    {
      subscription: formData.subscription,
      product: formData.product,
      service: `${formData.duration} (From ${formData.startDate} to ${formData.endDate})`,
      quantity: 1,
      amount: parseFloat(formData.price),
    },
  ],
  paymentStatus: "Pending",
});
    alert("New invoice created successfully!");
    if (onSave) onSave(res.data);  
    setShowForm(false);
    console.log("Created invoice:", res.data);
  } catch (err) {
    console.error(err);
    alert("Error creating invoice");
  }
};



  return (
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                   disabled  
                >
                  <option value="" hidden disabled>
                    -- Select Product --
                  </option>
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
        <Button variant="primary" onClick={handleSave}>
          💾 Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// -------------------- PlanTracker Component --------------------
const exportOptions = [
  { label: "Export as PDF", icon: "bi bi-file-earmark-pdf", type: "pdf" },
  // { label: "Export as TXT", icon: "bi bi-file-earmark-text", type: "txt" },
  // { label: "Export as DOCX", icon: "bi bi-file-earmark-word", type: "docx" },
  { label: "Export as Excel", icon: "bi bi-file-earmark-excel", type: "excel" },
];

const shareOptions = [
  { label: "WhatsApp", icon: "bi bi-whatsapp", url: "https://wa.me/?text=Check%20out%20my%20plan%20details!" },
  { label: "Email", icon: "bi bi-envelope-fill", url: "mailto:?subject=Plan%20Details&body=Check%20out%20my%20plan%20details!" },
  { label: "Copy Link", icon: "bi bi-link-45deg", url: "#" },
];

const PlanTracker = () => {
  const [plans, setPlans] = useState([]);
  const [view, setView] = useState("table");
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [user, setUser] = useState(null); // <-- Add user state
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch only invoices for the logged-in user
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(`https://subscriptiom-lc.onrender.com/api/invoices?userId=${user._id}`);
        setPlans(res.data);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, [user]);

  const getRenewalDueDays = (start, end) => {
  if (!start || !end) return null;
  const endDate = new Date(end);
  const today = new Date();
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  return diff; // return numeric days
};


  const filteredPlans = plans.filter(plan => {
    if (!plan.startDate || !plan.endDate) return false;
    const diffDays = parseInt(getRenewalDueDays(plan.startDate, plan.endDate));
    return diffDays <= 7 && diffDays >= 0;
  });

  const exportExcel = () => {
  // Map filteredPlans to only include table columns
  const dataToExport = filteredPlans.map((plan, index) => ({
    "S.No": index + 1,
    "Invoice No": plan.invoiceNo || "-",
    "Client Name": plan.name || "-",
    "Product Purchased": plan.product || "-",
    "Price": plan.price || "-",
    "Subscription Plan": plan.subscription || "-",
    "Renewal Due Days": getRenewalDueDays(plan.startDate, plan.endDate),
    "Status": getRenewalDueDays(plan.startDate, plan.endDate) > 0 ? "Activated" : "Deactivated",
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plans");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "PlanTracker.xlsx");
};


  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Plan Tracker", 14, 14);
    autoTable(doc, {
      head: [["Name", "Date", "Product", "Renewal Due Days", "Price", "Subscription Plan", "Status"]],
      body: filteredPlans.map(plan => [
        plan.name || "-",
        plan.date?.split("T")[0] || "-",
        plan.product || "-",
        getRenewalDueDays(plan.startDate, plan.endDate),
        plan.price || "-",
        plan.subscription || "-",
      ]),
      startY: 22,
    });
    doc.save("PlanTracker.pdf");
  };

  const handleExport = async (type) => {
    if (type === "excel") exportExcel();
    else if (type === "pdf") exportPDF();
    setShowExport(false);
  };

  const handleShare = (option) => {
    if (option.label === "Copy Link") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    } else {
      window.open(option.url, "_blank");
    }
    setShowShare(false);
  };

  const fetchHistory = async (name) => {
    setSelectedCustomer(name); 
    if (!user?._id || !name) return;
    try {
      const res = await axios.get(`https://subscriptiom-lc.onrender.com/api/invoices?userId=${user._id}&name=${encodeURIComponent(name)}`);
      setHistoryData(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistoryData([]);
      setShowHistory(true);
    }
  };

  return (
    <>
    <Navbar />
<div className="bg-white">
  <div className="pt-4">
    <div className="container d-flex align-items-center justify-content-between flex-wrap">
      <h2 className="fw-bold text-primary m-0">
            Renewal and Remainder
          </h2>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        {/* Export Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-outline-primary dropdown-toggle"
            onClick={() => setShowExport(!showExport)}
          >
            <i className="bi bi-box-arrow-up-right me-1"></i> Export
          </button>
          <ul
            className={`dropdown-menu${showExport ? " show" : ""}`}
            style={{ minWidth: 180 }}
          >
            {exportOptions.map((opt) => (
              <li key={opt.type}>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => handleExport(opt.type)}
                >
                  <i className={opt.icon}></i> {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Share Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-outline-success dropdown-toggle"
            onClick={() => setShowShare(!showShare)}
          >
            <i className="bi bi-share-fill me-1"></i> Share
          </button>
          <ul
            className={`dropdown-menu${showShare ? " show" : ""}`}
            style={{ minWidth: 160 }}
          >
            {shareOptions.map((opt) => (
              <li key={opt.label}>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => handleShare(opt)}
                >
                  <i className={opt.icon}></i> {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* View Toggle */}
        <div className="btn-group">
          <button
            className={`btn btn-outline-secondary${
              view === "table" ? " active" : ""
            }`}
            onClick={() => setView("table")}
          >
            <i className="bi bi-table"></i>
          </button>
          <button
            className={`btn btn-outline-secondary${
              view === "card" ? " active" : ""
            }`}
            onClick={() => setView("card")}
          >
            <i className="bi bi-person-badge"></i>
          </button>
        </div>
      </div>
    </div>
  </div>



      <div className="container py-4">
        {/* Table View */}
        {view==="table" && (
          <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-bordered align-middle bg-white">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>S.No</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Date</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Invoice No</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Client Name</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Product Purchased</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Price</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Subscription Plan</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Renewal Due Days</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Status</th>
                  <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Action</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {filteredPlans.map((plan, index) => (
                  <tr key={plan._id}>
                    <td>{index + 1}</td>
                    <td>{plan.date?.split("T")[0] || "-"}</td>
                    <td>{plan.invoiceNo || "-"}</td>
                    <td>{plan.name || "-"}</td>
                    <td>{plan.product || "-"}</td>
                    <td>{plan.price || "-"}</td>
                    <td>{plan.subscription || "-"}</td>
                    <td>{getRenewalDueDays(plan.startDate, plan.endDate)} Days</td>
                    <td>
                      <button className={`btn btn-sm fw-bold px-3 ${getRenewalDueDays(plan.startDate, plan.endDate) > 0 ? "btn-success" : "btn-danger"}`}>
                        {getRenewalDueDays(plan.startDate, plan.endDate) > 0 ? "Activated" : "Deactivated"}
                      </button>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          title="Renew"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowInvoiceForm(true);
                          }}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          title="History"
                          onClick={() => fetchHistory(plan.name)}
                        >
                          <i className="bi bi-clock-history"></i>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card View */}
        {view==="card" && (
          <div className="row g-3"
          style={{ maxHeight: "500px", overflowY: "auto" }}>
            {filteredPlans.map(plan => (
              <div className="col-12 col-md-6 col-lg-4" key={plan._id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h5>{plan.name || "-"}</h5>
                    <p><b>Product:</b> {plan.product || "-"}</p>
                    <p><b>Renewal Due Days:</b> {getRenewalDueDays(plan.startDate, plan.endDate)} Days</p>
                    <p><b>Price:</b> {plan.price || "-"}</p>
                    <p><b>Subscription:</b> {plan.subscription || "-"}</p>
                    <p>
                      <b>Status:</b>{" "}
                      <span className={`badge ${getRenewalDueDays(plan.startDate, plan.endDate) > 0 ? "bg-success" : "bg-danger"}`}>
                        {getRenewalDueDays(plan.startDate, plan.endDate) > 0 ? "Activated" : "Deactivated"}
                      </span>
                    </p>
                    <div className="d-flex gap-2 mt-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowInvoiceForm(true);
                        }}
                      >
                        <i className="bi bi-arrow-repeat"></i> Renew
                      </button>
                         <button
                            className="btn btn-outline-secondary btn-sm"
                            title="History"
                            onClick={() => fetchHistory(plan.name)}
                          >
                            <i className="bi bi-clock-history"></i> History
                          </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        showForm={showInvoiceForm}
        setShowForm={setShowInvoiceForm}
        initialData={selectedPlan}
        onSave={(invoiceData) => {
          console.log("Invoice saved:", invoiceData);
          setShowInvoiceForm(false);
          setPlans(prev => [...prev, invoiceData]);
        }}
      />

      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg" centered>
  <Modal.Header closeButton>
   <Modal.Title>
  {selectedCustomer} – Invoice History ({historyData.length})
</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {historyData.length === 0 ? (
      <p>No history found.</p>
    ) : (
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Product</th>
            <th>Subscription</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {historyData.map((inv, index) => (
            <tr key={inv._id}>
              <td>{index + 1}</td>
              <td>{inv.invoiceNo || "-"}</td>
              <td>{inv.date?.split("T")[0]}</td>
              <td>{inv.product}</td>
              <td>{inv.subscription}</td>
              <td>{inv.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowHistory(false)}>Close</Button>
  </Modal.Footer>
</Modal>

    <Footer />
    </div>
    </>
  );
};

export default PlanTracker;


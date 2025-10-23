import React, { useEffect, useState } from "react";
import { Container, Table, Modal, Button, Row, Col, Form } from "react-bootstrap";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PaymentTracking = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [show, setShow] = useState(false);

  // 🔹 Filters
  const [searchName, setSearchName] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchDate, setSearchDate] = useState(""); 
  const [showExportModal, setShowExportModal] = useState(false);

  // 🔹 Fetch invoices
  const fetchInvoices = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) return;
    try {
      const res = await axios.get(
        `https://subscriptiom-lc.onrender.com/api/invoices?userId=${user._id}`
      );
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // 🔹 Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invoiceDate = new Date(inv.date);

    // name filter
    if (searchName && !inv.name.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }

    // product filter
    if (
      searchProduct &&
      !inv.product.toLowerCase().includes(searchProduct.toLowerCase())
    ) {
      return false;
    }

    // month filter (yyyy-mm)
    if (searchMonth) {
      const invMonth = invoiceDate.toISOString().slice(0, 7);
      if (invMonth !== searchMonth) return false;
    }

    // single date filter
    if (searchDate) {
      const invDateStr = invoiceDate.toISOString().split("T")[0];
      if (invDateStr !== searchDate) return false;
    }

    return true;
  });

  // 🔹 Calculate total
  const calculateTotal = (list) =>
    list.reduce(
      (sum, inv) =>
        sum +
        inv.invoiceItems.reduce((itemSum, item) => itemSum + item.amount, 0),
      0
    );

  // 🔹 Show invoices for a single customer
  const handleShowCustomer = (custName) => {
    const custInvoices = invoices.filter((inv) => inv.name === custName);
    setCustomerInvoices(custInvoices);
    setSelectedCustomer(custName);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setCustomerInvoices([]);
    setSelectedCustomer(null);
  };

  // 🔹 Export filtered invoices to Excel
  const exportToExcel = () => {
    const data = filteredInvoices.map((inv, i) => ({
      "S.No": i + 1,
      "Invoice No": inv.invoiceNo,
      Date: inv.date,
      "Customer Name": inv.name,
      Product: inv.product,
      Subscription: inv.subscription,
      Amount: inv.invoiceItems.reduce((sum, item) => sum + item.amount, 0),
    }));

    // Add total row
    data.push({
      "S.No": "",
      "Invoice No": "",
      Date: "",
      "Customer Name": "",
      Product: "",
      Subscription: "Total",
      Amount: calculateTotal(filteredInvoices),
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Invoices.xlsx");
  };

  return (
    <>
      <Navbar />
      <Container className="mt-4">
        <h2 className="fw-bold text-primary mb-3">Payment Tracking</h2>

        {/* 🔹 Search & Filter */}
        <Row className="mb-3 g-2">
        <Col>
            <Form.Control
            type="text"
            placeholder="Search by Customer Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            />
        </Col>
        <Col>
            <Form.Control
            type="text"
            placeholder="Search by Product"
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            />
        </Col>
        <Col>
            <Form.Select
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
            >
            <option value="">Search by Month</option>
            {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, "0");
                return (
                <option key={i} value={`2025-${month}`}>
                    {new Date(2025, i).toLocaleString("default", { month: "long" })}
                </option>
                );
            })}
            </Form.Select>
        </Col>
        <Col>
            <Form.Control
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            />
        </Col>
        <Col>
            <Button className="w-100" onClick={() => setShowExportModal(true)}>
                Export to Excel
            </Button>
            </Col>
        </Row>        
        {/* 🔹 Filtered Invoices Table */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className="table table-bordered table-hover shadow-sm">
            <thead className="table-light text-center">
              <tr>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>S.No</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Invoice No</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Date</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Customer Name</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Product</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Subscription</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Amount</th>
                <th style={{ position: "sticky", top: 0, background: "#d6b3ff", zIndex: 2 }}>Action</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {filteredInvoices.map((inv, i) => (
                <tr
                  key={inv._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleShowCustomer(inv.name)}
                >
                  <td>{i + 1}</td>
                  <td>{inv.invoiceNo}</td>
                  <td>{inv.date}</td>
                  <td className="fw-bold text-primary">{inv.name}</td>
                  <td>{inv.product}</td>
                  <td>{inv.subscription}</td>
                  <td className="fw-bold text-success">
                    ₹{inv.invoiceItems.reduce((sum, item) => sum + item.amount, 0)}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleShowCustomer(inv.name)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Total Income of Filtered */}
        <h5 className="text-end mt-3">
          Total Income:{" "}
          <span className="fw-bold text-success">
            ₹{calculateTotal(filteredInvoices)}
          </span>
        </h5>
      </Container>

      {/* 🔹 Modal for customer invoices */}
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCustomer} – Invoice History ({customerInvoices.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table bordered hover responsive>
            <thead className="table-secondary text-center">
              <tr>
                <th>S.No</th>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Product</th>
                <th>Subscription</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {customerInvoices.map((inv, idx) => (
                <tr key={inv._id}>
                  <td>{idx + 1}</td>
                  <td>{inv.invoiceNo}</td>
                  <td>{inv.date}</td>
                  <td>{inv.product}</td>
                  <td>{inv.subscription}</td>
                  <td>
                    ₹{inv.invoiceItems.reduce((sum, item) => sum + item.amount, 0)}
                  </td>
                </tr>
              ))}
              <tr className="fw-bold bg-light">
                <td colSpan="5" className="text-end">
                  Total
                </td>
                <td className="text-success">
                  ₹{calculateTotal(customerInvoices)}
                </td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
  show={showExportModal}
  onHide={() => setShowExportModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Export</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to export the filtered invoices to Excel?
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
      Cancel
    </Button>
    <Button
      variant="primary"
      onClick={() => {
        exportToExcel();
        setShowExportModal(false);
      }}
    >
      OK
    </Button>
  </Modal.Footer>
</Modal>
      <Footer />
    </>
  );
};

export default PaymentTracking;

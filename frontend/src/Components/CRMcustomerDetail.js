import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Modal,
  Badge,
} from "react-bootstrap";
import { PencilSquare, TrashFill, Download, Plus } from "react-bootstrap-icons";
import axios from "axios";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CustomerPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [user, setUser] = useState(null);

  const [showExport, setShowExport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchInvoices(parsedUser._id);
    }
  }, []);

  const fetchInvoices = async (userId) => {
    try {
      const res = await axios.get(
        `https://subscriptiom-lc.onrender.com/api/invoices?userId=${userId}`
      );
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`https://subscriptiom-lc.onrender.com/api/invoices/${id}`);
      setInvoices(invoices.filter((inv) => inv._id !== id));
    } catch (err) {
      alert("Error deleting invoice");
    }
  };

  const handleExportInvoices = () => {
  // Map the filteredInvoices to include all table columns, but only Price will have real values
  const exportData = filteredInvoices.map((inv, index) => ({
    "S.No": index + 1,
    Date: inv.date,
    Name: inv.name,
    Email: inv.email,
    "Phone No": inv.phone,
    Address: inv.address,
    "Product Purchased": inv.product,
    Subscription: inv.subscription,
    Price: inv.price, // Only this column has the actual value
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  XLSX.writeFile(workbook, "Invoices.xlsx");
  setShowExport(false);
};

  const handleEditSave = async () => {
    if (!editInvoice) return;
    try {
      await axios.put(
        `https://subscriptiom-lc.onrender.com/api/invoices/${editInvoice._id}`,
        editInvoice
      );
      fetchInvoices(user._id);
      setShowEdit(false);
      setEditInvoice(null);
    } catch (err) {
      alert("Error updating invoice");
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const searchText = search.toLowerCase();
    return (
      (inv.name?.toLowerCase().includes(searchText) ||
        inv.email?.toLowerCase().includes(searchText) ||
        inv.phone?.toLowerCase().includes(searchText) ||
        inv.product?.toLowerCase().includes(searchText)) &&
      (date ? inv.date === date : true)
    );
  });

  // Inside CustomerPage component, before rendering table
const uniqueInvoices = filteredInvoices.filter((inv, index, self) =>
  index === self.findIndex((i) => i.name === inv.name && i.product === inv.product)
);


  return (
    <>
      <Navbar />
      <Container className="mt-4">
        {/* Page Header */}
        <Row className="mb-3 align-items-center">
  <Col>
    <h2 className="fw-bold text-primary">Customer Management</h2>
  </Col>

  <Col className="d-flex justify-content-end gap-2">
    <Form.Control
      type="text"
      placeholder="Search by Name/Product"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-auto"
      style={{ minWidth: "200px" }}
    />
    <Form.Control
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="w-auto"
      style={{ minWidth: "160px" }}
    />
    <Button
      variant="success"
      onClick={() => setShowExport(true)}
      className="d-flex align-items-center"
    >
      <Download className="me-1" /> Export
    </Button>
  </Col>
</Row>

        {/* Table */}
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
  <table className="table table-bordered table-hover shadow-sm">
    <thead className="table-light text-center">
            <tr>
            <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>S.No</th>
            <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Date</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Name</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Email</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Phone No</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Address</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Product Purchased</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Subscription</th>
              <th style={{ position: "sticky", top: 0, background: "#d6b3ff",  zIndex: 2 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {uniqueInvoices.map((inv , index) => (
              <tr key={inv._id} className="text-center align-middle">
                <td>{index + 1}</td>
                <td>{inv.date}</td>
                <td>{inv.name}</td>
                <td>{inv.email}</td>
                <td>{inv.phone}</td>
                <td>{inv.address}</td>
                <td>{inv.product}</td>
                <td>
                  {inv.subscription}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => {
                      setEditInvoice(inv);
                      setShowEdit(true);
                    }}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteInvoice(inv._id)}
                  >
                    <TrashFill />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Container>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Edit Invoice</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-2">
        <Form.Label>Date</Form.Label>
        <Form.Control
          type="date"
          value={editInvoice?.date || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, date: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={editInvoice?.name || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, name: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={editInvoice?.email || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, email: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Phone</Form.Label>
        <Form.Control
          type="text"
          value={editInvoice?.phone || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, phone: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Address</Form.Label>
        <Form.Control
          type="text"
          value={editInvoice?.address || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, address: e.target.value })
          }
        />
      </Form.Group>

      {/* <Form.Group className="mb-2">
        <Form.Label>Product Purchased</Form.Label>
        <Form.Control
          type="text"
          value={editInvoice?.product || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, product: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Subscription</Form.Label>
        <Form.Control
          type="text"
          value={editInvoice?.subscription || ""}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, subscription: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Status</Form.Label>
        <Form.Select
          value={editInvoice?.status || "Pending"}
          onChange={(e) =>
            setEditInvoice({ ...editInvoice, status: e.target.value })
          }
        >
          <option>Pending</option>
          <option>Paid</option>
        </Form.Select>
      </Form.Group> */}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEdit(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleEditSave}>
      Save Changes
    </Button>
  </Modal.Footer>
</Modal>


      {/* Export Modal */}
      <Modal show={showExport} onHide={() => setShowExport(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Export</Modal.Title>
        </Modal.Header>
        <Modal.Body>Download filtered invoices as Excel?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExport(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExportInvoices}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
};

export default CustomerPage;

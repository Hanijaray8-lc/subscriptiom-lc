import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { PencilSquare, TrashFill } from "react-bootstrap-icons";
import axios from "axios";

const CustomerTable = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [editCustomer, setEditCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const INVOICE_API_URL = "https://subscriptiom-lc.onrender.com/api/amcinvoices";

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Format date to YYYY-MM-DD
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toISOString().split("T")[0];
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem("user");
      if (!userData) {
        setError("User not logged in");
        return;
      }

      const user = JSON.parse(userData);
      if (!user?._id) {
        setError("Invalid user data");
        return;
      }

      const response = await axios.get(`${INVOICE_API_URL}?owner=${user._id}`);
      const invoiceData = response.data?.data || [];
      
      const uniqueCombinations = new Map();
      
      invoiceData.forEach(invoice => {
        const customerName = invoice.customerName;
        const products = invoice.products && invoice.products.length > 0 
          ? invoice.products.map(p => p.productName).join(', ')
          : 'No products';
        
        const uniqueKey = `${customerName.toLowerCase()}-${products.toLowerCase()}`;
        
        if (!uniqueCombinations.has(uniqueKey)) {
          uniqueCombinations.set(uniqueKey, {
            id: invoice._id,
            date: formatDateForDisplay(invoice.date), // <-- formatted date
            name: invoice.customerName,
            email: invoice.email,
            phone: invoice.phone,
            address: invoice.address,
            product: products,
            subscription: invoice.subscription,
            uniqueKey
          });
        }
      });

      setCustomers(Array.from(uniqueCombinations.values()));
    } catch (err) {
      console.error("Error fetching invoice data:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const matchesNameOrProduct =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = searchDate ? cust.date === searchDate : true;
    return matchesNameOrProduct && matchesDate;
  });

  const handleExport = () => {
    const csvRows = [];
    const headers = [
      "S.No",
      "Date",
      "Name",
      "Email",
      "Phone No",
      "Address",
      "Product Purchased",
      "Subscription"
    ];
    csvRows.push(headers.join(","));

    filteredCustomers.forEach((cust, index) => {
      const row = [
        index + 1,
        cust.date,
        cust.name,
        cust.email,
        cust.phone,
        cust.address,
        cust.product,
        cust.subscription
      ];
      csvRows.push(row.join(","));
    });

    const csvData = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(csvData);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id, uniqueKey) => {
    if (window.confirm("Are you sure you want to delete this customer record?")) {
      try {
        await axios.delete(`${INVOICE_API_URL}/${id}`);
        setCustomers(customers.filter((cust) => cust.uniqueKey !== uniqueKey));
        alert("Customer record deleted successfully!");
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("Failed to delete customer record");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editCustomer) return;
    
    try {
      const updatedInvoiceData = {
        customerName: editCustomer.name,
        email: editCustomer.email,
        phone: editCustomer.phone,
        address: editCustomer.address,
        date: editCustomer.date
      };

      await axios.put(`${INVOICE_API_URL}/${editCustomer.id}`, updatedInvoiceData);
      
      setCustomers(
        customers.map((cust) =>
          cust.uniqueKey === editCustomer.uniqueKey ? editCustomer : cust
        )
      );
      
      setEditCustomer(null);
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer record");
    }
  };

  if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="text-primary fw-bold">Customer Management</h2>

          {/* Group search, date & export together */}
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              placeholder="Search by Name/Product"
              className="form-control"
              style={{ width: "250px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="date"
              className="form-control"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
            <button className="btn btn-success" onClick={handleExport}>
              Export
            </button>
          </div>
        </div>

        <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="table table-bordered table-hover align-middle">
            <thead className="text-center">
              <tr>
                {[
                  "S.No",
                  "Date",
                  "Name",
                  "Email",
                  "Phone No",
                  "Address",
                  "Product Purchased",
                  "Subscription",
                  "Action"
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#d6b3ff",
                      zIndex: 2,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust, index) => (
                  <tr key={cust.uniqueKey}>
                    <td className="text-center">{index + 1}</td>
                    <td className="text-center">{cust.date}</td>
                    <td className="text-center">{cust.name}</td>
                    <td className="text-center">{cust.email}</td>
                    <td className="text-center">{cust.phone}</td>
                    <td className="text-center">{cust.address}</td>
                    <td className="text-center">{cust.product}</td>
                    <td className="text-center">{cust.subscription}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => setEditCustomer({ ...cust })}
                      >
                        <PencilSquare />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(cust.id, cust.uniqueKey)}
                      >
                        <TrashFill />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editCustomer && (
        <div
          className="modal show fade"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditCustomer(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editCustomer.date}
                    onChange={(e) =>
                      setEditCustomer({ ...editCustomer, date: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCustomer.name}
                    onChange={(e) =>
                      setEditCustomer({ ...editCustomer, name: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editCustomer.email}
                    onChange={(e) =>
                      setEditCustomer({ ...editCustomer, email: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCustomer.phone}
                    onChange={(e) =>
                      setEditCustomer({ ...editCustomer, phone: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    value={editCustomer.address}
                    onChange={(e) =>
                      setEditCustomer({ ...editCustomer, address: e.target.value })
                    }
                  />
                </div>
                <div className="alert alert-info">
                  <small>
                    <strong>Products:</strong> {editCustomer.product}
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditCustomer(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default CustomerTable;

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";

const API_BASE = "https://subscriptiom-lc.onrender.com/api/amc-products";

function ProductServicePage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", image: null, description: "", link: "" });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        fetchProducts(user._id);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        setError("Invalid user data. Please login again.");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchProducts = async (owner) => {
    try {
      if (!owner || owner.length !== 24) {
        setProducts([]);
        return;
      }
      const resp = await axios.get(API_BASE, { params: { owner } });
      setProducts(resp.data || []);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Failed to fetch products: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF...).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.name.trim()) return setError("Product name required");
    if (!form.image) return setError("Product image required");
    if (!currentUser?._id || currentUser._id.length !== 24) return setError("Invalid user. Please login again.");

    const payload = {
      name: form.name.trim(),
      image: form.image,
      description: form.description.trim(),
      link: form.link.trim(),
      owner: currentUser._id,
      userEmail: currentUser.email
    };

    try {
      setLoading(true);
      const res = await axios.post(API_BASE, payload, { headers: { "Content-Type": "application/json" } });
      setProducts((prev) => [res.data.product, ...prev]);
      setForm({ name: "", image: null, description: "", link: "" });
      setSuccess(res.data.message || "Product added");
      setShowModal(false);
    } catch (err) {
      console.error("Error adding product:", err);
      const msg = err.response?.data?.message || err.message || "Failed to add product";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setSuccess("Product deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete product: " + (err.response?.data?.message || err.message));
    }
  };

  if (!currentUser) {
    return <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>;
  }

  return (
    <>
      <Navbar />
      <div className="py-2">
        <div className="container">
          {/* Alerts */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show">
              {success}
              <button className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <div className="d-flex justify-content-between mb-4">
            <h2 className="text-primary">Products & Services</h2>
          </div>

          {/* Scrollable Product Grid */}
          <div className="row g-4 overflow-auto" style={{ maxHeight: "70vh" }}>
            <AnimatePresence>
              {/* Add Product Card */}
              <motion.div className="col-md-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  className="card h-100 border-primary text-center d-flex align-items-center justify-content-center p-4"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowModal(true)}
                >
                  <div>
                    <div className="mb-3">
                      <button className="btn btn-outline-primary rounded-circle" style={{ width: 50, height: 50, fontSize: 24 }}>+</button>
                    </div>
                    <h6 className="fw-bold">Add Product</h6>
                    <small className="text-muted">Click to add new product</small>
                  </div>
                </div>
              </motion.div>

              {products.length === 0 ? (
                <div className="col-12 text-center">
                  <div className="card p-5 bg-light">No products yet — add your first one above.</div>
                </div>
              ) : products.map((prod) => (
                <motion.div key={prod._id} className="col-md-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="card h-100 shadow-sm position-relative">
                    <button
                      className="btn btn-sm btn-danger position-absolute m-2"
                      style={{ right: 10, top: 10 }}
                      onClick={() => handleDelete(prod._id)}
                    >
                      ×
                    </button>
                    {prod.image && (
                      <img src={prod.image} alt={prod.name} className="card-img-top" style={{ height: "150px", objectFit: "cover" }} />
                    )}
                    <div className="card-body text-center">
                      <h6 className="fw-bold text-primary">{prod.name}</h6>
                      <p className="text-muted small">{prod.description}</p>
                      {prod.link && <a href={prod.link} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">Visit</a>}
                    </div>
                    <div className="card-footer text-muted text-center">
                      Added on: {new Date(prod.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Centered Modal */}
        {showModal && (
          <div className="modal show fade d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">Add Product</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Product Name</label>
                      <input name="name" value={form.name} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Product Image</label>
                      <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea name="description" rows="3" value={form.description} onChange={handleChange} className="form-control" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Adding..." : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ProductServicePage;

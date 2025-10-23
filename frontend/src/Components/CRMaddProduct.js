import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CustomNavbar from "./Navbar";
import "bootstrap-icons/font/bootstrap-icons.css";
import Footer from "./Footer";

function Product() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    image: "",
    description: "",
    link: "",
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, product: null });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) return;
    fetch(`https://subscriptiom-lc.onrender.com/api/products?userId=${user._id}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Fetch products error:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // 👉 Ask confirmation first
  const confirmAdd = window.confirm("Are you sure you want to add this product?");
  if (!confirmAdd) {
    return; // stop here if cancelled
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?._id) return alert("User not found");

  try {
    const res = await fetch("https://subscriptiom-lc.onrender.com/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId: user._id }),
    });
    if (!res.ok) throw new Error("Failed to add product");
    const newProduct = await res.json();
    setProducts([newProduct, ...products]);
    setForm({ name: "", image: "", description: "", link: "" });
    setShowForm(false); // close modal only if added
  } catch (err) {
    alert("Error adding product: " + err.message);
  }
};

  const handleDelete = async (productId) => {
    try {
      const res = await fetch(`https://subscriptiom-lc.onrender.com/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((p) => p._id !== productId));
      setDeleteConfirm({ show: false, product: null });
      setSelectedProduct(null);
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb", // clean light background
      }}
    >
      <style>
        {`
          .product-card {
            width: 100%;
            max-width: 270px;
            min-width: 220px;
            min-height: 320px;
            border-radius: 16px;
            background: #fff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.3s ease;
            margin-left: auto;
            margin-right: auto;
          }
          .product-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          }
          .product-desc {
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            min-height: 3.6em;
            max-height: 3.6em;
            font-size: 0.95rem;
          }
          @media (max-width: 575.98px) {
            .product-card {
              max-width: 95vw;
              min-width: 160px;
              min-height: 220px;
            }
          }
            .card-container {
  max-height: calc(100vh - 150px); 
  overflow-y: auto;               
  padding-right: 5px;             
}
        `}
      </style>

      <CustomNavbar />

      <div className="container py-2">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 className="fw-bold text-primary m-0">
             Products & Services
          </h2>   
        </div>

        <div className="row justify-content-center g-4 card-container">
          {/* Add Product Card */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
            <div
              className="product-card d-flex flex-column align-items-center justify-content-center border border-primary shadow-sm p-4 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => setShowForm(true)}
            >
              <div style={{ fontSize: "2.5rem", color: "#0d6efd" }}>
                <i className="bi bi-plus-circle"></i>
              </div>
              <h5 className="mt-3" style={{ fontFamily: "Segoe UI" }}>
                Add Product
              </h5>
              <p className="text-muted">Click to add new product</p>
            </div>
          </div>

          {/* Product Cards */}
          {products.map((card, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
              <div
                className="product-card shadow-sm border border-success text-center p-3"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedProduct(card)}
              >
                {card.image && (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="rounded"
                    style={{ width: "100%", height: "150px", objectFit: "cover" }}
                  />
                )}
                <h6 className="fw-bold text-success" style={{ fontFamily: "Segoe UI" }}>
                  {card.name}
                </h6>
                <p className="text-muted product-desc">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modals remain same as your code --- */}
      {/* Form Modal, Detail Modal, Delete Confirmation Modal */}
      {showForm && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.3)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3">
              <div className="modal-header">
                <h5 className="modal-title">Add Product</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Product Image</label>
                    <input type="file" className="form-control" name="image" accept="image/*" onChange={handleChange} />
                    {form.image && (
                      <img
                        src={form.image}
                        alt="Preview"
                        className="mt-2 rounded"
                        style={{ width: "100%", height: "100px", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Keep Product Detail & Delete Confirmation Modals same as your version */}
      {selectedProduct && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.4)" }}
          tabIndex="-1"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content rounded-3">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProduct.name}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body text-center">
                {selectedProduct.image && (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="mb-3 rounded"
                    style={{
                      width: "100%",
                      maxHeight: 240,
                      objectFit: "contain",
                      background: "#f8f9fa",
                    }}
                  />
                )}
                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    textAlign: "left",
                    margin: "0 auto 10px auto",
                    color: "#333",
                    fontSize: "1.05rem",
                    padding: "0.5rem 0.2rem",
                  }}
                >
                  {selectedProduct.description}
                </div>
                <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    title="Delete Product"
                    onClick={() => setDeleteConfirm({ show: true, product: selectedProduct })}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.4)" }}
          tabIndex="-1"
          onClick={() => setDeleteConfirm({ show: false, product: null })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-3">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteConfirm({ show: false, product: null })}
                ></button>
              </div>
              <div className="modal-body text-center">
                <p>
                  Are you sure you want to delete <b>{deleteConfirm.product?.name}</b>?
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirm({ show: false, product: null })}
                >
                  No
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.product._id)}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Product;


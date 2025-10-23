import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import CustomNavbar from "./Navbar";
import "bootstrap-icons/font/bootstrap-icons.css";
import Footer from "./Footer";

function HomePage() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const companyName = user?.company || "Your Company Name";
  const option = user?.option; // "Subscription" or "AMC"

  const crmCards = [
    { icon: "bi bi-box-seam", circleColor: "#0d6efd", title: "Product & Services", text: "Manage your offerings", onClick: () => navigate("/CRM-product") },
    { icon: "bi bi-people", circleColor: "#198754", title: "Client View", text: "View & edit clients", onClick: () => navigate("/CRM-customer") },
    { icon: "bi bi-receipt", circleColor: "#ffc107", title: "Generate Invoice", text: "Billing & payments", onClick: () => navigate("/CRM-invoices") },
    { icon: "bi bi-arrow-repeat", circleColor: "#0dcaf0", title: "Renewal & Remainder", text: "Track renewals", onClick: () => navigate("/CRM-renew") },
    { icon: "bi bi-cash-stack", circleColor: "#6610f2", title: "Payment Tracking", text: "Track payments", onClick: () => navigate("/CRM-payment") },
  ];

  const amcCards = [
    { icon: "bi bi-tools", circleColor: "#0d6efd", title: "Products & Services", text: "Manage machine details", onClick: () => navigate("/AMC-product") },
    { icon: "bi bi-person-lines-fill", circleColor: "#198754", title: "Customer Detail", text: "View & edit customers", onClick: () => navigate("/AMC-customer") },
    { icon: "bi bi-clock-history", circleColor: "#0dcaf0", title: "Create Invoice Bill", text: "Track service updates", onClick: () => navigate("/AMC-invoice") },
    { icon: "bi bi-receipt", circleColor: "#ffc107", title: "Maintenance Update History", text: "Billing & payments", onClick: () => navigate("/AMC-history") },
    { icon: "bi bi-currency-rupee", circleColor: "#6610f2", title: "Payment Tracking", text: "Monitor payments", onClick: () => navigate("/AMC-payment") },
  ];

  const cards = option === "AMC" ? amcCards : crmCards;

  const Card = ({ icon, circleColor, title, text, onClick }) => (
    <div className="col-12 col-sm-6 col-md-4 mb-4 d-flex justify-content-center">
      <div className="dashboard-card text-center p-4" onClick={onClick}>
        <div className="dashboard-icon" style={{ background: circleColor }}>
          <i className={icon}></i>
        </div>
        <h5 className="mt-3">{title}</h5>
        <p>{text}</p>
        <button className="btn-knowmore">Know more</button>
      </div>
    </div>
  );

  return (
    <div className="homepage-container d-flex flex-column min-vh-100">
      <CustomNavbar companyName={companyName} />

      <div className="container py-5 flex-grow-1">
        <h2 className="text-center mb-5">Welcome to Manager Dashboard</h2>

        <div className="row justify-content-center">
          {cards.map((card, idx) => (
            <Card key={idx} {...card} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;

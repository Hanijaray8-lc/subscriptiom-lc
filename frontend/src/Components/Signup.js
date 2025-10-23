import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Container, Row, Col, Card, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";


const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    company: "",
    companyAddress: "",
    companyLogo: null,
    option: "Subscription",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState("");
  const [emailError, setEmailError] = useState("");
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Show alert helper
  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => setAlert({ show: false, variant: "", message: "" }), 2500);
  };

  // Handle text input
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Email validation on change
    if (name === "email") {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value)) {
        setEmailError("Email must be a valid @gmail.com address!");
      } else {
        setEmailError("");
      }
    }

    // Restrict phone input to "+91" and up to 10 digits
    if (name === "phone") {
      // Allow only "+91" at the start and up to 10 digits after
      let phoneValue = value.replace(/[^0-9+]/g, "");
      if (!phoneValue.startsWith("+91")) {
        phoneValue = "+91";
      }
      if (phoneValue.length > 13) {
        phoneValue = phoneValue.slice(0, 13);
      }
      setFormData({ ...formData, phone: phoneValue });
      return;
    }

    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  // Handle file upload (logo)
  const handleFileChange = (e) => {
    setFormData({ ...formData, companyLogo: e.target.files[0] });
  };

  // Password validation & strength check
  const checkPasswordStrength = (password) => {
    let strength = "";
    const hasLetter = /[A-Za-z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8) {
      strength = "Too Short";
    } else if (hasLetter && hasSymbol) {
      strength = "Strong";
    } else if (hasLetter || hasSymbol) {
      strength = "Medium";
    } else {
      strength = "Weak";
    }
    setPasswordStrength(strength);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email must end with @gmail.com
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      showAlert("danger", "❌ Email must be a valid @gmail.com address!");
      return;
    }

    // Phone must be +91 followed by exactly 10 digits
    if (!/^\+91\d{10}$/.test(formData.phone)) {
      showAlert("danger", "❌ Phone number must be in the format +911234567890");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert("danger", "❌ Passwords do not match!");
      return;
    }

    if (passwordStrength !== "Strong") {
      showAlert("danger", "❌ Password must be at least 8 characters and include letters & symbols.");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await fetch("https://subscriptiom-lc.onrender.com/api/users/signup", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("success", "✅ Signup successful!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        // Show specific alert for duplicate email or phone
        if (data.message === "Email already exists") {
          showAlert("danger", "❌ This email is already registered.");
        } else if (data.message === "Phone number already exists") {
          showAlert("danger", "❌ This phone number is already registered.");
        } else {
          showAlert("danger", data.message || "❌ Something went wrong!");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "❌ Server error!");
    }
  };

  return (
    <Container
      fluid
      className="bg-light min-vh-100 d-flex align-items-center justify-content-center"
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={8} lg={6} xl={5}>
          <Card className="shadow rounded-4 border-0">
            <Card.Body className="p-4">
              <h3 className="text-center mb-3 fw-bold text-primary">
                Create Account
              </h3>

              {/* Bootstrap Alert Popup */}
              {alert.show && (
                <Alert
                  variant={alert.variant}
                  className="text-center fw-semibold"
                  style={{ fontSize: "1.1rem" }}
                  dismissible
                  onClose={() => setAlert({ show: false, variant: "", message: "" })}
                >
                  {alert.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} encType="multipart/form-data">
                <Row className="g-3">
                  {/* Row 1: Employee ID & Username */}
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="employeeId"
                        type="text"
                        placeholder="Employee ID"
                        name="employeeId"
                        value="Will be generated"
                        readOnly
                        disabled
                      />
                      <label htmlFor="employeeId">Employee ID</label>
                    </Form.Floating>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="username"
                        type="text"
                        placeholder="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="username">Username</label>
                    </Form.Floating>
                  </Col>

                  {/* Row 2: Email & Phone */}
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="email"
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
                        title="Email must be a valid @gmail.com address"
                        isInvalid={!!emailError}
                      />
                      <label htmlFor="email">Email</label>
                      <Form.Control.Feedback type="invalid" className="d-block">
                        {emailError}
                      </Form.Control.Feedback>
                    </Form.Floating>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="phone"
                        type="text"
                        placeholder="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        pattern="^\+91\d{10}$"
                        title="Phone number must be in the format +911234567890"
                        maxLength={13}
                      />
                      <label htmlFor="phone">Phone Number</label>
                    </Form.Floating>
                  </Col>

                  {/* Row 3: Company Name & Company Address */}
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="company"
                        type="text"
                        placeholder="Company Name"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="company">Company Name</label>
                    </Form.Floating>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Control
                        id="companyAddress"
                        type="text"
                        placeholder="Company Address"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleChange}
                      />
                      <label htmlFor="companyAddress">Company Address</label>
                    </Form.Floating>
                  </Col>

                  {/* Row 4: Company Logo & Service Type */}
                  <Col xs={12} md={6}>
                    <div className="form-floating">
                      <Form.Control
                        type="file"
                        id="companyLogo"
                        name="companyLogo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="form-control"
                        style={{ height: "58px" }}
                      />
                      <label htmlFor="companyLogo">Company Logo</label>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Floating>
                      <Form.Select
                        id="option"
                        name="option"
                        value={formData.option}
                        onChange={handleChange}
                      >
                        <option value="Subscription">Subscription</option>
                        <option value="AMC">AMC</option>
                      </Form.Select>
                      <label htmlFor="option">Service Type</label>
                    </Form.Floating>
                  </Col>

                  {/* Password */}
<Col xs={12} md={6}>
  <Form.Floating className="position-relative">
    <Form.Control
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="Password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      required
    />
    <label htmlFor="password">Password</label>

    {/* Eye Icon */}
    <span
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        top: "50%",
        right: "10px",
        transform: "translateY(-50%)",
        cursor: "pointer",
        color: "#6c757d",
      }}
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
  </Form.Floating>

  {formData.password && (
    <div
      className={`mb-2 small fw-semibold ${
        passwordStrength === "Too Short"
          ? "text-danger"
          : passwordStrength === "Weak"
          ? "text-danger"
          : passwordStrength === "Medium"
          ? "text-warning"
          : "text-success"
      }`}
    >
      Password Strength: {passwordStrength}
    </div>
  )}
</Col>

{/* Confirm Password */}
<Col xs={12} md={6}>
  <Form.Floating className="position-relative">
    <Form.Control
      id="confirmPassword"
      type={showConfirmPassword ? "text" : "password"}
      placeholder="Confirm Password"
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      required
    />
    <label htmlFor="confirmPassword">Confirm Password</label>

    {/* Eye Icon */}
    <span
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      style={{
        position: "absolute",
        top: "50%",
        right: "10px",
        transform: "translateY(-50%)",
        cursor: "pointer",
        color: "#6c757d",
      }}
    >
      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
  </Form.Floating>
</Col>


                  {/* Row 6: Centered Submit Button */}
                  <Col xs={12} className="d-flex justify-content-center mt-2">
                    <Button variant="primary" type="submit" className="px-5">
                      Sign Up
                    </Button>
                  </Col>
                </Row>
              </Form>

              <p className="text-center mt-3 mb-0 text-muted small">
                Already have an account?{" "}
                <a href="/" className="text-decoration-none fw-semibold">
                  Login
                </a>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;


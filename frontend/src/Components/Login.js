import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Alert,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage = () => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updateMsg, setUpdateMsg] = useState("");

  // 👁️ password toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // ✅ Style objects
  const inputStyle = {
    height: "55px",
    fontSize: "1rem",
    padding: "10px 12px",
  };

  const btnStyle = {
    height: "55px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 15px",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { identifier, password } = formData;

    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await axios.post("https://subscriptiom-lc.onrender.com/api/users/login", formData);
      const user = res.data.user;

      setSuccess(res.data.message);
      setError("");
      localStorage.setItem("user", JSON.stringify(user));

      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
      setSuccess("");
    }
  };

  const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleForgot = async () => {
    if (!formData.identifier) {
      setForgotError("Please enter your Username or Email first.");
      return;
    }
    setForgotError("");

    try {
      const res = await axios.post("https://subscriptiom-lc.onrender.com/api/users/check-exists", {
        identifier: formData.identifier,
      });

      if (res.data.exists) {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)) {
          setForgotEmail(formData.identifier);
        } else {
          setForgotEmail("");
        }
        const code = generateCode();
        setVerifyCode(code);
        setEnteredCode("");
        setCodeMsg("");
        setShowForgot(true);
      }
    } catch (err) {
      setForgotError("This user email or ID is not registered.");
      setShowForgot(false);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (enteredCode === verifyCode) {
      setCodeMsg("✅ Code verified!");
      setTimeout(() => {
        setShowForgot(false);
        setShowUpdatePassword(true);
      }, 1000);
    } else {
      setCodeMsg("❌ Invalid code. Try again.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setUpdateMsg("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateMsg("Passwords do not match.");
      return;
    }
    try {
      await axios.post("https://subscriptiom-lc.onrender.com/api/users/update-password", {
        identifier: formData.identifier,
        newPassword,
      });
      setUpdateMsg("✅ Password updated successfully!");
      setTimeout(() => {
        setShowUpdatePassword(false);
        setUpdateMsg("");
      }, 1500);
    } catch (err) {
      setUpdateMsg(err.response?.data?.message || "Server error");
    }
  };

  return (
    <Container
      fluid
      className="bg-light min-vh-100 d-flex align-items-center justify-content-center"
    >
      <Row className="w-100 justify-content-center">
        <Col md={5} lg={4}>
          <Card className="shadow-lg rounded-4 border-0">
            <Card.Body className="p-4">
              <h3 className="text-center mb-4 fw-bold text-primary">Login</h3>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                {/* Username Field */}
                <Form.Floating className="mb-3">
                  <Form.Control
                    id="identifier"
                    type="text"
                    placeholder="Username or Email"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                  <label htmlFor="identifier">Username or Email</label>
                </Form.Floating>

                {/* Password Field with Eye Toggle */}
                <InputGroup className="mb-3">
                  <Form.Control
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    style={btnStyle}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>

                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    Login
                  </Button>
                </div>
              </Form>

              <p className="text-center mt-3 mb-0 text-muted small">
                Don't have an account?{" "}
                <a href="/signup" className="text-decoration-none fw-semibold">
                  Sign Up
                </a>
              </p>
              <p className="text-center mt-2 mb-0">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none text-primary fw-semibold p-0"
                  style={{ fontSize: "inherit" }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgot();
                  }}
                >
                  Forgot Password?
                </button>
              </p>
              {forgotError && (
                <div className="text-danger text-center mb-2 small">{forgotError}</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Forgot Password Modal */}
      <Modal show={showForgot} onHide={() => setShowForgot(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Forgot Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleVerifyCode}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={forgotEmail}
                readOnly={!!forgotEmail}
                placeholder="Enter your email"
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Enter the verify code: <span className="fw-bold">{verifyCode}</span>
              </Form.Label>
              <Form.Control
                type="text"
                maxLength={4}
                placeholder="Enter 4-digit code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                required
              />
            </Form.Group>
            {codeMsg && (
              <div
                className={`mb-2 fw-semibold ${
                  codeMsg.startsWith("✅") ? "text-success" : "text-danger"
                }`}
              >
                {codeMsg}
              </div>
            )}
            <Button variant="primary" type="submit" className="w-100">
              Verify
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Update Password Modal */}
      <Modal show={showUpdatePassword} onHide={() => setShowUpdatePassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdatePassword}>
            {/* 👁️ New Password */}
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={btnStyle}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            {/* 👁️ Confirm Password */}
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={btnStyle}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            {updateMsg && (
              <div
                className={`mb-2 fw-semibold ${
                  updateMsg.startsWith("✅") ? "text-success" : "text-danger"
                }`}
              >
                {updateMsg}
              </div>
            )}
            <Button variant="primary" type="submit" className="w-100">
              Update Password
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default LoginPage;

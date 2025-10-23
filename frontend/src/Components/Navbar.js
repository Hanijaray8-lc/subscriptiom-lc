import React, { useEffect, useState } from "react";
import { Navbar, Container, Image, Dropdown, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const CustomNavbar = ({ companyName }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Navbar
      expand="lg"
      style={{
        background: "linear-gradient(90deg, #1e3c72, #2a5298)",
        position: "sticky", 
        top: 0,
        zIndex: 1030,
      }}
      className="shadow-sm py-2"
    >
      <Container>
        {/* Back Button + Company Logo + Name */}
        <div className="d-flex align-items-center">
          <Button
            variant="outline-light"
            size="sm"
            className="me-3 rounded-circle"
            onClick={() => navigate(-1)}
          >
            ←
          </Button>

          <Navbar.Brand href="/" className="d-flex align-items-center text-white fw-bold">
            {user?.companyLogo && (
              <Image
                src={user.companyLogo}
                alt="Company Logo"
                roundedCircle
                style={{ width: "45px", height: "45px", marginRight: "12px" }}
              />
            )}
            <span className="fs-5">{companyName || user?.company}</span>
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav" className="border-0" />
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          {user && (
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-user"
                className="d-flex align-items-center border-0 bg-white rounded-pill px-3 py-1 shadow-sm"
              >
                <span
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                  style={{ width: "35px", height: "35px", fontSize: "16px" }}
                >
                  {user.username?.charAt(0).toUpperCase()}
                </span>
                <span className="fw-semibold">{user.username}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm">
                <Dropdown.Header>{user.email}</Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={handleLogout}
                  className="text-danger fw-semibold"
                >
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;


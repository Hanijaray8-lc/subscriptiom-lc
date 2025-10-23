import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const Footer = () => {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "#1e3c72",
        color: "#fff",
        padding: "10px 0",
        fontSize: "14px",
        zIndex: 1030,
        boxShadow: "0 -2px 5px rgba(0,0,0,0.2)",
      }}
    >
      <Container>
        <Row className="align-items-center justify-content-between text-center text-md-start flex-md-row-reverse">
          {/* Social Icons */}
          <Col xs={12} md="auto" className="mb-1 mb-md-0">
            <a
              href="https://lifechangersind.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white mx-2"
              style={{ fontSize: "18px" }}
            >
              <i className="bi bi-globe"></i>
            </a>
            {/* <a
              href="https://www.instagram.com/lifechangers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white mx-2"
              style={{ fontSize: "18px" }}
            >
              <i className="bi bi-instagram"></i>
            </a> */}
            <a
              href="https://www.facebook.com/lc.ind.50?mibextid=LQQJ4d"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white mx-2"
              style={{ fontSize: "18px" }}
            >
              <i className="bi bi-facebook"></i>
            </a>
            <a
              href="https://www.linkedin.com/in/life-changers-ind-5696b720a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white mx-2"
              style={{ fontSize: "18px" }}
            >
              <i className="bi bi-linkedin"></i>
            </a>
          </Col>

          {/* Company / Copyright */}
          <Col xs={12} md="auto" className="mb-1 mb-md-0">
            &copy; 2025 Life Changers Ind
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

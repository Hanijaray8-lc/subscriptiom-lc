import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Components/HomePage";
import Login from "./Components/Login";
import Signup from "./Components/Signup";

import CRMinvoiceBill from "./Components/CRMinvoiceBill";
import CRMcustomerDetail from "./Components/CRMcustomerDetail";
import CRMaddProduct from "./Components/CRMaddProduct";
import CRMrenewPage from "./Components/CRMrenewPage";
import CRMpaymentTracking from "./Components/CRMpaymentTracking";

import AMCcustomerDetails from "./Components/AMCcustomerDetail"; 
import AMCaddProduct from "./Components/AMCaddProduct";
import AMCinvoiceBill from "./Components/AMCinvoiceBill"; 
import AMCupdateHistory from "./Components/AMCupdateHistory";
import AMCpaymentTracking from "./Components/AMCpaymentTracking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/CRM-invoices" element={<CRMinvoiceBill />} />
        <Route path="/CRM-customer" element={<CRMcustomerDetail />} />
        <Route path="/CRM-product" element={<CRMaddProduct />} />
        <Route path="/CRM-renew" element={<CRMrenewPage />} />
        <Route path="/CRM-payment" element={<CRMpaymentTracking />} />


        <Route path="/AMC-customer" element={<AMCcustomerDetails />} />
        <Route path="/AMC-product" element={<AMCaddProduct />} />
        <Route path="/AMC-invoice" element={<AMCinvoiceBill />} />
        <Route path="/AMC-history" element={<AMCupdateHistory />} />
        <Route path="/AMC-payment" element={<AMCpaymentTracking />} />

      </Routes>
    </Router>
  );
}

export default App;

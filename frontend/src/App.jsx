import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormPage from './pages/FormPage';
import HomePage from './pages/HomePage';
import FormDetailsPage from './pages/FormDetailsPage';
import FormsListPage from './pages/FormsListPage';
import FormDashboardPage  from './pages/FormDashboardPage';
import SystemPage from './pages/SystemPage';
import Login from './pages/Login';
import Logout from './components/Logout';
import FillFormPage from './pages/FillFormPage';
import GroupFormPage from './pages/GroupFormPage';
import { FormsStatus } from './components/FormsStatus';
import { ResponseStatus } from './components/ResponseStatus';
import { SystemDashboardPage } from './pages/SystemDashboardPage'
import UserManagement from './layouts/admin/UserManagement';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavBar } from './components/navbar/Navbar';
import { Footer } from './components/navbar/Footer';
import useAuth from './hooks/AuthContext';
import { Loading } from './components/Loading';
import Profile from './layouts/Profile';
import { CurrentDate } from './components/CurrentDate';
import Help from './layouts/Help';
import ChatBot from './components/ChatBot';
import { ToastContainer } from 'react-toastify';
import './App.css'
import PDFSearchPage from './pages/PDFSearchPage';
import MongoDBTools from './layouts/admin/MongoDBTools';
import VisitAlerts from './layouts/VisitAlerts';
import SupportTicketPage from './pages/SupportTicketPage';
import { RequireAuth } from './components/RequireAuth';
import PrismFormDashboardPage from './prism/pages/PrismFormDashboardPage';
import PrismFillFormPage from './prism/pages/PrismFillFormPage';
import ConfirmationUserDashboard from './layouts/confirmation_user/ConfirmationUserDashboard';
import FvsAdminDashboard from './layouts/fvs_admin/FvsAdminDashboard';
import AdminDashboard from './layouts/admin/AdminDashboard';
import { DisclamerPage } from './pages/DisclamerPage';
import PODashboard from './prism/layouts/portfolio_owner/PODashboard';
import LocalAdminDashboard from './prism/layouts/admin/LocalAdminDashboard';
import ITUserDashboard from './elisa/layouts/it-user/ITUserDashboard';
import SpanSupportUserDashboard from './elisa/layouts/span-support-user/SpanSupportUserDashboard';
import IndustryApplicantUserDashboard from './elisa/layouts/industry-applicant-user/IndustryApplicantUserDashboard';

const App = () => {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return  <Loading />;
  }
  return(
    <div className="app-wrapper">
        <div className="main-content">
          <CurrentDate />
          {isLoggedIn && <NavBar />}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/disclamer" element={<RequireAuth><DisclamerPage /></RequireAuth>} />
            <Route path="/form-builder/:formId" element={ <RequireAuth><FormPage /></RequireAuth>} />
            <Route path="/systems/:systemId/form/:formId/response/:respId" element={ <RequireAuth><FillFormPage/></RequireAuth>} />
            <Route path="/form-details/:formId" element={ <RequireAuth><FormDetailsPage /></RequireAuth>} />
            <Route path="/forms-list/:systemId" element={ <RequireAuth><FormsListPage /></RequireAuth>} />
            <Route path='/system/:systemId' element={ <RequireAuth><SystemPage /></RequireAuth>} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/home/forms-status" element={ <RequireAuth><FormsStatus /></RequireAuth>} />
            <Route path="/systems/:systemId/forms-status" element={ <RequireAuth><FormsStatus /></RequireAuth>} />
            <Route path="/system-dashboard/:systemId" element={ <RequireAuth><SystemDashboardPage /></RequireAuth>} />
            <Route path="/user-management" element={ <RequireAuth><UserManagement /></RequireAuth>} />
            <Route path="/profile/:userId" element={ <RequireAuth><Profile /></RequireAuth>} />
            <Route path="/form-dashboard/:formId" element={ <RequireAuth><FormDashboardPage /></RequireAuth>} />
            <Route path="/systems/:systemId/forms/:formId/response-status" element={ <RequireAuth><ResponseStatus /></RequireAuth>} />
            <Route path="/systems/:systemId/form/:formId/group/:groupId" element={ <RequireAuth><GroupFormPage/></RequireAuth>} />
            <Route path="/help" element={ <RequireAuth><Help /></RequireAuth>} />
            <Route path="/alerts" element={ <RequireAuth><VisitAlerts /></RequireAuth>} />
            <Route path="/multipdf-search/systems/:systemId/forms/:formId" element={ <RequireAuth><PDFSearchPage /></RequireAuth>} />
            <Route path="/mongodb-tools" element={ <RequireAuth><MongoDBTools /></RequireAuth>} />
            <Route path="/support-ticket" element={ <RequireAuth><SupportTicketPage /></RequireAuth>} />
            <Route path="/confirmation-user" element={ <RequireAuth><ConfirmationUserDashboard /></RequireAuth>} />
            <Route path="/fvs-admin" element={ <RequireAuth><FvsAdminDashboard /></RequireAuth>} />
            <Route path="/config-specialist" element={ <RequireAuth><AdminDashboard /></RequireAuth>} />
            {/* PRISM ROUTES */}
            <Route path="/prism-form-dashboard/:formId" element={ <RequireAuth><PrismFormDashboardPage /></RequireAuth>} />
            <Route path="/systems/:systemId/prism-form/:formId/response/:respId" element={ <RequireAuth><PrismFillFormPage/></RequireAuth>} />
            <Route path="/project-owner/:formId" element={ <RequireAuth><PODashboard/></RequireAuth>} />
            <Route path="/local-admin" element={ <RequireAuth><LocalAdminDashboard/></RequireAuth>} />
            {/* ELISA ROUTES */}
            <Route path="/it-user" element={ <RequireAuth><ITUserDashboard /></RequireAuth>} />
            <Route path="/span-user" element={ <RequireAuth><SpanSupportUserDashboard /></RequireAuth>} />
            <Route path="/industry-applicant" element={ <RequireAuth><IndustryApplicantUserDashboard /></RequireAuth>} />
          </Routes>
          {/* <ChatBot/> */}
        </div>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default App;
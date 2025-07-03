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
import './App.css'

const App = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return  <Loading />;
  }
  return(
    <div className="app-wrapper">
      <NavBar />
        <div className="main-content">
          <CurrentDate />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/form-builder/:formId" element={<FormPage />} />f
            <Route path="systems/:systemId/form/:formId/response/:respId" element={<FillFormPage/>} />
            <Route path="/form-details/:formId" element={<FormDetailsPage />} />
            <Route path="/forms-list/:systemId" element={<FormsListPage />} />
            <Route path='/system/:systemId' element={<SystemPage />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/home/forms-status" element={<FormsStatus />} />
            <Route path="/systems/:systemId/forms-status" element={<FormsStatus />} />
            <Route path="/system-dashboard/:systemId" element={<SystemDashboardPage />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/form-dashboard/:formId" element={<FormDashboardPage />} />
            <Route path="/systems/:systemId/forms/:formId/response-status" element={<ResponseStatus />} />
            <Route path="systems/:systemId/form/:formId/group/:groupId" element={<GroupFormPage/>} />
          </Routes>
        </div>
      <Footer />
    </div>
  );
};

export default App;
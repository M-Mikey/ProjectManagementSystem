import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerify from "./pages/OtpVerify";
import SetNewPassword from "./pages/SetNewPassword";

import AdminDashboard from "./admin/AdminDashboard";
import AddUser from "./admin/AddUser";
import EditUser from "./admin/EditUser";

import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import MilestonePage from "./pages/MilestonePage";
import ProjectFinalPage from "./pages/ProjectFinalPage";

import ProjectDashboard from "./pages/ProjectDashboard";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/ProjectTaskDetails";

import Profile from "./pages/profile";

import ProjectApproval from "./pages/ProjectApproval";
import ProjectApprovalPending from "./pages/ProjectApprovalPending";

import UserAck from "./User/UserAcknowledge";
import UserAcknowledgeTask from "./User/UserAcknowledgeTask"; // ✅ NEW
import UserDashboard from "./User/UserDashboard";
import Reports from "./pages/Report";
import NotificationsPage from './components/Navbar/NotificationsPage';  

import TaskCompletionApprovalDetails from "./pages/TaskCompletionApprovalDetails";
import Layout from "./components/Common/Layout";


export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verify" element={<OtpVerify />} />
        <Route path="/set-password" element={<SetNewPassword />} />

        {/* ── Admin Routes (no layout or optional layout) ── */}
        <Route path="/dashboard-admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/addUser" element={
          <ProtectedRoute adminOnly><AddUser /></ProtectedRoute>
        } />
        <Route path="/editUser" element={
          <ProtectedRoute adminOnly><EditUser /></ProtectedRoute>
        } />

        {/* ── Protected + Layout Routes ── */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/addProject" element={<AddProject />} />
          <Route path="/milestone" element={<MilestonePage />} />
          <Route path="/projectFinalPage" element={<ProjectFinalPage />} />
          <Route path="/project_dashboard" element={<ProjectDashboard />} />
          <Route path="/project-details/:projectId" element={<ProjectDetails />} />
          <Route path="/task_details/:projectId/:milestoneId" element={<TaskDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/project_approval" element={<ProjectApproval />} />
          <Route path="/project_approval_details/:projectId/:milestoneId" element={<ProjectApprovalPending />} />
          <Route path="/task_completion_approval_details/:taskDtlId" element={<TaskCompletionApprovalDetails />} />
          <Route path="/user_acknowledge_milestone/:projectId/:milestoneId" element={<UserAck />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/user_acknowledge/:projectId" element={<UserAck />} />
          <Route path="/user_acknowledge_task/:projectId/:milestoneId/:parentTaskId/:taskDtlId" element={<UserAcknowledgeTask />} />
          <Route path="/user_dashboard" element={<UserDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />

        </Route>

      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeButton={false}
        theme="colored"
      />

    </BrowserRouter>
  );
}
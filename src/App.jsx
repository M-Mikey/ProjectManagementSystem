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

import TaskCompletionApprovalDetails from "./pages/TaskCompletionApprovalDetails";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/"                element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verify"      element={<OtpVerify />} />
        <Route path="/set-password"    element={<SetNewPassword />} />

        {/* ── Admin Only Routes ── */}
        <Route path="/dashboard-admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/addUser" element={
          <ProtectedRoute adminOnly><AddUser /></ProtectedRoute>
        } />
        <Route path="/editUser" element={
          <ProtectedRoute adminOnly><EditUser /></ProtectedRoute>
        } />

        {/* ── Protected Routes ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/addProject" element={
          <ProtectedRoute><AddProject /></ProtectedRoute>
        } />
        <Route path="/milestone" element={
          <ProtectedRoute><MilestonePage /></ProtectedRoute>
        } />
        <Route path="/projectFinalPage" element={
          <ProtectedRoute><ProjectFinalPage /></ProtectedRoute>
        } />
        <Route path="/project_dashboard" element={
          <ProtectedRoute><ProjectDashboard /></ProtectedRoute>
        } />
        <Route path="/project-details/:projectId" element={
          <ProtectedRoute><ProjectDetails /></ProtectedRoute>
        } />
        <Route path="/task_details/:projectId/:milestoneId" element={
          <ProtectedRoute><TaskDetails /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* ── Approval Routes ── */}
        <Route path="/project_approval" element={
          <ProtectedRoute><ProjectApproval /></ProtectedRoute>
        } />
        <Route path="/project_approval_details/:projectId/:milestoneId" element={
          <ProtectedRoute><ProjectApprovalPending /></ProtectedRoute>
        } />

        {/* ── Task Completion Verification ── */}
        <Route path="/task_completion_approval_details/:taskDtlId" element={
          <ProtectedRoute><TaskCompletionApprovalDetails /></ProtectedRoute>
        } />
        {/* ❌ REMOVED task_assignment_approval_details route */}

        {/* ── Reports ── */}
        <Route path="/reports" element={
          <ProtectedRoute><Reports /></ProtectedRoute>
        } />

        {/* ── User ACK Routes ── */}
        {/* Project + Milestone ACK */}
        <Route path="/user_acknowledge/:projectId" element={
          <ProtectedRoute><UserAck /></ProtectedRoute>
        } />

        {/* ✅ NEW — Task ACK */}
        <Route path="/user_acknowledge_task/:projectId/:milestoneId/:parentTaskId/:taskDtlId" element={
          <ProtectedRoute><UserAcknowledgeTask /></ProtectedRoute>
        } />

        {/* ── User Dashboard ── */}
        <Route path="/user_dashboard" element={
          <ProtectedRoute><UserDashboard /></ProtectedRoute>
        } />

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
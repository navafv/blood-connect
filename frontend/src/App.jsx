import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// --- Layouts ---
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";

// --- Public Pages ---
import Home from "./pages/public/Home";
import SearchDonors from "./pages/public/SearchDonors";
import AboutUs from "./pages/public/AboutUs";
import DonorGuidelines from "./pages/public/DonorGuidelines";
import ContactUs from "./pages/public/ContactUs";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsOfService from "./pages/public/TermsOfService";

// --- Auth Pages ---
import Login from "./pages/auth/Login";
import RegisterOrg from "./pages/auth/RegisterOrg";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// --- Admin Pages ---
import Dashboard from "./pages/admin/Dashboard";
import ManageDonors from "./pages/admin/ManageDonors";
import AddDonor from "./pages/admin/AddDonor";
import ProfileSettings from "./pages/admin/settings/ProfileSettings";
import StaffManagement from "./pages/admin/settings/StaffManagement";
import BillingSubscription from "./pages/admin/settings/BillingSubscription";

// --- Super Admin Pages ---
import GlobalDashboard from "./pages/superadmin/GlobalDashboard";
import ManageOrganizations from "./pages/superadmin/ManageOrganizations";
import SystemLogs from "./pages/superadmin/SystemLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTES (Wrapped in Public Navbar/Footer)
            ========================================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchDonors />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/guidelines" element={<DonorGuidelines />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Route>

        {/* ==========================================
            AUTHENTICATION ROUTES (Standalone)
            ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-org" element={<RegisterOrg />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ==========================================
            SECURE ORG ADMIN ROUTES (Wrapped in Sidebar Layout)
            ========================================== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="donors" element={<ManageDonors />} />
            <Route path="add-donor" element={<AddDonor />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="settings/staff" element={<StaffManagement />} />
            <Route path="settings/billing" element={<BillingSubscription />} />
          </Route>
        </Route>

        {/* ==========================================
            SECURE SUPER ADMIN ROUTES
            ========================================== */}
        <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<GlobalDashboard />} />
            <Route path="organizations" element={<ManageOrganizations />} />
            <Route path="logs" element={<SystemLogs />} />
          </Route>
        </Route>

        {/* ==========================================
            FALLBACK ROUTE (404 Redirect)
            ========================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// --- Layouts (Kept synchronous so the app shell loads instantly) ---
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";

// --- Public Pages (Lazy Loaded) ---
const Home = lazy(() => import("./pages/public/Home"));
const SearchDonors = lazy(() => import("./pages/public/SearchDonors"));
const AboutUs = lazy(() => import("./pages/public/AboutUs"));
const DonorGuidelines = lazy(() => import("./pages/public/DonorGuidelines"));
const ContactUs = lazy(() => import("./pages/public/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/TermsOfService"));

// --- Auth Pages (Lazy Loaded) ---
const Login = lazy(() => import("./pages/auth/Login"));
const RegisterOrg = lazy(() => import("./pages/auth/RegisterOrg"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

// --- Admin Pages (Lazy Loaded) ---
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageDonors = lazy(() => import("./pages/admin/ManageDonors"));
const AddDonor = lazy(() => import("./pages/admin/AddDonor"));
const ProfileSettings = lazy(
  () => import("./pages/admin/settings/ProfileSettings"),
);
const StaffManagement = lazy(
  () => import("./pages/admin/settings/StaffManagement"),
);
const BillingSubscription = lazy(
  () => import("./pages/admin/settings/BillingSubscription"),
);

// --- Super Admin Pages (Lazy Loaded) ---
const GlobalDashboard = lazy(
  () => import("./pages/superadmin/GlobalDashboard"),
);
const ManageOrganizations = lazy(
  () => import("./pages/superadmin/ManageOrganizations"),
);
const ManageAds = lazy(() => import("./pages/superadmin/ManageAds"));
const ManageMessages = lazy(() => import("./pages/superadmin/ManageMessages"));
const ManageArchivedDonors = lazy(
  () => import("./pages/superadmin/ManageArchivedDonors"),
);
const SystemLogs = lazy(() => import("./pages/superadmin/SystemLogs"));

// --- Loading Fallback UI ---
const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-rose-500" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* Suspense catches the lazy-loaded components and shows the PageLoader while they fetch */}
      <Suspense fallback={<PageLoader />}>
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
              <Route
                path="settings/billing"
                element={<BillingSubscription />}
              />
            </Route>
          </Route>

          {/* ==========================================
              SECURE SUPER ADMIN ROUTES
              ========================================== */}
          <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<GlobalDashboard />} />
              <Route path="organizations" element={<ManageOrganizations />} />
              <Route path="ads" element={<ManageAds />} />
              <Route path="messages" element={<ManageMessages />} />
              <Route path="archives" element={<ManageArchivedDonors />} />
              <Route path="logs" element={<SystemLogs />} />
            </Route>
          </Route>

          {/* ==========================================
              FALLBACK ROUTE (404 Redirect)
              ========================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Droplet } from "lucide-react";
import ScrollToTop from "./hooks/useScrollRestoration";
import PageLoader from "./components/ui/PageLoader";

// --- Core Layouts ---
// Imported synchronously to ensure the application shell renders immediately.
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// --- Route-Level Code Splitting ---
// Public Domain
const Home = lazy(() => import("./pages/public/Home"));
const SearchDonors = lazy(() => import("./pages/public/SearchDonors"));
const AboutUs = lazy(() => import("./pages/public/AboutUs"));
const DonorGuidelines = lazy(() => import("./pages/public/DonorGuidelines"));
const ContactUs = lazy(() => import("./pages/public/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/TermsOfService"));
const OrganizationProfile = lazy(
  () => import("./pages/public/OrganizationProfile"),
);

// Authentication Domain
const Login = lazy(() => import("./pages/auth/Login"));
const RegisterOrg = lazy(() => import("./pages/auth/RegisterOrg"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

// Tenant Administration Domain
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageDonors = lazy(() => import("./pages/admin/ManageDonors"));
const AddDonor = lazy(() => import("./pages/admin/AddDonor"));
const Support = lazy(() => import("./pages/admin/Support"));
const ProfileSettings = lazy(
  () => import("./pages/admin/settings/ProfileSettings"),
);
const StaffManagement = lazy(
  () => import("./pages/admin/settings/StaffManagement"),
);
const BillingSubscription = lazy(
  () => import("./pages/admin/settings/BillingSubscription"),
);

// System Administration Domain
const GlobalDashboard = lazy(
  () => import("./pages/superadmin/GlobalDashboard"),
);
const ManageOrganizations = lazy(
  () => import("./pages/superadmin/ManageOrganizations"),
);
const ManageLocations = lazy(
  () => import("./pages/superadmin/ManageLocations"),
);
const ManageAds = lazy(() => import("./pages/superadmin/ManageAds"));
const ManageMessages = lazy(() => import("./pages/superadmin/ManageMessages"));
const SupportTickets = lazy(() => import("./pages/superadmin/SupportTickets"));
const ManageArchivedDonors = lazy(
  () => import("./pages/superadmin/ManageArchivedDonors"),
);
const SystemLogs = lazy(() => import("./pages/superadmin/SystemLogs"));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- Public Subgraph --- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchDonors />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/guidelines" element={<DonorGuidelines />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/hospital/:slug" element={<OrganizationProfile />} />
          </Route>

          {/* --- Authentication Subgraph --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-org" element={<RegisterOrg />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* --- Tenant Administration Subgraph --- */}
          {/* Base protection: Requires a valid login (STAFF or ADMIN) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* Standard Operations (Open to ORG_STAFF and ORG_ADMIN) */}
              <Route index element={<Dashboard />} />
              <Route path="donors" element={<ManageDonors />} />
              <Route path="add-donor" element={<AddDonor />} />
              <Route path="support" element={<Support />} />

              {/* Elevated Operations (Restricted to ORG_ADMIN only) */}
              <Route element={<ProtectedRoute requireOrgAdmin={true} />}>
                <Route path="settings" element={<ProfileSettings />} />
                <Route path="settings/staff" element={<StaffManagement />} />
                <Route
                  path="settings/billing"
                  element={<BillingSubscription />}
                />
              </Route>
            </Route>
          </Route>

          {/* --- System Administration Subgraph --- */}
          {/* Strict protection: Requires SUPER_ADMIN clearance */}
          <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<GlobalDashboard />} />
              <Route path="organizations" element={<ManageOrganizations />} />
              <Route path="locations" element={<ManageLocations />} />
              <Route path="ads" element={<ManageAds />} />
              <Route path="messages" element={<ManageMessages />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="archives" element={<ManageArchivedDonors />} />
              <Route path="logs" element={<SystemLogs />} />
            </Route>
          </Route>

          {/* Unmatched Routes Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./hooks/useScrollRestoration";
import PageLoader from "./components/ui/PageLoader";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// --- Core Layouts ---
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SessionExpiredModal } from "./components/auth/SessionExpiredModal";

// --- Route-Level Code Splitting ---
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

const Login = lazy(() => import("./pages/auth/Login"));
const RegisterOrg = lazy(() => import("./pages/auth/RegisterOrg"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageDonors = lazy(() => import("./pages/admin/ManageDonors"));
const AddDonor = lazy(() => import("./pages/admin/AddDonor"));
const Support = lazy(() => import("./pages/admin/Support"));
const ProfileSettings = lazy(
  () => import("./pages/admin/settings/ProfileSettings"),
);
const SecuritySettings = lazy(
  () => import("./pages/admin/settings/SecuritySettings"),
);
const BillingSubscription = lazy(
  () => import("./pages/admin/settings/BillingSubscription"),
);

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
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpiration = () => {
      setIsSessionExpired(true);
    };

    window.addEventListener("session-expired", handleSessionExpiration);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpiration);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Session Expired Modal catches 401 errors globally */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onClose={() => setIsSessionExpired(false)}
      />

      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary>
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
            <Route element={<ProtectedRoute requireOrgAdmin={true} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="donors" element={<ManageDonors />} />
                <Route path="add-donor" element={<AddDonor />} />
                <Route path="support" element={<Support />} />
                <Route path="settings" element={<ProfileSettings />} />
                <Route
                  path="settings/security"
                  element={<SecuritySettings />}
                />
                <Route
                  path="settings/billing"
                  element={<BillingSubscription />}
                />
              </Route>
            </Route>

            {/* --- System Administration Subgraph --- */}
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
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

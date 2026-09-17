import { BrowserRouter, Link, Route, Routes } from "react-router-dom"
import { AccountLayout, Layout, ProtectedRoute } from "./components/Layout"
import { AuthProvider } from "./context/AuthContext"
import HomePage from "./pages/HomePage"
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResendVerification,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages/AuthPages"
import { ExpertDetailPage, ExpertsPage } from "./pages/MarketplacePages"
import {
  JobDetailPage,
  JobsPage,
  ManageJobsPage,
  NewJobPage,
} from "./pages/JobPages"
import {
  BookingsPage,
  CheckoutPage,
  ContactPage,
  DashboardPage,
  LegalPage,
  NotificationsPage,
  ProfilePage,
} from "./pages/AccountPages"
import ExpertWorkspacePage from "./pages/ExpertWorkspacePage"
import AdminPage from "./pages/AdminPage"
import FaqPage from "./pages/FaqPage"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="experts" element={<ExpertsPage />} />
            <Route path="experts/:id" element={<ExpertDetailPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="legal/:type" element={<LegalPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FaqPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="jobs/new" element={<NewJobPage />} />
              <Route path="checkout/:paymentId" element={<CheckoutPage />} />
              <Route element={<AccountLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="jobs/manage" element={<ManageJobsPage />} />
                <Route path="expert/setup" element={<ExpertWorkspacePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute admin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="resend-verification" element={<ResendVerification />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="container narrow section empty-state">
      <div className="empty-mark">404</div>
      <h1>That page is not here.</h1>
      <p>The link may be old, or the page may have moved.</p>
      <Link className="btn btn-primary" to="/">
        Back home
      </Link>
    </div>
  )
}

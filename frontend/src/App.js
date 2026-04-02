import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import TestsPage from "./pages/TestsPage";
import TestPage from "./pages/TestPage";
import LoginPage from "./pages/LoginPage";
import PaymentPage from "./pages/PaymentPage";
import RegisterPage from "./pages/RegisterPage";
import ExamPage from "./pages/ExamPage";
import AdminCreatePage from "./pages/AdminCreatePage";
import AdminTestCreatePage from "./pages/AdminTestCreatePage";
import AdminTestEditPage from "./pages/AdminTestEditPage";
import ResultPage from "./pages/ResultPage";
import ResultsPage from "./pages/ResultsPage";
import VerifyCertificate from "./pages/VerifyCertificate";
import ResultPendingPage from "./pages/ResultPendingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuditLogPage from "./pages/AuditLogPage";
import AdminMessagesPage from "./pages/AdminMessagesPage";
import TestAnalyticsPage from "./pages/TestAnalyticsPage";
import AttemptAnalysisPage from "./pages/AttemptAnalysisPage";
import OtpPage from "./pages/OtpPage";
import AdminManualPaymentsPage from "./pages/AdminManualPaymentsPage";
import AdminReviewPage from "./pages/AdminReviewPage";
import { useAuth } from "./context/AuthContext";

// Autentifikatsiya himoyasi
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Admin himoyasi — foydalanuvchi tizimga kirgan va admin roli bo'lishi kerak
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/admin-login" replace />;
  if (user.role !== "admin") return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment/:testId" element={
        <ProtectedRoute>
          <PaymentPage />
        </ProtectedRoute>
      } />
      <Route path="/tests" element={<TestsPage />} />
      <Route path="/test/:id" element={<TestPage />} />
      <Route path="/test-analytics/:testId" element={
        <ProtectedRoute>
          <TestAnalyticsPage />
        </ProtectedRoute>
      } />
      <Route path="/attempt-analysis/:attemptId" element={
        <ProtectedRoute>
          <AttemptAnalysisPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/exam" element={
        <ProtectedRoute>
          <ExamPage />
        </ProtectedRoute>
      } />
      {/* Admin sahifalari — faqat admin roli bilan */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin-create" element={
        <ProtectedAdminRoute>
          <AdminCreatePage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin-test-create" element={
        <ProtectedAdminRoute>
          <AdminTestCreatePage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/tests/:testId/edit" element={
        <ProtectedAdminRoute>
          <AdminTestEditPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/results" element={
        <ProtectedAdminRoute>
          <ResultsPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/pre-rasch-review" element={
        <ProtectedAdminRoute>
          <AdminReviewPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/result-pending" element={<ResultPendingPage />} />
      <Route path="/verify/:testId" element={<VerifyCertificate />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/admin/audit-log" element={
        <ProtectedAdminRoute>
          <AuditLogPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/messages" element={
        <ProtectedAdminRoute>
          <AdminMessagesPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/manual-payments" element={
        <ProtectedAdminRoute>
          <AdminManualPaymentsPage />
        </ProtectedAdminRoute>
      } />
      <Route path="/otp" element={<OtpPage />} />
    </Routes>
  );
}

export default App;
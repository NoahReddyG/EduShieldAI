import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import ExamPage from '../pages/ExamPage';
import ReportPage from '../pages/ReportPage';
import { getStoredUser } from '../services/authService';

/** Require any authenticated user */
function ProtectedRoute({ children }) {
  const user = getStoredUser();
  return user ? children : <Navigate to="/" replace />;
}

/** Require a specific role; redirects to the right dashboard if wrong role */
function RoleRoute({ role, children }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'FACULTY' ? '/teacher' : '/student'} replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Teacher-only */}
        <Route
          path="/teacher"
          element={
            <RoleRoute role="FACULTY">
              <TeacherDashboard />
            </RoleRoute>
          }
        />

        {/* Student-only */}
        <Route
          path="/student"
          element={
            <RoleRoute role="STUDENT">
              <StudentDashboard />
            </RoleRoute>
          }
        />

        {/* Exam — student only */}
        <Route
          path="/exam/:testId"
          element={
            <RoleRoute role="STUDENT">
              <ExamPage />
            </RoleRoute>
          }
        />

        {/* Report — both roles */}
        <Route
          path="/report/:sessionId"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy exam route */}
        <Route path="/exam" element={<Navigate to="/student" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

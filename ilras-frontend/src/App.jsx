import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentLayout from './components/StudentLayout';
import Courses from './pages/Courses';
import Saved from './pages/Saved';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import FacultyLayout from './components/FacultyLayout';
import ManageCourses from './pages/ManageCourses';
import Students from './pages/Students';
import FacultyAnalytics from './pages/FacultyAnalytics';
import FacultySettings from './pages/FacultySettings';

// Import Theme Context
import { ThemeProvider } from './context/ThemeContext';

// Role-Based Access Control Wrapper
const ProtectedRoute = ({ children, allowedRole, currentUserRole }) => {
  if (currentUserRole !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // Initial role set from localStorage to persist across reloads
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem('userRole') || 'student');

  return (
    <ThemeProvider>
      <Router>

        <Routes>
          <Route path="/" element={<Navigate to={currentUserRole === 'student' ? '/student-dashboard' : currentUserRole === 'faculty' ? '/faculty-dashboard' : currentUserRole === 'admin' ? '/admin-dashboard' : '/login'} replace />} />
          <Route path="/login" element={<Login onLogin={setCurrentUserRole} />} />
          <Route path="/signup" element={<Signup onLogin={setCurrentUserRole} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Student Routes */}
          <Route
            element={
              <ProtectedRoute allowedRole="student" currentUserRole={currentUserRole}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Faculty Routes */}
          <Route
            element={
              <ProtectedRoute allowedRole="faculty" currentUserRole={currentUserRole}>
                <FacultyLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
            <Route path="/manage-courses" element={<ManageCourses />} />
            <Route path="/students" element={<Students />} />
            <Route path="/faculty-analytics" element={<FacultyAnalytics />} />
            <Route path="/faculty-settings" element={<FacultySettings />} />
          </Route>

          {/* Admin Route [cite: 35] */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin" currentUserRole={currentUserRole}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Fallback  */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
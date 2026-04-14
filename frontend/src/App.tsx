import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/services/authStore';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import QuestionBank from '@/pages/questions/QuestionBank';
import AssessmentList from '@/pages/assessments/AssessmentList';
import AssessmentForm from '@/pages/assessments/AssessmentForm';
import ExamInterface from '@/pages/exam/ExamInterface';
import FacultyMonitoring from '@/pages/dashboard/FacultyMonitoring';
import AssignmentList from '@/pages/assignments/AssignmentList';
import StudentAssignments from '@/pages/assignments/StudentAssignments';
import AttendanceList from '@/pages/attendance/AttendanceList';
import StudentAttendance from '@/pages/attendance/StudentAttendance';
import ReportsList from '@/pages/reports/ReportsList';
import UserManagement from '@/pages/admin/UserManagement';
import type { UserRole } from '@/types';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <QuestionBank />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssessmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssessmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssessmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssignmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-assignments"
        element={
          <ProtectedRoute>
            <StudentAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:testId"
        element={
          <ProtectedRoute>
            <ExamInterface />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring/:sessionId"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <FacultyMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AttendanceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-attendance"
        element={
          <ProtectedRoute>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
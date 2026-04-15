import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/services/authStore';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import QuestionBank from '@/pages/questions/QuestionBank';
import QuestionForm from '@/pages/questions/QuestionForm';
import { QuestionBulkReviewPage } from '@/pages/questions/QuestionBulkReview';
import AssessmentList from '@/pages/assessments/AssessmentList';
import AssessmentForm from '@/pages/assessments/AssessmentForm';
import ExamInterface from '@/pages/exam/ExamInterface';
import FacultyMonitoring from '@/pages/dashboard/FacultyMonitoring';
import AssignmentList from '@/pages/assignments/AssignmentList';
import AssignmentForm from '@/pages/assignments/AssignmentForm';
import AssignmentDetails from '@/pages/assignments/AssignmentDetails';
import AssignmentAttempt from '@/pages/assignments/AssignmentAttempt';
import AssignmentSubmissions from '@/pages/assignments/AssignmentSubmissions';
import AssignmentGrading from '@/pages/assignments/AssignmentGrading';
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
        path="/questions/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <QuestionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <QuestionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/bulk-review"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <QuestionBulkReviewPage />
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
        path="/assignments/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssignmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssignmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id"
        element={
          <ProtectedRoute>
            <AssignmentDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id/attempt"
        element={
          <ProtectedRoute>
            <AssignmentAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id/submissions"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssignmentSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/submissions/:submissionId/grade"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <AssignmentGrading />
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
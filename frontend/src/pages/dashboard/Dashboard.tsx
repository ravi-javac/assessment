import { useAuthStore } from '@/services/authStore';
import { authApi } from '@/services/api';
import { LogOut, BookOpen, Users, ClipboardList, BarChart3, FileText, GraduationCap, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  count?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (res.success) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
      setLoading(false);
    }
  };

  const studentMenu: MenuItem[] = [
    { icon: BookOpen, label: 'My Assessments', path: '/my-assessments' },
    { icon: FileText, label: 'Assignments', path: '/my-assignments' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/my-attendance' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const facultyMenu: MenuItem[] = [
    { icon: BookOpen, label: 'Assessments', path: '/assessments' },
    { icon: ClipboardList, label: 'Question Bank', path: '/questions' },
    { icon: FileText, label: 'Assignments', path: '/assignments' },
    { icon: Users, label: 'Attendance', path: '/attendance' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const adminMenu: MenuItem[] = [
    { icon: BookOpen, label: 'Assessments', path: '/assessments' },
    { icon: ClipboardList, label: 'Question Bank', path: '/questions' },
    { icon: FileText, label: 'Assignments', path: '/assignments' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenu;
      case 'faculty':
        return facultyMenu;
      default:
        return studentMenu;
    }
  };

  const menuItems = getMenuItems();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'faculty':
        return 'Faculty Dashboard';
      default:
        return 'Student Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">Sameeksha.AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{getWelcomeMessage()}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item) => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <item.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {user?.role === 'faculty' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Your Assigned Batches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {user?.assignedBatches && user.assignedBatches.length > 0 ? (
                user.assignedBatches.map((batch: any) => (
                  <div key={batch.id} className="card bg-white border-l-4 border-l-indigo-500 py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/attendance?batchId=${batch.id}`)}>
                    <p className="font-bold text-gray-900">{batch.name}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter">{batch.courseId || 'Academic Batch'}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-6 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                  <p className="text-sm text-indigo-700 font-medium">No batches assigned yet. Please contact admin.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {user?.role === 'student' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Assessments</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">No upcoming assessments</p>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scores</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">No scores yet</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/assessments')}
                  className="w-full text-left p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <span className="font-medium">Create New Assessment</span>
                </button>
                <button 
                  onClick={() => navigate('/questions')}
                  className="w-full text-left p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">Add Questions</span>
                </button>
                <button 
                  onClick={() => navigate('/assignments')}
                  className="w-full text-left p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">Create Assignment</span>
                </button>
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="font-medium">-</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <p className="font-medium">-</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
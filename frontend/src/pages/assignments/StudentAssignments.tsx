import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { AssignmentSubmission } from '@/types/assignment';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  BookOpen,
  Calendar,
  Search
} from 'lucide-react';

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await assignmentApi.getMySubmissions();
      if (response.success) {
        setSubmissions(response.data || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    (s.assignment?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-50 text-green-700 border-green-100';
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'returned': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'not_submitted': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_submitted': return 'Assigned';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-sm text-gray-500">Track your learning progress and upcoming deadlines</p>
        </div>

        <div className="card mb-8 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assignments..."
              className="input pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-48 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No assignments assigned</h3>
            <p className="text-gray-500 mt-1">Your assigned coursework will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((sub) => {
              const assignment = sub.assignment;
              if (!assignment) return null;
              
              const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
              
              return (
                <div 
                  key={sub.id} 
                  className="card group hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => navigate(`/assignments/${assignment.id}`)}
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                      {isOverdue && (sub.status === 'not_submitted' || sub.status === 'in_progress') && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase">
                          <AlertCircle size={12} /> Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-4 line-clamp-1">
                      {assignment.title}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <FileText size={14} className="text-gray-400" />
                        <span>{assignment.totalMarks} Marks Available</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between group-hover:bg-primary-50 transition-colors">
                    <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">View Details</span>
                    <ChevronRight size={16} className="text-primary-600 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
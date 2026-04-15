import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { Assignment, AssignmentSubmission } from '@/types/assignment';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  MoreVertical,
  Download,
  FileText,
  Users
} from 'lucide-react';

export default function AssignmentSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (assignmentId: string) => {
    try {
      const [assignRes, subRes] = await Promise.all([
        assignmentApi.get(assignmentId),
        assignmentApi.getSubmissions(assignmentId)
      ]);

      if (assignRes.success) setAssignment(assignRes.data);
      if (subRes.success) setSubmissions(subRes.data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const studentName = `${s.student?.firstName} ${s.student?.lastName}`.toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || s.student?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!assignment) return <div className="p-8 text-center text-red-600">Assignment not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/assignments')} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
          >
            <ArrowLeft size={20}/>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title} - Submissions</h1>
            <p className="text-sm text-gray-500">Review and grade student work</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Enrolled', value: submissions.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Submitted', value: submissions.filter(s => s.status !== 'not_submitted').length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Graded', value: submissions.filter(s => s.status === 'graded').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending', value: submissions.filter(s => s.status === 'submitted').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="card p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24}/>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input type="text" placeholder="Search by student name or email..." className="input pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            </div>
            <div className="flex gap-2">
               <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                 <option value="all">All Statuses</option>
                 <option value="submitted">Submitted</option>
                 <option value="graded">Graded</option>
                 <option value="returned">Returned</option>
               </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Attempt</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Marks</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Submitted At</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                          {sub.student?.firstName?.[0]}{sub.student?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{sub.student?.firstName} {sub.student?.lastName}</p>
                          <p className="text-xs text-gray-500">{sub.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        sub.status === 'graded' ? 'bg-green-50 text-green-700 border-green-100' :
                        sub.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      #{sub.attemptNumber}
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 'graded' ? (
                        <span className="text-sm font-bold text-gray-900">{sub.marksObtained} / {assignment.totalMarks}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not Graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status !== 'not_submitted' && (
                        <button 
                          onClick={() => navigate(`/assignments/submissions/${sub.id}/grade`)}
                          className="btn btn-primary text-xs py-1.5 flex items-center gap-1 ml-auto"
                        >
                          <Eye size={14}/> {sub.status === 'graded' ? 'Review' : 'Grade'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
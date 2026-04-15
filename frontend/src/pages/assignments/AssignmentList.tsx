import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import { useAuthStore } from '@/services/authStore';
import type { Assignment, AssignmentStatus } from '@/types/assignment';
import { 
  Plus, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Calendar,
  BookOpen,
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  Mail,
  UserPlus,
  CheckCircle2,
  X,
  Send
} from 'lucide-react';
import { Modal } from '@/components/PopupMenu';

export default function AssignmentList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignType, setAssignType] = useState<'email' | 'batch'>('email');
  const [emails, setEmails] = useState('');
  const [batchId, setBatchId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [statusFilter]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (statusFilter !== 'all') filter.status = statusFilter;
      
      const response = await assignmentApi.getAll(filter);
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await assignmentApi.publish(id);
      loadAssignments();
    } catch (error) {
      console.error('Publish error:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await assignmentApi.approve(id);
      loadAssignments();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await assignmentApi.delete(id);
      if (res.success) {
        loadAssignments();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete assignment');
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedAssignment) return;
    setAssigning(true);
    try {
      if (assignType === 'email') {
        const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
        if (emailList.length === 0) return;
        const res = await assignmentApi.assignToEmails(selectedAssignment.id, emailList);
        if (res.success) {
          alert(`Successfully assigned to ${res.data.success} students. ${res.data.failed} failed (not found).`);
          setShowAssignModal(false);
          setEmails('');
        }
      } else {
        if (!batchId.trim()) return;
        const res = await assignmentApi.assignToBatch(selectedAssignment.id, batchId);
        if (res.success) {
          alert(`Successfully assigned to ${res.data.success} students in batch.`);
          setShowAssignModal(false);
          setBatchId('');
        }
      }
    } catch (error) {
      console.error('Assign error:', error);
      alert('Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border-green-100';
      case 'closed': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
              <p className="text-sm text-gray-500">Manage continuous assessments and learning materials</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/assignments/new')}
            className="btn btn-primary flex items-center gap-2 self-start"
          >
            <Plus size={20} />
            Create Assignment
          </button>
        </div>

        <div className="card mb-8 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search assignments..."
                className="input pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="input w-40"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-64 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No assignments found</h3>
            <p className="text-gray-500 mt-1">Get started by creating your first assignment</p>
            <button 
              onClick={() => navigate('/assignments/new')}
              className="mt-6 text-primary-600 font-semibold hover:underline"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="card group hover:shadow-xl transition-all duration-300 flex flex-col h-full border-t-4 border-t-primary-500">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      {assignment.isAdminApproved && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-blue-100 bg-blue-50 text-blue-700 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Approved
                        </span>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-1">
                    {assignment.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10 italic">
                    {assignment.description || 'No description provided.'}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Deadline</p>
                        <p className="font-medium">
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Deadline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Material</p>
                        <p className="font-medium">
                          {assignment.readingMaterials?.length || 0} Resources Attached
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-primary-600 text-xs font-bold">
                        {assignment.totalSubmissions}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-600 text-xs font-bold">
                        {assignment.gradedSubmissions}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {assignment.totalSubmissions > 0 
                        ? `${Math.round((assignment.gradedSubmissions / assignment.totalSubmissions) * 100)}% graded`
                        : 'No submissions'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link 
                      to={`/assignments/${assignment.id}/edit`}
                      className="flex-1 min-w-[70px] btn bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-xs py-2 flex items-center justify-center gap-1"
                    >
                      <Edit size={14} />
                      Edit
                    </Link>
                    
                    {user?.role === 'admin' && !assignment.isAdminApproved && (
                      <button 
                        onClick={() => handleApprove(assignment.id)}
                        className="flex-1 min-w-[70px] btn bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                    )}

                    {(user?.role === 'admin' || user?.role === 'faculty') && (
                      <button 
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowAssignModal(true);
                        }}
                        className="flex-1 min-w-[70px] btn bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100 text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <UserPlus size={14} />
                        Assign
                      </button>
                    )}
                    
                    <Link 
                      to={`/assignments/${assignment.id}/submissions`}
                      className="flex-1 min-w-[70px] btn btn-primary text-xs py-2 flex items-center justify-center gap-1"
                    >
                      <Users size={14} />
                      Review
                    </Link>

                    {(user?.role === 'admin' || user?.role === 'faculty') && (
                      <button 
                        onClick={() => handleDelete(assignment.id)}
                        className="btn bg-red-50 border-red-100 text-red-600 hover:bg-red-100 p-2 flex items-center justify-center"
                        title="Delete Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => !assigning && setShowAssignModal(false)}
        title="Assign Assignment"
        size="md"
      >
        <div className="p-4 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setAssignType('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                assignType === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail size={16} />
              By Emails
            </button>
            <button
              onClick={() => setAssignType('batch')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                assignType === 'batch' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={16} />
              By Batch
            </button>
          </div>

          <div className="space-y-4">
            {assignType === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Emails</label>
                <textarea
                  className="input min-h-[120px]"
                  placeholder="Enter emails separated by commas (e.g. student1@mail.com, student2@mail.com)"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  Multiple emails can be pasted at once.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. BATCH-2024-A"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Assign to all students currently registered in this batch.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowAssignModal(false)}
              disabled={assigning}
              className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignSubmit}
              disabled={assigning || (assignType === 'email' ? !emails.trim() : !batchId.trim())}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2"
            >
              {assigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Assign Now
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
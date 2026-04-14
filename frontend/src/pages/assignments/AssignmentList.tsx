import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { Assignment } from '@/types/assignment';
import { Plus, FileText, Clock, Users, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    totalMarks: 100,
    allowLateSubmission: false,
    allowFileUpload: true,
    allowTextSubmission: true,
  });

  const courseId = 'default-course';

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

  const loadAssignments = async () => {
    try {
      const response = await assignmentApi.getByCourse(courseId);
      if (response.success) setAssignments(response.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await assignmentApi.create({ ...formData, courseId });
      if (response.success) {
        setShowForm(false);
        loadAssignments();
      }
    } catch (error) {
      console.error('Create error:', error);
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      closed: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} /> Create Assignment
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">New Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowFileUpload}
                    onChange={(e) => setFormData({ ...formData, allowFileUpload: e.target.checked })}
                  />
                  Allow File Upload
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowTextSubmission}
                    onChange={(e) => setFormData({ ...formData, allowTextSubmission: e.target.checked })}
                  />
                  Allow Text Submission
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  />
                  Allow Late Submission
                </label>
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{assignment.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    {assignment.description && (
                      <p className="text-gray-600 mb-2">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={16} /> {assignment.totalMarks} marks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={16} /> {assignment.totalSubmissions} submissions
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {assignment.status === 'draft' && (
                      <button onClick={() => handlePublish(assignment.id)} className="btn btn-secondary text-sm">
                        Publish
                      </button>
                    )}
                    <Link to={`/assignments/${assignment.id}/submissions`} className="btn btn-primary text-sm">
                      View Submissions
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
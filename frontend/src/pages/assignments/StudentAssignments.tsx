import { useState, useEffect } from 'react';
import { assignmentApi } from '@/services/assignmentApi';
import type { Assignment } from '@/types/assignment';
import { FileText, Clock, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await assignmentApi.getMySubmissions();
      if (response.success) setAssignments(response.data.map((s: any) => s.assignment).filter(Boolean));
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!submissionText.trim()) return;
    setSubmitting(true);
    try {
      await assignmentApi.submit({ assignmentId, textContent: submissionText });
      alert('Submitted successfully!');
      setSubmissionText('');
      setSelectedAssignment(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assignments</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No assignments available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isPast = isOverdue(assignment.dueDate);
              return (
                <div key={assignment.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        {isPast ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            <AlertCircle size={14} /> Overdue
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            <CheckCircle size={14} /> Active
                          </span>
                        )}
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
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAssignment(selectedAssignment?.id === assignment.id ? null : assignment)}
                      className="btn btn-primary"
                    >
                      Submit
                    </button>
                  </div>

                  {selectedAssignment?.id === assignment.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Your Submission</h4>
                      {assignment.allowTextSubmission && (
                        <textarea
                          className="input h-32 mb-2"
                          placeholder="Enter your answer..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                        />
                      )}
                      {assignment.allowFileUpload && (
                        <p className="text-sm text-gray-500 mb-2">File upload: Coming soon</p>
                      )}
                      <button
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={submitting || !submissionText}
                        className="btn btn-primary"
                      >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
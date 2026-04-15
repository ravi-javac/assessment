import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { Assignment, AssignmentSubmission } from '@/types/assignment';
import { 
  FileText, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  Download,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Shield
} from 'lucide-react';

export default function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (assignmentId: string) => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        assignmentApi.get(assignmentId),
        assignmentApi.getMySubmissions()
      ]);

      if (assignRes.success) {
        setAssignment(assignRes.data);
      }
      
      if (subRes.success) {
        const mySub = subRes.data.find((s: any) => s.assignmentId === assignmentId);
        setSubmission(mySub || null);
      }
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Assignment Not Found</h2>
        <button onClick={() => navigate('/my-assignments')} className="mt-4 text-primary-600 font-medium">
          Go back to my assignments
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/my-assignments')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Assignments</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <header className="card p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  assignment.status === 'published' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {assignment.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
                  {assignment.type.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{assignment.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{assignment.description}</p>
            </header>

            {assignment.instructions && (
              <section className="card p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-primary-600" />
                  Instructions
                </h2>
                <div className="prose prose-primary max-w-none text-gray-600">
                  {assignment.instructions}
                </div>
              </section>
            )}

            {assignment.readingMaterials && assignment.readingMaterials.length > 0 && (
              <section className="card p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary-600" />
                  Learning Resources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.readingMaterials.map((material, idx) => (
                    <a 
                      key={idx}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary-600">
                          {material.type === 'video' ? <Shield size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{material.title}</p>
                          <p className="text-xs text-gray-500 uppercase">{material.type}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-300 group-hover:text-primary-600" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <aside className="card p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b">
                <Calendar size={18} className="text-primary-600" />
                Assignment Summary
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Deadline</span>
                  <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Marks</span>
                  <span className="font-bold text-gray-900">{assignment.totalMarks} Marks</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Attempts</span>
                  <span className="font-bold text-gray-900">
                    {submission?.attemptNumber || 0} / {assignment.maxAttempts || 'Unlimited'}
                  </span>
                </div>
                {submission && (
                  <div className="flex justify-between items-center text-sm pt-4 border-t">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                )}
              </div>

              {submission?.status === 'graded' ? (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 mb-6 text-center">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Score Obtained</p>
                  <p className="text-3xl font-black text-green-700">
                    {submission.marksObtained} <span className="text-sm font-normal text-green-600">/ {assignment.totalMarks}</span>
                  </p>
                  {submission.feedback && (
                    <div className="mt-3 pt-3 border-t border-green-200 text-left">
                      <p className="text-[10px] text-green-600 font-bold uppercase mb-1">Feedback</p>
                      <p className="text-sm text-green-800 italic">"{submission.feedback}"</p>
                    </div>
                  )}
                </div>
              ) : null}

              <button 
                onClick={() => navigate(`/assignments/${assignment.id}/attempt`)}
                disabled={assignment.status !== 'published' || (assignment.maxAttempts > 0 && (submission?.attemptNumber || 0) >= assignment.maxAttempts)}
                className="w-full btn btn-primary py-3 rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 font-bold"
              >
                {submission ? 'Resume Assignment' : 'Start Assignment'}
                <ChevronRight size={20} />
              </button>
              
              {isOverdue && !assignment.allowLateSubmission && (
                <p className="text-xs text-red-500 text-center mt-4 font-medium flex items-center justify-center gap-1">
                  <AlertCircle size={14} />
                  Submission window is closed
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
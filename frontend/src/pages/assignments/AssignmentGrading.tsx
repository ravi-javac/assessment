import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { AssignmentSubmission } from '@/types/assignment';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Save,
  User,
  Clock,
  MessageSquare
} from 'lucide-react';

export default function AssignmentGrading() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [gradeData, setGradeData] = useState({
    marksObtained: 0,
    feedback: ''
  });

  useEffect(() => {
    if (submissionId) loadSubmission(submissionId);
  }, [submissionId]);

  const loadSubmission = async (id: string) => {
    try {
      const res = await assignmentApi.getSubmission(id);
      if (res.success) {
        setSubmission(res.data);
        setGradeData({
          marksObtained: Number(res.data.marksObtained) || 0,
          feedback: res.data.feedback || ''
        });
      }
    } catch (err) {
      setError('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      const res = await assignmentApi.grade(submission.id, gradeData);
      if (res.success) {
        navigate(`/assignments/${submission.assignmentId}/submissions`);
      }
    } catch (err: any) {
      setError(err.message || 'Grading failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!submission) return <div className="p-8 text-center text-red-600">Submission not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/assignments/${submission.assignmentId}/submissions`)} 
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
            >
              <ArrowLeft size={20}/>
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grade Submission</h1>
              <p className="text-sm text-gray-500">Student: {submission.student?.firstName} {submission.student?.lastName}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={handleGrade} 
               disabled={saving} 
               className="btn btn-primary flex items-center gap-2"
             >
               <Save size={18}/>
               {saving ? 'Saving...' : 'Finalize Grade'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="card p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-primary-600"/>
                Student Response
              </h2>
              
              {submission.textContent ? (
                <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Written Response</p>
                  <div className="prose prose-primary max-w-none text-gray-700 whitespace-pre-wrap">
                    {submission.textContent}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 italic mb-8">No written response provided.</div>
              )}

              {submission.answers && submission.answers.length > 0 && (
                <div className="space-y-8">
                   <h3 className="font-bold text-gray-900 border-b pb-4">Question Breakdown</h3>
                   {submission.answers.map((answer, idx) => (
                     <div key={idx} className="space-y-4">
                       <div className="flex justify-between items-start">
                         <div className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</span>
                            <h4 className="font-bold text-gray-900">{answer.question?.title}</h4>
                         </div>
                         <div className="text-xs font-bold px-2 py-1 bg-primary-50 text-primary-700 rounded capitalize">{answer.question?.type}</div>
                       </div>
                       
                       <div className="ml-9 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                         {answer.question?.type === 'mcq' && (
                           <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase font-bold">Selected Option</p>
                              <div className="flex items-center gap-2">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${answer.mcqAnswer?.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {answer.mcqAnswer?.selectedOption}
                                </span>
                                <span className="text-sm font-medium">{answer.mcqAnswer?.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}</span>
                              </div>
                           </div>
                         )}
                         {answer.question?.type === 'subjective' && (
                           <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase font-bold">Student Answer</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap italic">"{answer.answer}"</p>
                           </div>
                         )}
                         {answer.question?.type === 'coding' && (
                           <div className="space-y-2">
                              <p className="text-xs text-gray-400 uppercase font-bold">Source Code ({answer.codingAnswer?.language})</p>
                              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
                                {answer.codingAnswer?.code}
                              </pre>
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </section>

            {submission.files && submission.files.length > 0 && (
              <section className="card p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Download size={20} className="text-primary-600"/>
                  Uploaded Files
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submission.files.map((file, idx) => (
                    <a 
                      key={idx} 
                      href={file.url} 
                      target="_blank" 
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="text-primary-500" size={20}/>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Download size={16} className="text-gray-300 group-hover:text-primary-600" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="card p-6 sticky top-8 border-t-4 border-t-primary-600">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b">
                <CheckCircle size={18} className="text-primary-600"/>
                Evaluation
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Score</label>
                    <span className="text-xs text-gray-400">Out of {submission.assignment?.totalMarks}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="input text-2xl font-black text-primary-600 pr-12" 
                      value={gradeData.marksObtained} 
                      onChange={e => setGradeData({ ...gradeData, marksObtained: Number(e.target.value) })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-300">/ {submission.assignment?.totalMarks}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Feedback</label>
                  <textarea 
                    className="input min-h-[150px] text-sm" 
                    placeholder="Provide constructive feedback..." 
                    value={gradeData.feedback} 
                    onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })}
                  />
                </div>

                <div className="space-y-3 pt-4 border-t">
                   <div className="flex items-center gap-3 text-xs text-gray-500">
                     <Clock size={14}/>
                     <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                   </div>
                   {submission.isLate && (
                     <div className="flex items-center gap-3 text-xs text-red-600 font-bold">
                       <AlertCircle size={14}/>
                       <span>Late Submission</span>
                     </div>
                   )}
                   <div className="flex items-center gap-3 text-xs text-gray-500">
                     <User size={14}/>
                     <span>Attempt: #{submission.attemptNumber}</span>
                   </div>
                </div>

                <button 
                  onClick={handleGrade} 
                  disabled={saving} 
                  className="w-full btn btn-primary py-4 rounded-xl shadow-lg shadow-primary-200 font-bold"
                >
                  {saving ? 'Saving...' : 'Finalize Grade'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
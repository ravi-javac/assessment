import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import type { 
  Assignment, 
  AssignmentSubmission, 
  AttemptAnswer 
} from '@/types/assignment';
import type { Question } from '@/types/question';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  BookOpen,
  Upload,
  X,
  Code,
  ArrowLeft
} from 'lucide-react';

export default function AssignmentAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentStep, setCurrentStep] = useState<'reading' | 'questions'>('reading');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [textContent, setTextContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string, url: string, size: number }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    if (id) loadAssignment(id);
  }, [id]);

  const loadAssignment = async (assignmentId: string) => {
    try {
      const res = await assignmentApi.get(assignmentId);
      if (res.success) {
        setAssignment(res.data);
        if (!res.data.readingMaterials?.length) {
          setCurrentStep('questions');
        }
      }
    } catch (err) {
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await assignmentApi.saveFile(formData);
      if (res.success) {
        setUploadedFiles([...uploadedFiles, res.data]);
      }
    } catch (err) {
      alert('File upload failed');
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
  };

  const handleAnswerChange = (questionId: string, value: any, type: string) => {
    const newAnswers = { ...answers };
    if (type === 'mcq') {
      newAnswers[questionId] = { selectedOption: value };
    } else if (type === 'coding') {
      newAnswers[questionId] = { code: value, language: assignment?.questions?.find(q => q.questionId === questionId)?.question?.language || 'javascript' };
    } else {
      newAnswers[questionId] = value;
    }
    setAnswers(newAnswers);
  };

  const handleSubmit = async (status: 'submitted' | 'in_progress' = 'submitted') => {
    if (!assignment) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
        const q = assignment.questions?.find(aq => aq.questionId === questionId)?.question;
        const answer: any = { questionId };
        
        if (q?.type === 'mcq') answer.mcqAnswer = value;
        else if (q?.type === 'coding') answer.codingAnswer = value;
        else answer.answer = value;
        
        return answer;
      });

      const payload = {
        assignmentId: assignment.id,
        textContent,
        files: uploadedFiles,
        answers: formattedAnswers,
        status
      };

      const res = await assignmentApi.submit(payload);
      if (res.success) {
        if (status === 'submitted') {
          navigate(`/assignments/${assignment.id}`);
        } else {
          alert('Draft saved successfully');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!assignment) return <div className="p-8 text-center text-red-600">Assignment not found</div>;

  const questions = assignment.questions || [];
  const currentQuestion = questions[currentQuestionIdx]?.question;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/assignments/${assignment.id}`)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="font-bold text-gray-900">{assignment.title}</h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="capitalize">{currentStep} Step</span>
                {currentStep === 'questions' && <span>• Question {currentQuestionIdx + 1} of {questions.length}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => handleSubmit('in_progress')} disabled={submitting} className="btn bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-sm hidden md:flex items-center gap-2">
               <Save size={18}/> Save Draft
             </button>
             <button onClick={() => setShowSubmitConfirm(true)} className="btn btn-primary text-sm flex items-center gap-2">
               <Send size={18}/> Final Submit
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        {currentStep === 'reading' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BookOpen className="text-primary-600" size={28}/>
                Learning Resources
              </h2>
              <p className="text-gray-600 mb-8 italic">Please review the following materials before starting the questions.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignment.readingMaterials?.map((material, idx) => (
                  <a key={idx} href={material.url} target="_blank" className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-xl hover:border-primary-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                        {material.type === 'video' ? <Shield size={24}/> : <FileText size={24}/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{material.title}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">{material.type}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => setCurrentStep('questions')}
                className="btn btn-primary px-12 py-4 rounded-2xl shadow-xl shadow-primary-200 text-lg font-bold flex items-center gap-3"
              >
                Proceed to Questions
                <ChevronRight size={24}/>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {currentQuestion ? (
                <div className="card p-8 min-h-[500px] flex flex-col animate-in fade-in duration-300">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Question {currentQuestionIdx + 1}</span>
                      <h2 className="text-2xl font-bold text-gray-900 mt-1">{currentQuestion.title}</h2>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">{currentQuestion.marks} Marks</span>
                  </div>

                  <div className="prose prose-primary max-w-none mb-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.content}
                  </div>

                  <div className="flex-1">
                    {currentQuestion.type === 'mcq' && (
                      <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options?.map(opt => (
                          <label key={opt.key} className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${answers[currentQuestion.id]?.selectedOption === opt.key ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-50' : 'border-gray-100 hover:border-primary-200'}`}>
                            <input type="radio" className="hidden" name={currentQuestion.id} checked={answers[currentQuestion.id]?.selectedOption === opt.key} onChange={() => handleAnswerChange(currentQuestion.id, opt.key, 'mcq')}/>
                            <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold transition-colors ${answers[currentQuestion.id]?.selectedOption === opt.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{opt.key}</span>
                            <span className="text-lg text-gray-800">{opt.value}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'subjective' && (
                      <textarea 
                        className="input min-h-[300px] p-6 text-lg" 
                        placeholder="Type your answer here..." 
                        value={answers[currentQuestion.id] || ''} 
                        onChange={e => handleAnswerChange(currentQuestion.id, e.target.value, 'subjective')}
                      />
                    )}

                    {currentQuestion.type === 'coding' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-t-xl text-gray-300 text-xs font-mono">
                          <span>{currentQuestion.language || 'javascript'} editor</span>
                          <Code size={16}/>
                        </div>
                        <textarea 
                          className="w-full h-80 bg-gray-900 text-gray-100 p-6 font-mono text-sm rounded-b-xl focus:ring-2 focus:ring-primary-500 outline-none" 
                          spellCheck="false"
                          placeholder="// Write your code here..."
                          value={answers[currentQuestion.id]?.code || currentQuestion.codeTemplate || ''}
                          onChange={e => handleAnswerChange(currentQuestion.id, e.target.value, 'coding')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-12 pt-8 border-t">
                    <button 
                      disabled={currentQuestionIdx === 0} 
                      onClick={() => setCurrentQuestionIdx(v => v - 1)}
                      className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2 px-6"
                    >
                      <ChevronLeft size={20}/> Previous
                    </button>
                    <div className="flex gap-3">
                       <button onClick={() => handleSubmit('in_progress')} className="btn bg-white border-gray-200 text-gray-700 hidden md:flex items-center gap-2">
                         <Save size={18}/> Draft
                       </button>
                       {currentQuestionIdx < questions.length - 1 ? (
                         <button onClick={() => setCurrentQuestionIdx(v => v + 1)} className="btn btn-primary flex items-center gap-2 px-8">
                           Next Question <ChevronRight size={20}/>
                         </button>
                       ) : (
                         <button onClick={() => setShowSubmitConfirm(true)} className="btn btn-primary bg-green-600 hover:bg-green-700 border-none flex items-center gap-2 px-8">
                           Review & Submit <CheckCircle size={20}/>
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Upload className="text-primary-600" size={28}/>
                    Final Submission
                  </h2>
                  <div className="space-y-6">
                    {assignment.allowTextSubmission && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Final Remarks / Summary</label>
                        <textarea className="input min-h-[200px]" placeholder="Anything else you'd like to add..." value={textContent} onChange={e => setTextContent(e.target.value)}/>
                      </div>
                    )}
                    {assignment.allowFileUpload && (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Upload Support Files</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors bg-white group">
                          <input type="file" id="file-upload" className="hidden" multiple={assignment.maxFiles > 1} onChange={handleFileUpload}/>
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4 group-hover:text-primary-500 transition-colors" />
                            <p className="text-gray-600 font-bold">Click to upload files</p>
                            <p className="text-xs text-gray-400 mt-1">Allowed: {assignment.allowedFileTypes?.join(', ') || 'Any'} (Max {assignment.maxFileSizeMB}MB)</p>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {uploadedFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-primary-500 flex-shrink-0" size={18}/>
                                <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                              </div>
                              <button onClick={() => removeFile(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={16}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-12 flex justify-between pt-8 border-t">
                     <button onClick={() => setCurrentQuestionIdx(questions.length - 1)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2">
                       <ChevronLeft size={20}/> Back to Questions
                     </button>
                     <button onClick={() => setShowSubmitConfirm(true)} className="btn btn-primary px-12 py-3">Submit Now</button>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-1 space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4 border-b pb-4">Navigation</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setCurrentStep('reading')} className={`w-full p-2 rounded-lg flex items-center justify-center border-2 transition-all ${currentStep === 'reading' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-100 hover:bg-gray-50'}`} title="Reading Material">
                    <BookOpen size={18}/>
                  </button>
                  {questions.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setCurrentStep('questions'); setCurrentQuestionIdx(i); }}
                      className={`w-full h-10 rounded-lg font-bold text-sm transition-all border-2 ${
                        currentStep === 'questions' && currentQuestionIdx === i ? 'border-primary-600 bg-primary-600 text-white' : 
                        answers[questions[i].questionId] ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => { setCurrentStep('questions'); setCurrentQuestionIdx(questions.length); }}
                    className={`w-full p-2 rounded-lg flex items-center justify-center border-2 transition-all ${currentStep === 'questions' && currentQuestionIdx === questions.length ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-100 hover:bg-gray-50'}`}
                    title="Submission"
                  >
                    <Upload size={18}/>
                  </button>
                </div>
              </div>

              {assignment.durationMinutes > 0 && (
                <div className="card p-6 bg-primary-900 text-white">
                   <div className="flex items-center gap-3 mb-2">
                     <Clock size={20}/>
                     <span className="text-sm font-bold uppercase tracking-widest opacity-80">Remaining Time</span>
                   </div>
                   <p className="text-3xl font-black font-mono">--:--</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send size={40}/>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Final Submission?</h3>
            <p className="text-gray-500 mb-8">You are about to submit your assignment. Once submitted, you cannot change your answers unless allowed by the faculty.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleSubmit('submitted')} disabled={submitting} className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { questionApi } from '@/services/questionApi';
import { 
  ArrowLeft, Save, Plus, Trash2, HelpCircle, Code, 
  FileText, Database, CheckCircle, AlertCircle, X, Beaker,
  Check, Info, UploadCloud
} from 'lucide-react';
import { Modal } from '@/components/PopupMenu';
import type { QuestionType, QuestionDifficulty, Question, TestCase } from '@/types/question';

export default function QuestionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as QuestionType) || 'mcq';
  
  const [type, setType] = useState<QuestionType>(initialType);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Question>>({
    title: '',
    content: '',
    type: initialType,
    difficulty: 'medium',
    marks: 1,
    tags: [],
    options: [
      { key: 'A', value: '', isCorrect: true },
      { key: 'B', value: '', isCorrect: false },
      { key: 'C', value: '', isCorrect: false },
      { key: 'D', value: '', isCorrect: false },
    ],
    correctAnswer: '',
    testCases: [],
    codeTemplate: '',
    language: 'javascript',
    allowedFileTypes: '.pdf,.zip,.jpg,.png',
    maxFileSizeMB: 10,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      loadQuestion();
    } else {
      setIsLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    if (isLoaded && !isEdit && formData.type !== type) {
      setFormData(prev => ({ ...prev, type }));
    }
  }, [type, formData.type, isEdit, isLoaded]);

  const loadQuestion = async () => {
    try {
      const response = await questionApi.getOne(id!);
      if (response.success) {
        const data = response.data;
        if (data.tags && typeof data.tags === 'string') {
          data.tags = (data.tags as string).split(',').filter(t => !!t);
        } else if (!data.tags) {
          data.tags = [];
        }
        setFormData(data);
        setType(data.type);
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Load question error:', error);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) });
  };

  const handleOptionChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      options: formData.options?.map(opt => opt.key === key ? { ...opt, value } : opt)
    });
  };

  const handleCorrectOptionChange = (key: string) => {
    setFormData({
      ...formData,
      options: formData.options?.map(opt => ({ ...opt, isCorrect: opt.key === key }))
    });
  };

  // Test Case Handlers
  const addTestCase = () => {
    if ((formData.testCases?.length || 0) >= 5) return;
    setFormData({
      ...formData,
      testCases: [
        ...(formData.testCases || []),
        { input: '', expectedOutput: '', isHidden: false }
      ]
    });
  };

  const removeTestCase = (index: number) => {
    setFormData({
      ...formData,
      testCases: formData.testCases?.filter((_, i) => i !== index)
    });
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const updated = [...(formData.testCases || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, testCases: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For MCQ, set correctAnswer to the value of the selected option
      if (type === 'mcq') {
        const correctOpt = formData.options?.find(o => o.isCorrect);
        formData.correctAnswer = correctOpt?.value;
      }

      let response;
      if (isEdit) {
        response = await questionApi.update(id!, formData);
      } else {
        response = await questionApi.create({ ...formData, type });
      }

      if (response.success) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Save question error:', error);
      alert('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeHeader = () => {
    const configs = {
      mcq: { icon: HelpCircle, title: 'Multiple Choice Question', color: 'text-blue-600', bg: 'bg-blue-50' },
      coding: { icon: Code, title: 'Coding Challenge', color: 'text-green-600', bg: 'bg-green-50' },
      subjective: { icon: FileText, title: 'Subjective / Essay Question', color: 'text-purple-600', bg: 'bg-purple-50' },
      sql: { icon: Database, title: 'SQL Query Challenge', color: 'text-orange-600', bg: 'bg-orange-50' },
      submission: { icon: UploadCloud, title: 'File Submission Question', color: 'text-pink-600', bg: 'bg-pink-50' },
    };
    const config = configs[type];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl ${config.bg} mb-8 border border-transparent hover:border-current/10 transition-colors`}>
        <div className={`p-3 rounded-lg bg-white shadow-sm ${config.color}`}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${config.color}`}>{config.title}</h2>
          <p className="text-xs text-gray-500 font-medium">Define the question content, options, and rules</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/questions')}
              className="p-2 hover:bg-gray-100 rounded-full transition-all hover:scale-110 text-gray-600 group"
              title="Go Back"
            >
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">
                {isEdit ? 'Edit Question' : 'Create Question'}
              </h1>
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Question Bank / New</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/questions')}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2 px-8 h-11 shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              ) : (
                <Save size={18} />
              )}
              {isEdit ? 'Update Question' : 'Finish & Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderTypeHeader()}

          <div className="card space-y-6 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  Question Title (Internal)
                  <Info size={14} className="text-gray-400" />
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basic Java Loops"
                  className="input focus:ring-primary-500"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Difficulty</label>
                  <select
                    className="input"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="w-28 space-y-1.5">
                  <label className="text-sm font-bold text-gray-400 italic">Marks (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="input text-center focus:border-gray-300"
                    value={formData.marks || ''}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Question Statement</label>
              <textarea
                placeholder="Type your question statement here..."
                className="input min-h-[150px] font-medium leading-relaxed shadow-inner bg-gray-50/30"
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Tags (Press Enter to add)</label>
              <div className="flex flex-wrap gap-2 empty:hidden mb-2">
                {formData.tags?.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg border border-primary-100 shadow-sm">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Java, Loops, Basic"
                  className="input pl-10"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </div>
          </div>

          {/* Type-Specific Fields */}
          {type === 'mcq' && (
            <div className="card space-y-6 p-6 shadow-sm border-t-4 border-t-blue-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HelpCircle size={20} className="text-blue-500" />
                  Options Configuration
                </h3>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100 uppercase tracking-wider">Select one correct answer</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.options?.map((opt) => (
                  <div key={opt.key} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all shadow-sm ${opt.isCorrect ? 'border-primary-500 bg-primary-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <label className="relative flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="correct-answer"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectOptionChange(opt.key)}
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 cursor-pointer shadow-sm"
                      />
                    </label>
                    <span className={`w-8 h-8 flex items-center justify-center font-bold text-xs rounded-lg shrink-0 ${opt.isCorrect ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${opt.key}`}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 font-bold text-gray-700"
                      value={opt.value}
                      onChange={(e) => handleOptionChange(opt.key, e.target.value)}
                    />
                    {opt.isCorrect && <Check size={18} className="text-primary-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'coding' && (
            <div className="space-y-6">
              {/* Test Cases Section */}
              <div className="card p-6 shadow-sm border-t-4 border-t-amber-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Beaker size={20} className="text-amber-500" />
                      Test Cases
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Configure up to 5 test cases to evaluate submissions</p>
                  </div>
                  <button
                    type="button"
                    onClick={addTestCase}
                    disabled={(formData.testCases?.length || 0) >= 5}
                    className="btn btn-secondary flex items-center gap-2 text-xs h-9 disabled:opacity-50"
                  >
                    <Plus size={14} /> Add Test Case ({(formData.testCases?.length || 0)}/5)
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.testCases?.map((tc, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group animate-in slide-in-from-top-2">
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Input</label>
                          <textarea
                            className="input text-xs font-mono min-h-[60px]"
                            value={tc.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Expected Output</label>
                          <textarea
                            className="input text-xs font-mono min-h-[60px]"
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded border-gray-300 shadow-sm"
                        />
                        <span className="text-xs font-medium text-gray-600">Hidden Test Case (Secret)</span>
                      </label>
                    </div>
                  ))}

                  {(!formData.testCases || formData.testCases.length === 0) && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                      <Beaker className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">No test cases added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {type === 'submission' && (
            <div className="card space-y-6 p-6 shadow-sm border-t-4 border-t-pink-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UploadCloud size={20} className="text-pink-500" />
                  Submission Configuration
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Allowed File Types</label>
                  <input
                    type="text"
                    placeholder="e.g. .pdf,.zip,.doc,.docx"
                    className="input"
                    value={formData.allowedFileTypes || ''}
                    onChange={(e) => setFormData({ ...formData, allowedFileTypes: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-500 font-medium italic">Comma-separated extensions (e.g. .pdf,.zip)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    value={formData.maxFileSizeMB || ''}
                    onChange={(e) => setFormData({ ...formData, maxFileSizeMB: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-gray-500 font-medium italic">Maximum size per file (Max 100MB)</p>
                </div>
              </div>
            </div>
          )}

          {(type === 'subjective' || type === 'sql') && (
            <div className="card space-y-6">
               <div className="p-16 text-center">
                 <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                 <p className="text-gray-500 font-bold">Additional configurations for {type.toUpperCase()} questions</p>
                 <p className="text-xs text-gray-400 mt-2">Extended fields like grading criteria will be available soon.</p>
               </div>
            </div>
          )}
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => navigate('/questions')}
        title="Question Saved"
        size="sm"
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Success!</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            The question has been {isEdit ? 'updated' : 'added'} to your bank successfully.
          </p>
          <button
            onClick={() => navigate('/questions')}
            className="w-full btn btn-primary py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Go to Question Bank
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Tag({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"></path>
      <path d="M7 7h.01"></path>
    </svg>
  );
}

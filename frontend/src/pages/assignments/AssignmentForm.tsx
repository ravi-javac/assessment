import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/assignmentApi';
import { questionApi } from '@/services/questionApi';
import type { 
  Assignment, 
  AssignmentStatus, 
  AssignmentType, 
  ReadingMaterial, 
  AssignmentQuestion 
} from '@/types/assignment';
import type { 
  Question, 
  QuestionFilter, 
  QuestionType, 
  QuestionDifficulty 
} from '@/types/question';
import { Modal } from '@/components/PopupMenu';
import { 
  Plus, 
  Trash2, 
  Search, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  Shield,
  Check,
  UploadCloud,
  Link as LinkIcon
} from 'lucide-react';

const formatDateForInput = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function AssignmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'materials'>('basic');

  const [testQuestions, setTestQuestions] = useState<AssignmentQuestion[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>({});
  const [questionPage, setQuestionPage] = useState(1);
  const [totalQuestionPages, setTotalQuestionPages] = useState(1);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [existingTagNames, setExistingTagNames] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'mcq' as AssignmentType,
    status: 'draft' as AssignmentStatus,
    courseId: '',
    semester: '',
    batch: '',
    section: '',
    startDate: '',
    dueDate: '',
    durationMinutes: 0,
    totalMarks: 100,
    maxAttempts: 1,
    allowLateSubmission: false,
    latePenaltyPercent: 0,
    allowFileUpload: false,
    allowTextSubmission: true,
    maxFileSizeMB: 10,
    maxFiles: 1,
    instructions: '',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'zip'],
  });

  const [readingMaterials, setReadingMaterials] = useState<ReadingMaterial[]>([]);
  const [newMaterial, setNewMaterial] = useState<ReadingMaterial>({ title: '', url: '', type: 'link' });
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await assignmentApi.uploadFile(file);
      if (res.success && res.data) {
        setNewMaterial({
          title: file.name,
          url: res.data.url,
          type: 'file'
        });
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadAssignment(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (showQuestionModal) {
      loadAvailableQuestions();
    }
  }, [showQuestionModal, questionPage, questionFilter]);

  const loadAssignment = async (assignmentId: string) => {
    try {
      const res = await assignmentApi.get(assignmentId);
      if (res.success && res.data) {
        const a = res.data;
        setFormData({
          title: a.title || '',
          description: a.description || '',
          type: a.type || 'mcq',
          status: a.status || 'draft',
          courseId: a.courseId || '',
          semester: a.semester || '',
          batch: a.batch || '',
          section: a.section || '',
          startDate: formatDateForInput(a.startDate),
          dueDate: formatDateForInput(a.dueDate),
          durationMinutes: a.durationMinutes || 0,
          totalMarks: a.totalMarks || 100,
          maxAttempts: a.maxAttempts || 1,
          allowLateSubmission: a.allowLateSubmission || false,
          latePenaltyPercent: a.latePenaltyPercent || 0,
          allowFileUpload: a.allowFileUpload || false,
          allowTextSubmission: a.allowTextSubmission ?? true,
          maxFileSizeMB: a.maxFileSizeMB || 10,
          maxFiles: a.maxFiles || 1,
          instructions: a.instructions || '',
          allowedFileTypes: a.allowedFileTypes || ['pdf', 'doc', 'docx', 'zip'],
        });
        setReadingMaterials(a.readingMaterials || []);
        setTestQuestions(a.questions || []);
      }
    } catch (err) {
      console.error('Load assignment error:', err);
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const filterWithPagination: any = { ...questionFilter, page: questionPage, limit: 10 };
      const res = await questionApi.getAll(filterWithPagination);
      if (res.success) {
        setAvailableQuestions(res.data || []);
        setTotalQuestionPages(Math.ceil((res.total || 0) / 10) || 1);
        
        const tags = new Set<string>();
        (res.data || []).forEach((q: any) => {
          q.tags?.forEach((t: string) => tags.add(t));
        });
        setExistingTagNames(prev => Array.from(new Set([...prev, ...Array.from(tags)])));
      }
    } catch (err) {
      console.error('Load questions error:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...formData,
        readingMaterials,
        questions: testQuestions.map((q, idx) => ({
          questionId: q.questionId,
          marks: q.marks,
          order: idx
        }))
      };

      let res;
      if (isEdit && id) {
        res = await assignmentApi.update(id, payload);
        if (res.success) {
          setSuccess('Assignment updated successfully');
          loadAssignment(id);
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        res = await assignmentApi.create(payload);
        if (res.success && res.data?.id) {
          navigate(`/assignments/${res.data.id}/edit`);
        }
      }

      if (!res.success) {
        setError(res.message || 'Failed to save assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = (q: Question) => {
    if (testQuestions.some(tq => tq.questionId === q.id)) return;
    
    const newTestQuestion: AssignmentQuestion = {
      id: '', // Will be assigned by backend
      assignmentId: id || '',
      questionId: q.id,
      question: q,
      marks: q.marks,
      order: testQuestions.length
    };
    
    setTestQuestions([...testQuestions, newTestQuestion]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setTestQuestions(testQuestions.filter(q => q.questionId !== questionId));
  };

  const handleAddMaterial = () => {
    if (!newMaterial.title || !newMaterial.url) return;
    setReadingMaterials([...readingMaterials, newMaterial]);
    setNewMaterial({ title: '', url: '', type: 'link' });
    setShowMaterialModal(false);
  };

  const handleRemoveMaterial = (index: number) => {
    setReadingMaterials(readingMaterials.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/assignments')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Assignment' : 'Create Assignment'}
              </h1>
              <p className="text-sm text-gray-500">Configure learning and assessment flow</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check size={20} />
            {success}
          </div>
        )}

        <div className="flex gap-4 mb-8">
          {[
            { id: 'basic', label: 'Configuration', icon: FileText },
            { id: 'questions', label: 'Questions', icon: Shield },
            { id: 'materials', label: 'Reading Material', icon: BookOpen },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'questions' && testQuestions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-primary-100 text-primary-700'}`}>
                  {testQuestions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <section className="card p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <FileText className="text-primary-600" size={20} />
                    Basic Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignment Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="input"
                        placeholder="e.g., Data Structures Weekly Assignment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="input min-h-[100px]"
                        placeholder="Brief overview of the assignment..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value as AssignmentType })}
                          className="input"
                        >
                          <option value="mcq">MCQ Based</option>
                          <option value="coding">Coding Assignment</option>
                          <option value="subjective">Subjective / Essay</option>
                          <option value="file_upload">File Upload Only</option>
                          <option value="mixed">Mixed Type</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Course/Subject</label>
                        <input
                          type="text"
                          value={formData.courseId}
                          onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                          className="input"
                          placeholder="CS101"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="card p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Shield className="text-primary-600" size={20} />
                    Submission Rules
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.allowFileUpload}
                          onChange={e => setFormData({ ...formData, allowFileUpload: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Allow File Upload</p>
                          <p className="text-xs text-gray-500">PDF, ZIP, etc.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.allowTextSubmission}
                          onChange={e => setFormData({ ...formData, allowTextSubmission: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Allow Text Content</p>
                          <p className="text-xs text-gray-500">Rich text editor</p>
                        </div>
                      </label>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.allowLateSubmission}
                          onChange={e => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Allow Late Submissions</p>
                          <p className="text-xs text-gray-500">Enable penalty if needed</p>
                        </div>
                      </label>
                      {formData.allowLateSubmission && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Late Penalty (%)</label>
                          <input
                            type="number"
                            value={formData.latePenaltyPercent}
                            onChange={e => setFormData({ ...formData, latePenaltyPercent: parseInt(e.target.value) || 0 })}
                            className="input text-sm py-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Assignment Questions</h2>
                  <button 
                    onClick={() => setShowQuestionModal(true)}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add from Bank
                  </button>
                </div>

                {testQuestions.length === 0 ? (
                  <div className="card p-12 text-center border-dashed">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No questions added yet</p>
                    <button 
                      onClick={() => setShowQuestionModal(true)}
                      className="mt-4 text-primary-600 font-medium hover:underline"
                    >
                      Browse Question Bank
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testQuestions.map((tq, idx) => (
                      <div key={tq.questionId} className="card p-4 group">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{tq.question?.title}</h3>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs uppercase px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                  {tq.question?.type}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                  {tq.marks} Marks
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                                  tq.question?.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                                  tq.question?.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  {tq.question?.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveQuestion(tq.questionId)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Reading Materials</h2>
                  <button 
                    onClick={() => setShowMaterialModal(true)}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Material
                  </button>
                </div>

                {readingMaterials.length === 0 ? (
                  <div className="card p-12 text-center border-dashed">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No learning resources attached</p>
                    <button 
                      onClick={() => setShowMaterialModal(true)}
                      className="mt-4 text-primary-600 font-medium hover:underline"
                    >
                      Attach PDF, Video or Link
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readingMaterials.map((material, idx) => (
                      <div key={idx} className="card p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                            {material.type === 'video' ? <Shield size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{material.title}</h4>
                            <p className="text-xs text-primary-600 truncate max-w-[200px]">{material.url}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveMaterial(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="card p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Shield size={18} className="text-primary-600" />
                Assignment Schedule
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">End Date (Deadline)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                    className="input text-sm"
                    placeholder="0 for unlimited"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Leave 0 for untimed assignments</p>
                </div>
              </div>
            </section>

            <section className="card p-6">
              <h3 className="font-semibold mb-6">Evaluation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Marks</span>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })}
                    className="w-20 text-right font-bold text-primary-600 bg-transparent border-none focus:ring-0"
                  />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Max Attempts</span>
                  <select 
                    value={formData.maxAttempts}
                    onChange={e => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                    className="bg-transparent border-none text-sm font-medium focus:ring-0"
                  >
                    <option value={1}>Single Attempt</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Question Bank Modal */}
      <Modal 
        isOpen={showQuestionModal} 
        onClose={() => setShowQuestionModal(false)}
        title="Question Bank"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title or tags..."
                className="input pl-10"
                value={questionFilter.search || ''}
                onChange={e => setQuestionFilter({ ...questionFilter, search: e.target.value })}
              />
            </div>
            <select
              className="input w-40"
              value={questionFilter.type || ''}
              onChange={e => setQuestionFilter({ ...questionFilter, type: e.target.value as QuestionType || undefined })}
            >
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
              <option value="subjective">Subjective</option>
              <option value="sql">SQL</option>
              <option value="submission">Submission</option>
            </select>
            <select
              className="input w-40"
              value={questionFilter.difficulty || ''}
              onChange={e => setQuestionFilter({ ...questionFilter, difficulty: e.target.value as QuestionDifficulty || undefined })}
            >
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loadingQuestions ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No questions found</div>
            ) : (
              availableQuestions.map(q => {
                const isSelected = testQuestions.some(tq => tq.questionId === q.id);
                return (
                  <div key={q.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${
                        q.type === 'mcq' ? 'bg-purple-50 text-purple-600' :
                        q.type === 'coding' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{q.title}</p>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                          <span className="uppercase">{q.type}</span>
                          <span className="capitalize">{q.difficulty}</span>
                          <span>{q.marks} Marks</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => isSelected ? handleRemoveQuestion(q.id) : handleAddQuestion(q)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-red-50 text-red-600' 
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white'
                      }`}
                    >
                      {isSelected ? <Trash2 size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-xs text-gray-500">
              Page {questionPage} of {totalQuestionPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                disabled={questionPage === 1}
                className="btn btn-secondary py-1 text-xs"
              >
                Prev
              </button>
              <button 
                onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                disabled={questionPage === totalQuestionPages}
                className="btn btn-secondary py-1 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Material Modal */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => !isUploading && setShowMaterialModal(false)}
        title="Add Reading Material"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setNewMaterial({ ...newMaterial, type: 'link' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                newMaterial.type !== 'file' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LinkIcon size={16} />
              Resource Link
            </button>
            <button
              onClick={() => setNewMaterial({ ...newMaterial, type: 'file' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                newMaterial.type === 'file' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UploadCloud size={16} />
              Upload File
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Material Title</label>
              <input
                type="text"
                value={newMaterial.title}
                onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                className="input"
                placeholder={newMaterial.type === 'file' ? "Auto-filled from file name" : "e.g., Week 1 Lecture Notes"}
              />
            </div>

            {newMaterial.type !== 'file' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Link / URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={newMaterial.url}
                      onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      className="input pl-10"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Material Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['pdf', 'video', 'link'].map(type => (
                      <button
                        key={type}
                        onClick={() => setNewMaterial({ ...newMaterial, type: type as any })}
                        className={`py-2 rounded-lg text-xs font-bold border capitalize transition-all ${
                          newMaterial.type === type 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Choose File from System</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="material-file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="material-file-upload"
                    className={`flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-all ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500 font-medium">Uploading to system...</span>
                      </div>
                    ) : newMaterial.url ? (
                      <div className="flex flex-col items-center gap-1 text-green-600">
                        <Check size={24} />
                        <span className="text-sm font-bold truncate max-w-[200px]">{newMaterial.title}</span>
                        <span className="text-[10px] text-gray-400 font-normal italic">Click to change file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-500">
                        <UploadCloud size={24} className="text-gray-400" />
                        <span className="text-sm font-medium">Browse Files</span>
                        <span className="text-xs text-gray-400">PDF, DOC, DOCX up to 10MB</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              onClick={() => setShowMaterialModal(false)} 
              className="btn btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleAddMaterial} 
              className="btn btn-primary"
              disabled={!newMaterial.title || !newMaterial.url || isUploading}
            >
              Add Resource
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
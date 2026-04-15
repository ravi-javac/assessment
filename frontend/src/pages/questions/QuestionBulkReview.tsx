import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { questionApi } from '@/services/questionApi';
import { 
  ArrowLeft, Upload, CheckCircle, AlertCircle, Trash, 
  HelpCircle, Search, Tag, Plus, X, Edit2, Save, RotateCcw
} from 'lucide-react';

export function QuestionBulkReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, error: string}[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [customTag, setCustomTag] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      const { pendingQuestions, errors } = location.state;
      if (pendingQuestions) {
        setQuestions(pendingQuestions);
        setSelectedIds(new Set(pendingQuestions.map((q: any) => q.id)));
      }
      if (errors) {
        setValidationErrors(errors);
      }
    } else {
      navigate('/questions');
    }
  }, [location.state, navigate]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.tags?.some((t: string) => t.toLowerCase().includes(term)) ||
        q.content?.toLowerCase().includes(term)
      );
    });
  }, [questions, searchTerm]);

  const handleToggleSelectAll = () => {
    const visibleIds = filteredQuestions.map(q => q.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleIds.forEach(id => next.delete(id));
    } else {
      visibleIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleRemove = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
    if (editingId === id) {
      setEditingId(null);
      setEditForm(null);
    }
  };

  // Edit Handlers
  const startEditing = (question: any) => {
    setEditingId(question.id);
    setEditForm({ 
      ...question, 
      tagsString: question.tags.join(', ')
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    
    // Parse tags back to array
    const updatedTags = editForm.tagsString
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t !== '');

    const updatedQuestions = questions.map(q => 
      q.id === editingId 
        ? { ...editForm, tags: updatedTags, title: editForm.content.substring(0, 100) } 
        : q
    );

    setQuestions(updatedQuestions);
    setEditingId(null);
    setEditForm(null);
  };

  const handleOptionChange = (key: string, value: string) => {
    const updatedOptions = editForm.options.map((opt: any) => 
      opt.key === key ? { ...opt, value } : opt
    );
    setEditForm({ ...editForm, options: updatedOptions });
  };

  const handleCorrectOptionChange = (key: string) => {
    const updatedOptions = editForm.options.map((opt: any) => ({
      ...opt,
      isCorrect: opt.key === key
    }));
    const correctOption = updatedOptions.find((o: any) => o.isCorrect);
    setEditForm({ 
      ...editForm, 
      options: updatedOptions, 
      correctAnswer: correctOption?.value || '' 
    });
  };

  const handleUpload = async () => {
    const toUpload = questions
      .filter(q => selectedIds.has(q.id))
      .map(({ id, ...rest }) => {
        const tags = [...(rest.tags || [])];
        if (customTag.trim()) {
          if (!tags.includes(customTag.trim())) {
            tags.push(customTag.trim());
          }
        }
        return { ...rest, tags };
      });

    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const response = await questionApi.bulkCreate(toUpload);
      if (response.success) {
        alert(response.message || 'Questions uploaded successfully');
        navigate('/questions');
      } else {
        alert(response.message || 'Failed to upload questions');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'A critical error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDownloadSample = async () => {
    try {
      // Reusing logic from QuestionBank.tsx to generate sample Excel
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Questions');
      worksheet.columns = [
        { header: 'Question Statement', key: 'questionStatement', width: 50 },
        { header: 'Option 1', key: 'option1', width: 30 },
        { header: 'Option 2', key: 'option2', width: 30 },
        { header: 'Option 3', key: 'option3', width: 30 },
        { header: 'Option 4', key: 'option4', width: 30 },
        { header: 'Option 5', key: 'option5', width: 30 },
        { header: 'Correct Answer-1', key: 'correctAnswer', width: 30 },
        { header: 'Tag', key: 'tag', width: 20 },
        { header: 'State', key: 'state', width: 12 },
        { header: 'Level', key: 'level', width: 12 },
      ];

      worksheet.addRow({
        questionStatement: 'Example: What is the capital of France?',
        option1: 'London',
        option2: 'Berlin',
        option3: 'Paris',
        option4: 'Madrid',
        correctAnswer: 'Paris',
        tag: 'Geography,General',
        state: 'Ready',
        level: 'Easy'
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'MCQ_Sample_Template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download sample error:', error);
    }
  };

  if (!location.state && questions.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/questions')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review Bulk Upload</h1>
                <p className="text-sm text-gray-500">
                  {questions.length} questions parsed. Selected {selectedIds.size} to import.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500" size={18} />
                <input
                  type="text"
                  placeholder="Set custom tag for all..."
                  className="input pl-10 h-10 w-48 md:w-64 text-sm"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedIds.size === 0 || editingId !== null}
                className="btn btn-primary flex items-center gap-2 h-10 px-6 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Add to Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-white p-5 border shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                <CheckCircle size={18} className="text-green-600" />
                Upload Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                  <span className="text-gray-600">Total Parsed:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-primary-50">
                  <span className="text-primary-700">Selected:</span>
                  <span className="font-bold text-primary-700">{selectedIds.size}</span>
                </div>
                {validationErrors.length > 0 && (
                  <div className="flex justify-between items-center p-2 rounded-lg bg-red-50">
                    <span className="text-red-700">Skipped (Errors):</span>
                    <span className="font-bold text-red-700">{validationErrors.length}</span>
                  </div>
                )}
              </div>

              {editingId !== null && (
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg animate-pulse">
                  <p className="text-xs text-yellow-800 font-medium flex items-center gap-2">
                    <AlertCircle size={14} />
                    Currently editing a question. Save or cancel changes to proceed with upload.
                  </p>
                </div>
              )}
            </div>

            {/* Custom Tag Info */}
            {customTag.trim() && (
              <div className="card bg-blue-50 border-blue-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Tag size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Custom Tag Active</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      The tag <span className="font-bold">"{customTag}"</span> will be added to all selected questions.
                    </p>
                    <button 
                      onClick={() => setCustomTag('')}
                      className="text-xs text-blue-600 font-medium mt-2 hover:underline flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="card bg-white border shadow-sm overflow-hidden">
                <div className="bg-red-50 p-3 border-b border-red-100">
                  <h2 className="font-bold text-red-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <AlertCircle size={16} />
                    Parsing Errors ({validationErrors.length})
                  </h2>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="text-xs text-red-600 bg-red-50/50 p-2 rounded border border-red-50 flex gap-2">
                      <span className="font-bold tabular-nums">Row {err.row}:</span> 
                      <span className="flex-1">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by tag or content..."
                  className="input pl-10 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.has(q.id))}
                      onChange={handleToggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
                    />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm group-hover:text-primary-600 transition-colors">
                    Select All Visible
                  </span>
                </label>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => {
                  const isEditing = editingId === question.id;
                  
                  return (
                    <div 
                      key={question.id} 
                      className={`card bg-white transition-all relative overflow-hidden group ${
                        isEditing 
                          ? 'ring-2 ring-primary-500 p-0 shadow-lg' 
                          : `p-6 border-l-4 ${selectedIds.has(question.id) ? 'border-l-primary-500 shadow-sm' : 'border-l-gray-200 opacity-80'}`
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex flex-col">
                          {/* Edit Mode Header */}
                          <div className="bg-primary-50 p-3 border-b border-primary-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-2">
                              <Edit2 size={14} /> Editing Row {question.id}
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={cancelEditing}
                                className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
                              >
                                <RotateCcw size={14} /> Cancel
                              </button>
                              <button 
                                onClick={saveEdit}
                                className="px-3 py-1 text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 rounded-md flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <Save size={14} /> Save Changes
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            {/* Content Edit */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase">Question Statement</label>
                              <textarea 
                                className="input min-h-[100px] text-base font-medium resize-none"
                                value={editForm.content}
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Difficulty & Tags Edit */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Difficulty</label>
                                <select 
                                  className="input h-10"
                                  value={editForm.difficulty}
                                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Tags (comma separated)</label>
                                <input 
                                  className="input h-10"
                                  placeholder="e.g. Math, Algebra, 2024"
                                  value={editForm.tagsString}
                                  onChange={(e) => setEditForm({ ...editForm, tagsString: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Options Edit */}
                            <div className="space-y-3 pt-2">
                              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                <span>Options</span>
                                <span className="text-primary-600">Select the correct radio button</span>
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {editForm.options.map((opt: any) => (
                                  <div key={opt.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group-within:border-primary-200 group-within:bg-white transition-all">
                                    <input 
                                      type="radio" 
                                      name={`correct-${question.id}`}
                                      checked={opt.isCorrect}
                                      onChange={() => handleCorrectOptionChange(opt.key)}
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <span className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-gray-200 text-gray-600 rounded-md shrink-0">
                                      {opt.key}
                                    </span>
                                    <input 
                                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                                      value={opt.value}
                                      onChange={(e) => handleOptionChange(opt.key, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-5">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(question.id)}
                              onChange={() => handleToggleSelect(question.id)}
                              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 cursor-pointer shadow-sm"
                            />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                  ROW {question.id}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {question.tags.map((tag: string, tid: number) => {
                                    const tagParts = tag.split('/');
                                    return (
                                      <span key={tid} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border shadow-sm ${
                                        searchTerm && tag.toLowerCase().includes(searchTerm.toLowerCase())
                                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                                          : 'bg-white text-gray-600 border-gray-200'
                                      }`}>
                                        <Tag size={10} className={searchTerm && tag.toLowerCase().includes(searchTerm.toLowerCase()) ? 'text-primary-500' : 'text-gray-400'} />
                                        {tagParts.map((part, pIdx) => (
                                          <span key={pIdx} className="flex items-center">
                                            {pIdx > 0 && <span className="mx-1 text-gray-300 font-bold">›</span>}
                                            <span className={pIdx === tagParts.length - 1 ? 'text-gray-900' : ''}>{part.trim()}</span>
                                          </span>
                                        ))}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditing(question)}
                                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                  title="Edit question"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleRemove(question.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Remove from list"
                                >
                                  <Trash size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="pr-4">
                              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                                {question.content}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {question.options.map((opt: any) => (
                                <div 
                                  key={opt.key} 
                                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                    opt.isCorrect 
                                      ? 'bg-green-50 border-green-200 text-green-800 ring-1 ring-green-100' 
                                      : 'bg-gray-50 border-gray-100 text-gray-600'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                                    opt.isCorrect ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border border-gray-200'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <span className="text-sm font-medium pt-0.5 flex-1">{opt.value}</span>
                                  {opt.isCorrect && <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 text-lg font-bold">No matching questions</h3>
                  <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                    Try adjusting your search term or clear the filter to see all questions.
                  </p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-6 text-primary-600 font-semibold hover:text-primary-700 flex items-center justify-center gap-2 mx-auto"
                  >
                    <X size={16} /> Clear Search
                  </button>
                </div>
              )}

              {questions.length === 0 && !uploading && (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-sm">
                  <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold">Format Not Valid</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                    We couldn't find any valid questions in your file. Please check the sidebar for specific row errors.
                  </p>
                  <div className="flex justify-center gap-4 mt-8">
                    <button 
                      onClick={() => navigate('/questions')}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <ArrowLeft size={18} /> Go Back
                    </button>
                    <button 
                      onClick={handleDownloadSample}
                      className="btn btn-primary bg-green-600 hover:bg-green-700 border-none flex items-center gap-2"
                    >
                      <Upload size={18} className="rotate-180" /> Download Sample Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
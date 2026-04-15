import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as ExcelJS from 'exceljs';
import { questionApi } from '@/services/questionApi';
import { Modal } from '@/components/PopupMenu';
import type { Question, QuestionFilter } from '@/types/question';
import { 
  Plus, Search, Filter, Edit, Trash2, Upload, Download,
  CheckCircle, XCircle, Code, FileText, HelpCircle, AlertCircle, Trash, Database,
  ChevronLeft, ChevronRight, UploadCloud, ArrowLeft
} from 'lucide-react';

export default function QuestionBank() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuestionFilter>({});
  const [search, setSearch] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const questionTypes = [
    { value: '', label: 'All Types', icon: HelpCircle, color: 'text-gray-400' },
    { value: 'mcq', label: 'MCQs', icon: HelpCircle, color: 'text-blue-500' },
    { value: 'coding', label: 'Coding', icon: Code, color: 'text-green-500' },
    { value: 'subjective', label: 'Subjective', icon: FileText, color: 'text-purple-500' },
    { value: 'sql', label: 'SQL', icon: Database, color: 'text-orange-500' },
    { value: 'submission', label: 'Submission', icon: UploadCloud, color: 'text-pink-500' },
  ];

  useEffect(() => {
    loadQuestions();
  }, [filter, page, limit]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionApi.getAll({ ...filter, page, limit });
      if (response.success) {
        setQuestions(response.data || []);
        setTotal(response.total || (response.data?.length || 0));
      }
    } catch (error) {
      console.error('Load questions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      
      const headers: Record<string, number> = {};
      const firstRow = worksheet.getRow(1).values as any[];
      if (firstRow) {
        firstRow.forEach((value, index) => {
          if (value) headers[value.toString().toLowerCase().trim()] = index;
        });
      }

      // Validate required headers
      const required = ['question statement', 'correct answer-1'];
      const missing = required.filter(h => headers[h] === undefined);
      
      const hasOptions = ['option 1', 'option 2'].some(h => headers[h] !== undefined);

      if (missing.length > 0 || !hasOptions) {
        alert('Format not valid. Please ensure the file contains required headers: Question Statement, Option 1, Option 2, and Correct Answer-1.');
        setUploading(false);
        return;
      }

      const parsed: any[] = [];
      const errors: any[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        
        try {
          const values = row.values as any[];
          const getValue = (colNames: string[]): any => {
            for (const col of colNames) {
              const idx = headers[col.toLowerCase().trim()];
              if (idx !== undefined && idx < values.length) {
                const val = values[idx];
                if (val && typeof val === 'object' && val.richText) return val.richText.map((rt: any) => rt.text).join('');
                if (val && typeof val === 'object' && val.text) return val.text;
                return val;
              }
            }
            return null;
          };

          const questionStatement = getValue(['question statement', 'question statement ', 'statement', 'content']);
          const correctAnswerText = getValue(['correct answer-1', 'correct answer- 1', 'correct answer', 'answer']);

          if (!questionStatement || !questionStatement.toString().trim()) return;

          const optionLabels = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
          const optionKeys = ['A', 'B', 'C', 'D', 'E'];
          const options: any[] = [];
          const cleanCorrect = correctAnswerText?.toString().trim().toLowerCase();

          for (let i = 0; i < optionLabels.length; i++) {
            const optVal = getValue([optionLabels[i], `option ${i + 1}`, `option${i + 1}`]);
            if (optVal !== null && optVal !== undefined && optVal.toString().trim()) {
              const strVal = optVal.toString().trim();
              options.push({ key: optionKeys[i], value: strVal, isCorrect: cleanCorrect === strVal.toLowerCase() });
            }
          }

          if (options.length === 0) throw new Error('No options found');
          
          if (!options.some(o => o.isCorrect) && cleanCorrect) {
            const keyIdx = optionKeys.findIndex(k => k.toLowerCase() === cleanCorrect);
            if (keyIdx !== -1 && options[keyIdx]) options[keyIdx].isCorrect = true;
          }

          if (!options.some(o => o.isCorrect)) throw new Error(`Correct answer "${correctAnswerText}" not found in options`);

          const levelStr = getValue(['level', 'difficulty'])?.toString().toLowerCase().trim();
          const stateStr = getValue(['state', 'status'])?.toString().toLowerCase().trim();
          const tagStr = getValue(['tag', 'tags'])?.toString();

          const question = {
            id: rowNumber,
            content: questionStatement.toString().trim(),
            title: questionStatement.toString().trim().substring(0, 100),
            type: 'mcq',
            difficulty: levelStr === 'easy' ? 'easy' : levelStr === 'hard' ? 'hard' : 'medium',
            status: (stateStr === 'ready' || stateStr === 'active' || stateStr === 'live') ? 'active' : 'draft',
            tags: tagStr ? tagStr.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
            options,
            correctAnswer: options.find(o => o.isCorrect).value,
            marks: 1
          };

          parsed.push(question);
        } catch (err: any) {
          errors.push({ row: rowNumber, error: err.message });
        }
      });

      navigate('/questions/bulk-review', { state: { pendingQuestions: parsed, errors: errors } });
    } catch (error: any) {
      console.error('File parsing error:', error);
      alert('Failed to parse Excel file. Please check the format.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownloadSample = async () => {
    try {
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
        questionStatement: 'Example Question: What is the capital of France?',
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

  const handleSearch = async () => {
    try {
      const response = await questionApi.getAll({ ...filter, search });
      if (response.success) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionApi.delete(id);
      loadQuestions();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await questionApi.activate(id);
      loadQuestions();
    } catch (error) {
      console.error('Activate error:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'coding':
        return <Code className="w-5 h-5 text-green-500" />;
      case 'subjective':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'sql':
        return <Database className="w-5 h-5 text-orange-500" />;
      case 'submission':
        return <UploadCloud className="w-5 h-5 text-pink-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-110 text-gray-600"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Question Bank</h1>
              <p className="text-sm text-slate-500 font-medium">Manage and organize your assessment content</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadSample}
              className="btn btn-secondary flex items-center gap-2 h-11"
              title="Download Template"
            >
              <Download size={18} />
              Sample
            </button>
            <label className={`btn btn-secondary flex items-center gap-2 h-11 cursor-pointer transition-all hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={18} />
              {uploading ? 'Processing...' : 'Bulk Upload'}
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
            <button 
              onClick={() => setShowTypeModal(true)}
              className="btn btn-primary flex items-center gap-2 h-11 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>
        </div>

        {/* Question Type Switcher */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questionTypes.map((type) => {
            const Icon = type.icon;
            const isActive = (filter.type || '') === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setFilter({ ...filter, type: type.value as any || undefined })}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  isActive 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-100' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : type.color} />
                {type.label}
              </button>
            );
          })}
        </div>

        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <select
              className="input w-auto"
              value={filter.difficulty || ''}
              onChange={(e) => setFilter({ ...filter, difficulty: e.target.value as any || undefined })}
            >
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              className="input w-auto"
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any || undefined })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No questions found</p>
              <Link to="/questions/new" className="text-primary-600 hover:text-primary-700">
                Create your first question
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Difficulty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Marks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(question.type)}
                          <span className="capitalize">{question.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">{question.title}</div>
                        <div className="text-xs text-gray-500 truncate">{question.content}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4">{question.marks}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.status === 'active' ? 'bg-green-100 text-green-700' :
                          question.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {question.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActivate(question.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Activate"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <Link
                            to={`/questions/${question.id}`}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900">{total > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-gray-900">{total}</span> questions
          </p>
          <div className="flex items-center gap-2">
            <select
              className="input py-1.5 h-auto w-auto text-xs"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center px-4 py-1.5 bg-gray-50 rounded-lg border text-sm font-bold text-gray-700">
                Page {page} of {Math.ceil(total / limit) || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / limit) || 1, p + 1))}
                disabled={page >= Math.ceil(total / limit) || total === 0}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Type Selection Modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Select Question Type"
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
          {questionTypes.slice(1).map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setShowTypeModal(false);
                  navigate(`/questions/new?type=${type.value}`);
                }}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
              >
                <div className={`p-4 rounded-xl bg-gray-50 group-hover:bg-white shadow-sm transition-colors ${type.color}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600">{type.label}</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-[140px] mx-auto">
                    Create a new {type.label.toLowerCase()} question for your bank.
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionApi } from '@/services/questionApi';
import type { Question, QuestionFilter } from '@/types/question';
import { 
  Plus, Search, Filter, Edit, Trash2, Upload, Download,
  CheckCircle, XCircle, Code, FileText, HelpCircle
} from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuestionFilter>({});
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionApi.getAll(filter);
      if (response.success) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Load questions error:', error);
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <div className="flex gap-3">
            <Link to="/questions/new" className="btn btn-primary flex items-center gap-2">
              <Plus size={20} />
              Add Question
            </Link>
          </div>
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
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as any || undefined })}
            >
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
              <option value="subjective">Subjective</option>
            </select>
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
      </div>
    </div>
  );
}
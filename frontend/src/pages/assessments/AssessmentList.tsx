import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentApi } from '@/services/assessmentApi';
import type { Test, TestFilter } from '@/types/assessment';
import { Plus, Search, Edit, Trash2, Play, Pause, Copy, Key, Eye, ArrowLeft, RefreshCw } from 'lucide-react';

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (timeStr: string | undefined | null): string => {
  if (!timeStr) return '-';
  return timeStr;
};

export default function AssessmentList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TestFilter>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTests();
  }, [filter]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await assessmentApi.getAll(filter);
      if (response.success) {
        setTests(response.data);
      }
    } catch (error) {
      console.error('Load tests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await assessmentApi.getAll({ ...filter, search });
      if (response.success) {
        setTests(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await assessmentApi.delete(id);
      loadTests();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await assessmentApi.publish(id);
      loadTests();
    } catch (error) {
      console.error('Publish error:', error);
    }
  };

  const handleGoLive = async (id: string) => {
    try {
      await assessmentApi.goLive(id);
      loadTests();
    } catch (error) {
      console.error('Go live error:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await assessmentApi.pause(id);
      loadTests();
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const handleGenerateCode = async (id: string) => {
    try {
      const response = await assessmentApi.generateAccessCode(id);
      if (response.success) {
        alert(`Access Code: ${response.data.accessCode}`);
        loadTests();
      }
    } catch (error) {
      console.error('Generate code error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-blue-100 text-blue-700',
      live: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" title="Back to Dashboard">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <button onClick={loadTests} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw size={20} />
            </button>
          </div>
          <Link to="/assessments/new" className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Create Test
          </Link>
        </div>

        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <select
              className="input w-auto"
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any || undefined })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="input w-auto"
              value={filter.visibility || ''}
              onChange={(e) => setFilter({ ...filter, visibility: e.target.value as any || undefined })}
            >
              <option value="">All Visibility</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No assessments found</p>
              <Link to="/assessments/new" className="text-primary-600 hover:text-primary-700">
                Create your first assessment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Visibility</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{test.title}</div>
                        <div className="text-xs text-gray-500">{test.description}</div>
                      </td>
                      <td className="py-3 px-4">{test.duration} min</td>
                      <td className="py-3 px-4 capitalize">{test.visibility}</td>
                      <td className="py-3 px-4 text-sm">
                        <div>{formatDate(test.startDate)} - {formatDate(test.endDate)}</div>
                        <div className="text-gray-400">
                          {formatTime(test.scheduledStartTime)} - {formatTime(test.scheduledEndTime)}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(test.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {test.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(test.id)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Publish"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {(test.status === 'published' || test.status === 'paused') && (
                            <button
                              onClick={() => handleGoLive(test.id)}
                              className="p-1 text-green-600 hover:text-green-700"
                              title={test.status === 'paused' ? 'Resume' : 'Go Live'}
                            >
                              <Play size={18} />
                            </button>
                          )}
                          {test.status === 'live' && (
                            <button
                              onClick={() => handlePause(test.id)}
                              className="p-1 text-yellow-600 hover:text-yellow-700"
                              title="Pause"
                            >
                              <Pause size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleGenerateCode(test.id)}
                            className="p-1 text-purple-600 hover:text-purple-700"
                            title="Generate Access Code"
                          >
                            <Key size={18} />
                          </button>
                          <Link
                            to={`/assessments/${test.id}/edit`}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(test.id)}
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

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
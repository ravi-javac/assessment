import { useState } from 'react';
import { BarChart3, FileText, Download, Mail, Users, CheckCircle, XCircle } from 'lucide-react';

export default function ReportsList() {
  const [reportType, setReportType] = useState<'test' | 'student' | 'course'>('test');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'test', label: 'Test Performance', icon: BarChart3, description: 'View test results and analytics' },
    { id: 'student', label: 'Student Reports', icon: Users, description: 'Individual student performance' },
    { id: 'course', label: 'Course Reports', icon: FileText, description: 'Course-wide analytics' },
  ];

  const recentReports = [
    { id: 1, name: 'Mid-Term Exam Results', date: '2024-01-15', type: 'test' },
    { id: 2, name: 'Attendance Report', date: '2024-01-14', type: 'course' },
    { id: 3, name: 'Student Performance - John Doe', date: '2024-01-13', type: 'student' },
  ];

  const handleExport = async (format: 'pdf' | 'excel') => {
    setLoading(true);
    setTimeout(() => {
      alert(`Report exported as ${format.toUpperCase()}`);
      setLoading(false);
    }, 1000);
  };

  const handleEmail = async () => {
    const email = prompt('Enter email address:');
    if (email) {
      alert(`Report sent to ${email}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {reportTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setReportType(type.id as any)}
              className={`card cursor-pointer transition-all ${
                reportType === type.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <type.icon className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-semibold text-gray-900">{type.label}</h3>
              <p className="text-sm text-gray-500">{type.description}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Reports</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> Excel
              </button>
              <button
                onClick={handleEmail}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Mail size={18} /> Email
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Report Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{report.name}</td>
                    <td className="py-3 px-4 capitalize">{report.type}</td>
                    <td className="py-3 px-4 text-gray-500">{report.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View">
                          <FileText size={18} />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded" title="Download">
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">85%</div>
            <p className="text-gray-500">Average Pass Rate</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">92%</div>
            <p className="text-gray-500">Attendance Rate</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">78%</div>
            <p className="text-gray-500">Assignment Submission</p>
          </div>
        </div>
      </div>
    </div>
  );
}
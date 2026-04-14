import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '@/services/assessmentApi';
import { questionApi } from '@/services/questionApi';
import type { Test, TestStatus, TestVisibility, ProctoringLevel, Section, Subsection, TestQuestion, TestFilter, RuleSettings } from '@/types/assessment';
import type { Question, QuestionFilter, QuestionType, QuestionDifficulty } from '@/types/question';
import { Modal } from '@/components/PopupMenu';
import QuestionnaireManager from '@/components/QuestionnaireManager';
import { Plus, Trash2, Edit, Folder, FolderOpen, Shield, Lock, Search, X, ChevronDown, ChevronRight, Check, AlertCircle, Play, Pause, Eye, Save, ArrowLeft, RefreshCw, FileText } from 'lucide-react';

const formatDateForInput = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateFromInput = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}`).toISOString().split('T')[0];
};

interface SectionWithSubsections extends Section {
  subsections: Subsection[];
  questions: TestQuestion[];
  isExpanded?: boolean;
}

const DEFAULT_RULES: RuleSettings = {
  shuffledQuestions: false,
  shuffledOptions: false,
  showResults: true,
  showCorrectAnswers: true,
  allowPause: true,
  allowFlag: true,
  showInstantResults: false,
  breakTime: 0,
  allowCalculator: true,
  allowNotes: true,
  randomCutoff: false,
  cutoffMarks: 0,
  passingMarks: 50,
  duration: 60,
};

export default function AssessmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'questions'>('basic');

  const [sections, setSections] = useState<SectionWithSubsections[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentSubsectionId, setCurrentSubsectionId] = useState<string | null>(null);
  const [preSelectedContext, setPreSelectedContext] = useState<{
    type: 'section' | 'subsection';
    sectionId: string;
    sectionName: string;
    subsectionId?: string;
    subsectionName?: string;
  } | null>(null);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>({});

  const [selectedItem, setSelectedItem] = useState<{ type: 'section' | 'subsection'; id: string; data?: any } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | undefined>(undefined);

  const [updateName, setUpdateName] = useState('');
  const [sectionSettings, setSectionSettings] = useState<any>({});
  const [subsectionSettings, setSubsectionSettings] = useState<any>({});
  const [sectionEffectiveSettings, setSectionEffectiveSettings] = useState<any>(null);
  const [subsectionEffectiveSettings, setSubsectionEffectiveSettings] = useState<any>(null);
  const [calculatedTotals, setCalculatedTotals] = useState<{
    totalMarks: number;
    totalDuration: number;
    sectionTotals: any[];
  } | null>(null);
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [selectAllSettings, setSelectAllSettings] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as TestStatus,
    visibility: 'private' as TestVisibility,
    duration: 60,
    passingMarks: 50,
    shuffledQuestions: false,
    shuffledOptions: false,
    proctoringLevel: 'none' as ProctoringLevel,
    restrictDevices: false,
    restrictIP: false,
    allowedIPs: '',
    showResults: true,
    showCorrectAnswers: true,
    allowPause: true,
    allowFlag: true,
    showInstantResults: false,
    breakTime: 0,
    allowCalculator: true,
    allowNotes: true,
    resultMessage: '',
    instructions: '',
    startDate: '',
    endDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    questionnaireId: '',
    emailTemplateId: '',
    sendResultEmail: true,
    maxAttempts: 1,
    totalMarks: 0,
  });

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPageSize] = useState(20);
  const [totalQuestionPages, setTotalQuestionPages] = useState(1);
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [targetSubsectionId, setTargetSubsectionId] = useState<string>('');

  const [existingTagNames, setExistingTagNames] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      loadTest(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (showQuestionModal && id) {
      loadAvailableQuestions();
    }
  }, [showQuestionModal, questionPage, questionFilter]);

  useEffect(() => {
    if (isEdit && id) {
      loadTestTotals();
    }
  }, [sections, testQuestions]);

  const loadTest = async (testId: string) => {
    try {
      const res = await assessmentApi.getOne(testId);
      if (res.success && res.data) {
        const test = res.data;
        setFormData({
          title: test.title || '',
          description: test.description || '',
          status: test.status || 'draft',
          visibility: test.visibility || 'private',
          duration: test.duration || 60,
          passingMarks: test.passingMarks || 50,
          shuffledQuestions: test.shuffledQuestions || false,
          shuffledOptions: test.shuffledOptions || false,
          proctoringLevel: test.proctoringLevel || 'none',
          restrictDevices: test.restrictDevices || false,
          restrictIP: test.restrictIP || false,
          allowedIPs: test.allowedIPs || '',
          showResults: test.showResults ?? true,
          showCorrectAnswers: test.showCorrectAnswers ?? true,
          allowPause: test.allowPause ?? true,
          allowFlag: test.allowFlag ?? true,
          showInstantResults: test.showInstantResults || false,
          breakTime: test.breakTime || 0,
          allowCalculator: test.allowCalculator ?? true,
          allowNotes: test.allowNotes ?? true,
          resultMessage: test.resultMessage || '',
          instructions: test.instructions || '',
          startDate: test.startDate || '',
          endDate: test.endDate || '',
          scheduledStartTime: test.scheduledStartTime || '',
          scheduledEndTime: test.scheduledEndTime || '',
          questionnaireId: test.questionnaireId || '',
          emailTemplateId: test.emailTemplateId || '',
          sendResultEmail: test.sendResultEmail ?? true,
          maxAttempts: test.maxAttempts || 1,
          totalMarks: test.totalMarks || 0,
        });
        setSelectedQuestionnaireId(test.questionnaireId);
        loadSections(testId);
        loadTestQuestions(testId);
      }
    } catch (err) {
      console.error('Load test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (testId: string) => {
    try {
      const res = await assessmentApi.getSections(testId);
      if (res.success && res.data) {
        const sectionsWithSubsections = res.data as SectionWithSubsections[];
        for (let i = 0; i < sectionsWithSubsections.length; i++) {
          const subRes = await assessmentApi.getSubsections(sectionsWithSubsections[i].id);
          sectionsWithSubsections[i].subsections = subRes.success ? subRes.data : [];
          sectionsWithSubsections[i].isExpanded = false;
        }
        setSections(sectionsWithSubsections);
      }
    } catch (err) {
      console.error('Load sections error:', err);
    }
  };

  const loadTestQuestions = async (testId: string) => {
    try {
      const res = await assessmentApi.getTestQuestions(testId);
      if (res.success && res.data) {
        setTestQuestions(res.data);
      }
    } catch (err) {
      console.error('Load questions error:', err);
    }
  };

  const loadTestTotals = async () => {
    if (!id) return;
    setLoadingTotals(true);
    try {
      const res = await assessmentApi.getTotals(id);
      if (res.success && res.data) {
        setCalculatedTotals(res.data);
      }
    } catch (err) {
      console.error('Load totals error:', err);
    } finally {
      setLoadingTotals(false);
    }
  };

  const loadAvailableQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const filterWithPagination: any = { ...questionFilter, page: questionPage, limit: questionPageSize };
      const res = await questionApi.getAll(filterWithPagination);
      if (res.success) {
        setAvailableQuestions(res.data?.questions || []);
        setTotalQuestionPages(res.data?.totalPages || 1);
        const allTags = new Set<string>();
        (res.data?.questions || []).forEach((q: Question) => {
          q.tags?.forEach((tag: string) => allTags.add(tag));
        });
        setExistingTagNames(Array.from(allTags));
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
    try {
      const testData = {
        ...formData,
        totalMarks: calculatedTotals?.totalMarks || formData.totalMarks,
      };
      
      let res;
      if (isEdit && id) {
        res = await assessmentApi.update(id, testData);
        if (res.success) {
          navigate('/assessments');
        }
      } else {
        res = await assessmentApi.create(testData);
        if (res.success && res.data?.id) {
          navigate(`/assessments/${res.data.id}/edit`);
        }
      }
      
      if (!res?.success) {
        setError(res?.message || 'Failed to save test');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await assessmentApi.publish(id);
      loadTest(id);
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  const handleGoLive = async () => {
    if (!id) return;
    try {
      await assessmentApi.goLive(id);
      loadTest(id);
    } catch (err) {
      console.error('Go live error:', err);
    }
  };

  const handleCreateSection = async () => {
    if (!id) return;
    try {
      const sectionName = `Section ${sections.length + 1}`;
      const res = await assessmentApi.createSection({ name: sectionName, testId: id });
      if (res.success) {
        setSections([...sections, { ...res.data, subsections: [], questions: [], isExpanded: true }]);
      }
    } catch (err) {
      console.error('Create section error:', err);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await assessmentApi.deleteSection(sectionId);
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error('Delete section error:', err);
    }
  };

  const handleUpdateSection = async (sectionId: string, data: Partial<Section>) => {
    try {
      await assessmentApi.updateSection(sectionId, data);
      setSections(sections.map(s => s.id === sectionId ? { ...s, ...data } : s));
    } catch (err) {
      console.error('Update section error:', err);
    }
  };

  const handleCreateSubsection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    try {
      const subsectionName = `Subsection ${(section.subsections?.length || 0) + 1}`;
      const res = await assessmentApi.createSubsection({ name: subsectionName, sectionId });
      if (res.success) {
        const updatedSections = sections.map(s => {
          if (s.id === sectionId) {
            return { ...s, subsections: [...(s.subsections || []), res.data] };
          }
          return s;
        });
        setSections(updatedSections);
      }
    } catch (err) {
      console.error('Create subsection error:', err);
    }
  };

  const handleDeleteSubsection = async (subsectionId: string) => {
    try {
      await assessmentApi.deleteSubsection(subsectionId);
      setSections(sections.map(s => ({
        ...s,
        subsections: s.subsections?.filter(sub => sub.id !== subsectionId) || []
      })));
    } catch (err) {
      console.error('Delete subsection error:', err);
    }
  };

  const handleUpdateSubsection = async (subsectionId: string, data: Partial<Subsection>) => {
    try {
      await assessmentApi.updateSubsection(subsectionId, data);
      setSections(sections.map(s => ({
        ...s,
        subsections: s.subsections?.map(sub => sub.id === subsectionId ? { ...sub, ...data } : sub) || []
      })));
    } catch (err) {
      console.error('Update subsection error:', err);
    }
  };

  const openSettings = async (type: 'section' | 'subsection', itemId: string, data?: any) => {
    setSelectedItem({ type, id: itemId, data });
    setShowSettingsModal(true);
    
    if (type === 'section') {
      const section = sections.find(s => s.id === itemId);
      setSectionSettings({
        name: section?.name || '',
        description: section?.description || '',
        sectionDuration: section?.sectionDuration,
        sectionShowResults: section?.sectionShowResults,
        sectionShuffledQuestions: section?.sectionShuffledQuestions,
        sectionAllowPause: section?.sectionAllowPause,
        sectionAllowFlag: section?.sectionAllowFlag,
        sectionShowInstantResults: section?.sectionShowInstantResults,
        sectionBreakTime: section?.sectionBreakTime,
        sectionAllowCalculator: section?.sectionAllowCalculator,
        sectionAllowNotes: section?.sectionAllowNotes,
        sectionShowCorrectAnswers: section?.sectionShowCorrectAnswers,
        sectionQuestionDuration: section?.sectionQuestionDuration,
        sectionQuestionShowResults: section?.sectionQuestionShowResults,
        sectionQuestionShowCorrectAnswers: section?.sectionQuestionShowCorrectAnswers,
        sectionQuestionAllowFlag: section?.sectionQuestionAllowFlag,
        sectionQuestionDefaultMarks: section?.sectionQuestionDefaultMarks,
        questionPoolEnabled: section?.questionPoolEnabled,
        poolSize: section?.poolSize,
        poolRandomSelection: section?.poolRandomSelection,
        poolPullMarks: section?.poolPullMarks,
        poolPullDuration: section?.poolPullDuration,
      });
      try {
        const res = await assessmentApi.getSectionSettingsWithInheritance(itemId);
        if (res.success) {
          setSectionEffectiveSettings(res.data.effectiveSettings);
        }
      } catch (err) {
        console.error('Load section effective settings error:', err);
      }
    } else {
      const section = sections.find(s => s.subsections?.some(sub => sub.id === itemId));
      const subsection = section?.subsections?.find(sub => sub.id === itemId);
      setSubsectionSettings({
        name: subsection?.name || '',
        description: subsection?.description || '',
        subsectionDuration: subsection?.subsectionDuration,
        subsectionShowResults: subsection?.subsectionShowResults,
        subsectionShuffledQuestions: subsection?.subsectionShuffledQuestions,
        subsectionAllowPause: subsection?.subsectionAllowPause,
        subsectionAllowFlag: subsection?.subsectionAllowFlag,
        subsectionShowInstantResults: subsection?.subsectionShowInstantResults,
        subsectionBreakTime: subsection?.subsectionBreakTime,
        subsectionAllowCalculator: subsection?.subsectionAllowCalculator,
        subsectionAllowNotes: subsection?.subsectionAllowNotes,
        subsectionShowCorrectAnswers: subsection?.subsectionShowCorrectAnswers,
        subsectionQuestionDuration: subsection?.subsectionQuestionDuration,
        subsectionQuestionShowResults: subsection?.subsectionQuestionShowResults,
        subsectionQuestionShowCorrectAnswers: subsection?.subsectionQuestionShowCorrectAnswers,
        subsectionQuestionAllowFlag: subsection?.subsectionQuestionAllowFlag,
        subsectionQuestionDefaultMarks: subsection?.subsectionQuestionDefaultMarks,
        questionPoolEnabled: subsection?.questionPoolEnabled,
        poolSize: subsection?.poolSize,
        poolRandomSelection: subsection?.poolRandomSelection,
        poolPullMarks: subsection?.poolPullMarks,
        poolPullDuration: subsection?.poolPullDuration,
      });
      try {
        const res = await assessmentApi.getSubsectionSettingsWithInheritance(itemId);
        if (res.success) {
          setSubsectionEffectiveSettings(res.data.effectiveSettings);
        }
      } catch (err) {
        console.error('Load subsection effective settings error:', err);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'section') {
      await assessmentApi.updateSection(selectedItem.id, sectionSettings);
      setSections(sections.map(s => s.id === selectedItem.id ? { ...s, ...sectionSettings } : s));
    } else {
      await assessmentApi.updateSubsection(selectedItem.id, subsectionSettings);
      setSections(sections.map(s => ({
        ...s,
        subsections: s.subsections?.map(sub => sub.id === selectedItem.id ? { ...sub, ...subsectionSettings } : sub) || []
      })));
    }
    setShowSettingsModal(false);
  };

  const openUpdate = (type: 'section' | 'subsection', itemId: string, currentName: string) => {
    setSelectedItem({ type, id: itemId });
    setUpdateName(currentName);
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedItem || !updateName.trim()) return;
    
    if (selectedItem.type === 'section') {
      await assessmentApi.updateSection(selectedItem.id, { name: updateName });
      setSections(sections.map(s => s.id === selectedItem.id ? { ...s, name: updateName } : s));
    } else {
      await assessmentApi.updateSubsection(selectedItem.id, { name: updateName });
      setSections(sections.map(s => ({
        ...s,
        subsections: s.subsections?.map(sub => sub.id === selectedItem.id ? { ...sub, name: updateName } : sub) || []
      })));
    }
    setShowUpdateModal(false);
  };

  const openDelete = (type: 'section' | 'subsection', itemId: string) => {
    setSelectedItem({ type, id: itemId });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'section') {
      await assessmentApi.deleteSection(selectedItem.id);
      const newSections = sections.filter(s => s.id !== selectedItem.id);
      setSections(newSections);
    } else {
      await assessmentApi.deleteSubsection(selectedItem.id);
      setSections(sections.map(s => ({
        ...s,
        subsections: s.subsections?.filter(sub => sub.id !== selectedItem.id) || []
      })));
    }
    setShowDeleteModal(false);
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const handleAddQuestion = async (questionId: string, sectionId?: string, subsectionId?: string) => {
    if (!id) return;
    try {
      await assessmentApi.addQuestion(id, { questionId, sectionId, subsectionId });
      loadTestQuestions(id);
      if (sectionId && !subsectionId) {
        const res = await assessmentApi.getSections(id);
        if (res.success && res.data) {
          setSections(res.data as SectionWithSubsections[]);
        }
      }
    } catch (err) {
      console.error('Add question error:', err);
    }
  };

  const handleRemoveQuestion = async (testQuestionId: string) => {
    try {
      await assessmentApi.removeQuestion(testQuestionId);
      setTestQuestions(testQuestions.filter(tq => tq.id !== testQuestionId));
      if (id) {
        loadTestTotals();
      }
    } catch (err) {
      console.error('Remove question error:', err);
    }
  };

  const handleBulkAddQuestions = async () => {
    if (!id || !targetSectionId || selectedQuestionIds.length === 0) return;
    
    const existingQuestionIds = new Set(
      testQuestions
        .filter(tq => targetSubsectionId ? tq.subsectionId === targetSubsectionId : tq.sectionId === targetSectionId && !tq.subsectionId)
        .map(tq => tq.questionId)
    );
    
    const newQuestionIds = selectedQuestionIds.filter(qid => !existingQuestionIds.has(qid));
    
    if (newQuestionIds.length === 0) {
      alert('All selected questions already exist in this section/subsection');
      return;
    }
    
    if (existingQuestionIds.size > 0 && !confirm(`${existingQuestionIds.size} questions already exist. Add remaining ${newQuestionIds.length} anyway?`)) {
      return;
    }
    
    for (const qid of newQuestionIds) {
      await handleAddQuestion(qid, targetSectionId, targetSubsectionId || undefined);
    }
    
    setSelectedQuestionIds([]);
    setTargetSectionId('');
    setTargetSubsectionId('');
    setShowQuestionModal(false);
    loadTestQuestions(id);
    loadTestTotals();
  };

  const handleToggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestionIds.length === availableQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(availableQuestions.map(q => q.id));
    }
  };

  const openAddQuestion = (type: 'section' | 'subsection', itemId: string, data?: any) => {
    setCurrentSectionId(type === 'section' ? itemId : data?.sectionId);
    setCurrentSubsectionId(type === 'subsection' ? itemId : null);
    setPreSelectedContext({
      type,
      sectionId: data?.sectionId,
      sectionName: data?.sectionName,
      subsectionId: type === 'subsection' ? itemId : undefined,
      subsectionName: type === 'subsection' ? data?.name : undefined,
    });
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setPreSelectedContext(null);
    setCurrentSectionId(null);
    setCurrentSubsectionId(null);
    setSelectedQuestionIds([]);
    setQuestionFilter({});
    setQuestionPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/assessments')} className="p-2 hover:bg-gray-100 rounded-lg" title="Back to Assessments">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Test' : 'Create Test'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary flex items-center gap-2">
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Test'}
            </button>
            {isEdit && formData.status === 'draft' && (
              <button onClick={handlePublish} className="btn btn-secondary flex items-center gap-2">
                <Eye size={20} />
                Publish
              </button>
            )}
            {isEdit && formData.status === 'published' && (
              <button onClick={handleGoLive} className="btn btn-secondary flex items-center gap-2">
                <Play size={20} />
                Go Live
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          {[
            { id: 'basic', label: 'Basic', icon: FileText },
            { id: 'structure', label: 'Structure', icon: Folder },
            { id: 'questions', label: 'Questions', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'questions' && testQuestions.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {testQuestions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="Enter test title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Enter test description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as TestVisibility })}
                      className="input"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="input"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks (%)</label>
                    <input
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 0 })}
                      className="input"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                      className="input"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                <span className="text-sm text-primary-700">
                  Schedule: Test will be available between start and end dates. Status can only be changed within this window.
                </span>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Schedule</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formatDateForInput(formData.startDate)}
                      onChange={(e) => setFormData({ ...formData, startDate: formatDateFromInput(e.target.value) })}
                      className="input"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formatDateForInput(formData.endDate)}
                      onChange={(e) => setFormData({ ...formData, endDate: formatDateFromInput(e.target.value) })}
                      className="input"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.scheduledStartTime}
                      onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.scheduledEndTime}
                      onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Test Rules</h2>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.shuffledQuestions}
                      onChange={(e) => setFormData({ ...formData, shuffledQuestions: e.target.checked })}
                    />
                    <span className="text-sm">Shuffle Questions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.shuffledOptions}
                      onChange={(e) => setFormData({ ...formData, shuffledOptions: e.target.checked })}
                    />
                    <span className="text-sm">Shuffle Options</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showResults}
                      onChange={(e) => setFormData({ ...formData, showResults: e.target.checked })}
                    />
                    <span className="text-sm">Show Results</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showCorrectAnswers}
                      onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                    />
                    <span className="text-sm">Show Correct Answers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowPause}
                      onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                    />
                    <span className="text-sm">Allow Pause</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowFlag}
                      onChange={(e) => setFormData({ ...formData, allowFlag: e.target.checked })}
                    />
                    <span className="text-sm">Allow Flag</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showInstantResults}
                      onChange={(e) => setFormData({ ...formData, showInstantResults: e.target.checked })}
                    />
                    <span className="text-sm">Show Instant Results</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowCalculator}
                      onChange={(e) => setFormData({ ...formData, allowCalculator: e.target.checked })}
                    />
                    <span className="text-sm">Allow Calculator</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowNotes}
                      onChange={(e) => setFormData({ ...formData, allowNotes: e.target.checked })}
                    />
                    <span className="text-sm">Allow Notes</span>
                  </label>
                </div>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Proctoring</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proctoring Level</label>
                  <select
                    value={formData.proctoringLevel}
                    onChange={(e) => setFormData({ ...formData, proctoringLevel: e.target.value as ProctoringLevel })}
                    className="input"
                  >
                    <option value="none">No Proctoring</option>
                    <option value="basic">Basic</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.restrictDevices}
                      onChange={(e) => setFormData({ ...formData, restrictDevices: e.target.checked })}
                    />
                    <span className="text-sm">Restrict Devices</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.restrictIP}
                      onChange={(e) => setFormData({ ...formData, restrictIP: e.target.checked })}
                    />
                    <span className="text-sm">Restrict IP</span>
                  </label>
                  {formData.restrictIP && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowed IPs (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.allowedIPs}
                        onChange={(e) => setFormData({ ...formData, allowedIPs: e.target.value })}
                        className="input"
                        placeholder="192.168.1.1, 10.0.0.1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Questionnaire</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selectedQuestionnaireId}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setShowQuestionnaireModal(true);
                      } else {
                        setSelectedQuestionnaireId(undefined);
                        setFormData({ ...formData, questionnaireId: '' });
                      }
                    }}
                  />
                  <span className="text-sm">Enable Questionnaire (collect student responses)</span>
                </div>
                {selectedQuestionnaireId && (
                  <p className="text-sm text-green-600">Questionnaire enabled</p>
                )}
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold">Results & Notifications</h2>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendResultEmail}
                    onChange={(e) => setFormData({ ...formData, sendResultEmail: e.target.checked })}
                  />
                  <span className="text-sm">Send result email to students</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result Message</label>
                  <textarea
                    value={formData.resultMessage}
                    onChange={(e) => setFormData({ ...formData, resultMessage: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Message to show with results"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Instructions for students"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Sections & Subsections</h2>
                <button onClick={handleCreateSection} className="btn btn-primary flex items-center gap-2">
                  <Plus size={20} />
                  Add Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="card text-center py-12">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No sections created yet</p>
                  <button onClick={handleCreateSection} className="btn btn-primary">Create First Section</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, sectionIdx) => (
                    <div key={section.id} className="card">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSection(section.id)} className="p-1">
                              {section.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded">
                              {sectionIdx + 1}
                            </span>
                            <h3 className="font-semibold">{section.name}</h3>
                            <span className="text-xs text-gray-500">
                              ({testQuestions.filter(tq => tq.sectionId === section.id && !tq.subsectionId).length} questions)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openAddQuestion('section', section.id, { sectionId: section.id, sectionName: section.name })}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Add Questions"
                            >
                              <Plus size={18} />
                            </button>
                            <button
                              onClick={() => openSettings('section', section.id)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Settings"
                            >
                              <Shield size={18} />
                            </button>
                            <button
                              onClick={() => openUpdate('section', section.id, section.name)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openDelete('section', section.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {section.isExpanded && (
                        <div className="p-4">
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={() => handleCreateSubsection(section.id)}
                              className="btn btn-secondary text-sm flex items-center gap-1"
                            >
                              <Plus size={16} />
                              Add Subsection
                            </button>
                          </div>

                          {section.subsections && section.subsections.length > 0 && (
                            <div className="space-y-3">
                              {section.subsections.map((subsection, subsectionIdx) => (
                                <div key={subsection.id} className="border border-gray-200 rounded-lg p-3 ml-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FolderOpen size={16} className="text-gray-400" />
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {sectionIdx + 1}.{subsectionIdx + 1}
                                      </span>
                                      <h4 className="font-medium">{subsection.name}</h4>
                                      <span className="text-xs text-gray-500">
                                        ({testQuestions.filter(tq => tq.subsectionId === subsection.id).length} questions)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openAddQuestion('subsection', subsection.id, { sectionId: section.id, sectionName: section.name, name: subsection.name })}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Add Questions"
                                      >
                                        <Plus size={18} />
                                      </button>
                                      <button
                                        onClick={() => openSettings('subsection', subsection.id)}
                                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                        title="Settings"
                                      >
                                        <Shield size={18} />
                                      </button>
                                      <button
                                        onClick={() => openUpdate('subsection', subsection.id, subsection.name)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                      >
                                        <Edit size={18} />
                                      </button>
                                      <button
                                        onClick={() => openDelete('subsection', subsection.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Delete"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {calculatedTotals && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Test Totals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Questions</p>
                      <p className="text-2xl font-bold">{testQuestions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Marks</p>
                      <p className="text-2xl font-bold">{calculatedTotals.totalMarks}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2">
                <Shield size={18} className="text-primary-600" />
                <span className="text-sm text-primary-700">
                  Questions are managed at the section/subsection level. Use the Structure tab to organize questions into sections.
                </span>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Questions in Test</h2>
                <span className="text-sm text-gray-500">{testQuestions.length} questions</span>
              </div>

              {sections.length === 0 ? (
                <div className="card text-center py-12">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Create sections first to add questions</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sections.map((section, sectionIdx) => (
                    <div key={section.id} className="card">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded">
                            {sectionIdx + 1}
                          </span>
                          <h3 className="font-semibold">{section.name}</h3>
                          <span className="text-xs text-gray-500">
                            ({testQuestions.filter(tq => tq.sectionId === section.id && !tq.subsectionId).length} questions)
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {testQuestions
                            .filter(tq => tq.sectionId === section.id && !tq.subsectionId)
                            .map((tq, idx) => (
                              <div key={tq.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{idx + 1}</span>
                                  <div>
                                    <p className="font-medium">{tq.question?.title || 'Question'}</p>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                      <span>Marks: {tq.marks}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveQuestion(tq.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                      {section.subsections && section.subsections.length > 0 && (
                        <div className="space-y-3 mt-4 pt-4 border-t">
                          {section.subsections.map((subsection, subsectionIdx) => (
                            <div key={subsection.id} className="border border-gray-200 rounded-lg p-4 ml-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {sectionIdx + 1}.{subsectionIdx + 1}
                                </span>
                                <FolderOpen className="w-4 h-4 text-gray-400" />
                                <h4 className="font-medium">{subsection.name}</h4>
                                <span className="text-xs text-gray-500">
                                  ({testQuestions.filter(tq => tq.subsectionId === subsection.id).length} questions)
                                </span>
                              </div>
                              <div className="space-y-2">
                                {testQuestions
                                  .filter(tq => tq.subsectionId === subsection.id)
                                  .map((tq, idx) => (
                                    <div key={tq.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ml-4">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{idx + 1}</span>
                                        <p className="font-medium">{tq.question?.title || 'Question'}</p>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveQuestion(tq.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title={selectedItem?.type === 'section' ? 'Section Settings' : 'Subsection Settings'} size="xl">
          <div className="space-y-4">
            {selectedItem?.type === 'section' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Rules</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                      <input 
                        type="number" 
                        value={sectionSettings.sectionDuration || ''} 
                        onChange={(e) => setSectionSettings({...sectionSettings, sectionDuration: parseInt(e.target.value) || 0})} 
                        className="input" 
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionShowResults ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionShowResults: e.target.checked})} />
                      <span className="text-sm">Show Results</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionShuffledQuestions || false} onChange={(e) => setSectionSettings({...sectionSettings, sectionShuffledQuestions: e.target.checked})} />
                      <span className="text-sm">Shuffle Questions</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionShowCorrectAnswers ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionShowCorrectAnswers: e.target.checked})} />
                      <span className="text-sm">Show Correct Answers</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionAllowPause ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionAllowPause: e.target.checked})} />
                      <span className="text-sm">Allow Pause</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionAllowFlag ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionAllowFlag: e.target.checked})} />
                      <span className="text-sm">Allow Flag</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionShowInstantResults ?? false} onChange={(e) => setSectionSettings({...sectionSettings, sectionShowInstantResults: e.target.checked})} />
                      <span className="text-sm">Show Instant Results</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionAllowCalculator ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionAllowCalculator: e.target.checked})} />
                      <span className="text-sm">Allow Calculator</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={sectionSettings.sectionAllowNotes ?? true} onChange={(e) => setSectionSettings({...sectionSettings, sectionAllowNotes: e.target.checked})} />
                      <span className="text-sm">Allow Notes</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {selectedItem?.type === 'subsection' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subsection Rules</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                      <input 
                        type="number" 
                        value={subsectionSettings.subsectionDuration || ''} 
                        onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionDuration: parseInt(e.target.value) || 0})} 
                        className="input" 
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionShowResults ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionShowResults: e.target.checked})} />
                      <span className="text-sm">Show Results</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionShuffledQuestions || false} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionShuffledQuestions: e.target.checked})} />
                      <span className="text-sm">Shuffle Questions</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionShowCorrectAnswers ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionShowCorrectAnswers: e.target.checked})} />
                      <span className="text-sm">Show Correct Answers</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionAllowPause ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionAllowPause: e.target.checked})} />
                      <span className="text-sm">Allow Pause</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionAllowFlag ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionAllowFlag: e.target.checked})} />
                      <span className="text-sm">Allow Flag</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionShowInstantResults ?? false} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionShowInstantResults: e.target.checked})} />
                      <span className="text-sm">Show Instant Results</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionAllowCalculator ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionAllowCalculator: e.target.checked})} />
                      <span className="text-sm">Allow Calculator</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={subsectionSettings.subsectionAllowNotes ?? true} onChange={(e) => setSubsectionSettings({...subsectionSettings, subsectionAllowNotes: e.target.checked})} />
                      <span className="text-sm">Allow Notes</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveSettings} className="btn btn-primary">Save Settings</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Name" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={updateName} onChange={(e) => setUpdateName(e.target.value)} className="input" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowUpdateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveUpdate} className="btn btn-primary">Save</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete" size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this {selectedItem?.type}? 
              {selectedItem?.type === 'section' && ' All subsections and questions in this section will also be removed.'}
              {selectedItem?.type === 'subsection' && ' All questions in this subsection will also be removed.'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConfirmDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showQuestionModal} onClose={closeQuestionModal} title="Question Bank" size="xl">
          <div className="space-y-4">
            {preSelectedContext && (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2">
                <Lock size={16} className="text-primary-600" />
                <span className="text-sm text-primary-700">
                  Adding questions to: {preSelectedContext.sectionName}
                  {preSelectedContext.type === 'subsection' && ` → ${preSelectedContext.subsectionName}`}
                </span>
              </div>
            )}

            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={questionFilter.search || ''}
                    onChange={(e) => setQuestionFilter({ ...questionFilter, search: e.target.value })}
                    className="input"
                  />
                </div>
                <select
                  value={questionFilter.difficulty || ''}
                  onChange={(e) => setQuestionFilter({ ...questionFilter, difficulty: e.target.value as QuestionDifficulty || undefined })}
                  className="input w-auto"
                >
                  <option value="">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  value={questionFilter.type || ''}
                  onChange={(e) => setQuestionFilter({ ...questionFilter, type: e.target.value as QuestionType || undefined })}
                  className="input w-auto"
                >
                  <option value="">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="coding">Coding</option>
                  <option value="subjective">Subjective</option>
                  <option value="sql">SQL</option>
                </select>
                <select
                  value={questionFilter.tags?.[0] || ''}
                  onChange={(e) => setQuestionFilter({ ...questionFilter, tags: e.target.value ? [e.target.value] : undefined })}
                  className="input w-auto"
                >
                  <option value="">All Tags</option>
                  {existingTagNames.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuestionIds.length === availableQuestions.length}
                  onChange={handleSelectAllQuestions}
                />
                <span className="text-sm">Select All</span>
              </label>
              <span className="text-sm text-gray-500">
                Page {questionPage} of {totalQuestionPages}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No questions found</div>
              ) : (
                availableQuestions.map(q => (
                  <div key={q.id} className="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={() => handleToggleQuestionSelection(q.id)}
                      />
                      <div>
                        <p className="font-medium">{q.title}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span className="uppercase">{q.type}</span>
                          <span>{q.difficulty}</span>
                          <span>Marks: {q.marks}</span>
                          {q.tags && q.tags.length > 0 && <span>Tags: {q.tags.join(', ')}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                  disabled={questionPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                  disabled={questionPage === totalQuestionPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>

            {!preSelectedContext && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={targetSectionId}
                      onChange={(e) => {
                        setTargetSectionId(e.target.value);
                        setTargetSubsectionId('');
                      }}
                      className="input"
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {targetSectionId && (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subsection (Optional)</label>
                      <select
                        value={targetSubsectionId}
                        onChange={(e) => setTargetSubsectionId(e.target.value)}
                        className="input"
                      >
                        <option value="">No Subsection</option>
                        {sections.find(s => s.id === targetSectionId)?.subsections?.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm">
                {selectedQuestionIds.length} questions selected
              </span>
              <button
                onClick={handleBulkAddQuestions}
                disabled={selectedQuestionIds.length === 0 || (!preSelectedContext && !targetSectionId)}
                className="btn btn-primary"
              >
                Add Selected Questions
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showQuestionnaireModal} onClose={() => setShowQuestionnaireModal(false)} title="Select Questionnaire" size="md">
          <QuestionnaireManager
            isOpen={showQuestionnaireModal}
            onClose={() => setShowQuestionnaireModal(false)}
            onSelect={(questionnaire) => {
              setSelectedQuestionnaireId(questionnaire.id);
              setFormData({ ...formData, questionnaireId: questionnaire.id });
              setShowQuestionnaireModal(false);
            }}
            selectedQuestionnaireId={selectedQuestionnaireId}
          />
        </Modal>
      </div>
    </div>
  );
}
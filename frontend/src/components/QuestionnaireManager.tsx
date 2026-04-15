import { useState, useEffect } from 'react';
import { Modal } from './PopupMenu';
import { questionnaireApi } from '@/services/questionnaireApi';
import type { Questionnaire, QuestionnaireField, QuestionnaireFieldType } from '@/types/questionnaire';
import { Plus, Trash2, Edit3, GripVertical, X, Check, FileText, Save, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface QuestionnaireManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (questionnaire: Questionnaire) => void;
  selectedQuestionnaireId?: string;
}

const FIELD_TYPES: { value: QuestionnaireFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'dob', label: 'Date of Birth' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'mcq', label: 'Multiple Choice' },
];

export default function QuestionnaireManager({ isOpen, onClose, onSelect, selectedQuestionnaireId }: QuestionnaireManagerProps) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const [allowComments, setAllowComments] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<QuestionnaireFieldType>('text');
  const [newFieldMandatory, setNewFieldMandatory] = useState(false);
  const [newFieldScale, setNewFieldScale] = useState(5);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>(['Option 1', 'Option 2']);
  
  const [editingOptions, setEditingOptions] = useState(false);
  const [tempOptions, setTempOptions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadQuestionnaires();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedQuestionnaireId && view === 'list') {
      const found = questionnaires.find(q => q.id === selectedQuestionnaireId);
      if (found) {
        setEditingId(found.id);
        setFormName(found.name);
        setFields(found.fields || []);
        setAllowComments(found.allowComments ?? true);
        setView('form');
      }
    }
  }, [selectedQuestionnaireId]);

  const loadQuestionnaires = async () => {
    setLoading(true);
    try {
      const res = await questionnaireApi.getAll();
      if (res.success) {
        setQuestionnaires(res.data || []);
      }
    } catch (err) {
      console.error('Load questionnaires error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFields([]);
    setAllowComments(true);
    setEditingId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setView('form');
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingId(questionnaire.id);
    setFormName(questionnaire.name);
    setFields(questionnaire.fields || []);
    setAllowComments(questionnaire.allowComments ?? true);
    setView('form');
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: formName,
        fields: fields.map((f, idx) => ({
          ...f,
          order: idx,
        })),
        allowComments,
      };
      
      let res;
      if (editingId) {
        res = await questionnaireApi.update(editingId, data);
      } else {
        res = await questionnaireApi.create(data);
      }
      
      if (res.success) {
        loadQuestionnaires();
        setView('list');
        resetForm();
      }
    } catch (err) {
      console.error('Save questionnaire error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return;
    try {
      await questionnaireApi.delete(id);
      loadQuestionnaires();
      if (editingId === id) {
        resetForm();
        setView('list');
      }
    } catch (err) {
      console.error('Delete questionnaire error:', err);
    }
  };

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    
    const newField: QuestionnaireField = {
      id: `field-${Date.now()}`,
      type: newFieldType,
      label: newFieldLabel,
      mandatory: newFieldMandatory,
      order: fields.length,
    };
    
    if (newFieldType === 'rating') {
      newField.scale = newFieldScale;
    }
    if (newFieldType === 'mcq') {
      newField.options = [...newFieldOptions];
    }
    
    setFields([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldMandatory(false);
    setNewFieldScale(5);
    setNewFieldOptions(['Option 1', 'Option 2']);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    setFields(newFields.map((f, idx) => ({ ...f, order: idx })));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Questionnaire Manager" size="lg">
      {view === 'list' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Saved Questionnaires</h3>
            <button onClick={handleCreateNew} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Create New
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : questionnaires.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No questionnaires yet</p>
              <p className="text-sm">Create one to collect student responses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questionnaires.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{q.name}</p>
                    <p className="text-xs text-gray-500">
                      {q.fields?.length || 0} fields
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onSelect && (
                      <button
                        onClick={() => onSelect(q)}
                        className="btn btn-primary text-sm"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(q)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => { setView('list'); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-semibold">{editingId ? 'Edit Questionnaire' : 'New Questionnaire'}</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questionnaire Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input"
              placeholder="e.g., Student Feedback Form"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Fields</h4>
            
            <div className="space-y-2 mb-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                  <GripVertical className="text-gray-300 cursor-move" size={18} />
                  <div className="flex-1">
                    <p className="font-medium">{field.label}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="uppercase">{field.type}</span>
                      {field.mandatory && <span className="text-red-500">Required</span>}
                      {field.type === 'rating' && <span>Scale: {field.scale}</span>}
                      {field.type === 'mcq' && <span>Options: {field.options?.length}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeField(field.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border rounded-lg">
              <h5 className="text-sm font-medium mb-2">Add New Field</h5>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="input"
                  placeholder="Field label"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as QuestionnaireFieldType)}
                  className="input"
                >
                  {FIELD_TYPES.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              
              {newFieldType === 'rating' && (
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Scale (1-10)</label>
                  <input
                    type="number"
                    value={newFieldScale}
                    onChange={(e) => setNewFieldScale(parseInt(e.target.value) || 5)}
                    className="input w-24"
                    min={1}
                    max={10}
                  />
                </div>
              )}
              
              {newFieldType === 'mcq' && (
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Options</label>
                  {newFieldOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-1 mb-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...newFieldOptions];
                          newOpts[idx] = e.target.value;
                          setNewFieldOptions(newOpts);
                        }}
                        className="input flex-1"
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button
                        onClick={() => setNewFieldOptions(newFieldOptions.filter((_, i) => i !== idx))}
                        className="p-1 text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewFieldOptions([...newFieldOptions, `Option ${newFieldOptions.length + 1}`])}
                    className="text-sm text-primary-600"
                  >
                    + Add Option
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newFieldMandatory}
                    onChange={(e) => setNewFieldMandatory(e.target.checked)}
                  />
                  <span className="text-sm">Mandatory</span>
                </label>
                <button onClick={addField} className="btn btn-secondary text-sm">
                  <Plus size={16} />
                  Add Field
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
              <span className="text-sm">Allow additional comments</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setView('list'); resetForm(); }} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn btn-primary">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Questionnaire'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
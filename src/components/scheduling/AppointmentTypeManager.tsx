import React, { useState } from 'react';
import { AppointmentTypeConfig, AppointmentMode, PatientEligibility } from '../../types';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  X,
  Sliders,
  DollarSign,
  MapPin,
  Video,
} from 'lucide-react';

interface AppointmentTypeManagerProps {
  providerId: string;
  onUpdated?: () => void;
}

export const AppointmentTypeManager: React.FC<AppointmentTypeManagerProps> = ({
  providerId,
  onUpdated,
}) => {
  const [types, setTypes] = useState<AppointmentTypeConfig[]>(
    SchedulingEngine.getAppointmentTypes(providerId)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState<Partial<AppointmentTypeConfig> | null>(null);

  const refreshList = () => {
    const updated = SchedulingEngine.getAppointmentTypes(providerId);
    setTypes(updated);
    if (onUpdated) onUpdated();
  };

  const handleOpenCreate = () => {
    setCurrentType({
      id: `apt-type-${Date.now()}`,
      providerId,
      name: '',
      description: '',
      durationMinutes: 30,
      locationName: 'Consulting Room 1',
      mode: 'IN_PERSON',
      patientEligibility: 'ALL_PATIENTS',
      leadTimeHours: 2,
      bookingHorizonDays: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      minCancellationNoticeHours: 24,
      cancellationPolicyText: 'Please provide at least 24 hours notice for cancellations.',
      priceZAR: 650,
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (t: AppointmentTypeConfig) => {
    setCurrentType({ ...t });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this appointment type?')) {
      SchedulingEngine.deleteAppointmentType(id);
      refreshList();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentType || !currentType.name) return;

    SchedulingEngine.saveAppointmentType(currentType as AppointmentTypeConfig);
    setIsEditing(false);
    setCurrentType(null);
    refreshList();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#176BFF]" /> Configured Appointment Types
          </h3>
          <p className="text-xs text-slate-500">
            Define consultation modes, standard durations, buffers, booking lead times, and pricing.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Appointment Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {types.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <Badge variant={t.mode === 'VIRTUAL' ? 'info' : 'success'} size="sm">
                    {t.mode === 'VIRTUAL' ? 'Virtual' : 'In-Person'}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#176BFF] hover:bg-blue-50 transition-colors"
                  title="Edit Appointment Type"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF3D71] hover:bg-rose-50 transition-colors"
                  title="Delete Appointment Type"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  <strong>{t.durationMinutes} mins</strong> (+{t.bufferAfterMinutes}m buffer)
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>R{t.priceZAR.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Lead: {t.leadTimeHours}h | Max: {t.bookingHorizonDays}d</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{t.locationName}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isEditing && currentType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-xl my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {currentType.id?.startsWith('apt-type-') && !types.some((x) => x.id === currentType.id)
                  ? 'Create New Appointment Type'
                  : 'Edit Appointment Type'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <Input
                label="Appointment Type Name"
                placeholder="e.g. Standard Consultation (GP)"
                value={currentType.name || ''}
                onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
                required
              />

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Clinical Focus</label>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
                  rows={2}
                  placeholder="Summary of services included in this consultation"
                  value={currentType.description || ''}
                  onChange={(e) => setCurrentType({ ...currentType, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Duration (Minutes)"
                  type="number"
                  min={5}
                  max={240}
                  value={currentType.durationMinutes || 30}
                  onChange={(e) =>
                    setCurrentType({ ...currentType, durationMinutes: Number(e.target.value) })
                  }
                  required
                />
                <Input
                  label="Price (ZAR)"
                  type="number"
                  min={0}
                  value={currentType.priceZAR || 0}
                  onChange={(e) =>
                    setCurrentType({ ...currentType, priceZAR: Number(e.target.value) })
                  }
                  required
                />
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mode</label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#176BFF]"
                    value={currentType.mode || 'IN_PERSON'}
                    onChange={(e) =>
                      setCurrentType({
                        ...currentType,
                        mode: e.target.value as AppointmentMode,
                      })
                    }
                  >
                    <option value="IN_PERSON">In-Person Consultation</option>
                    <option value="VIRTUAL">Virtual Video Telehealth</option>
                    <option value="HOME_VISIT">Home Visit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Location / Room / Link Name"
                  placeholder="Room 2A or Video Room"
                  value={currentType.locationName || ''}
                  onChange={(e) => setCurrentType({ ...currentType, locationName: e.target.value })}
                  required
                />
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Patient Eligibility</label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#176BFF]"
                    value={currentType.patientEligibility || 'ALL_PATIENTS'}
                    onChange={(e) =>
                      setCurrentType({
                        ...currentType,
                        patientEligibility: e.target.value as PatientEligibility,
                      })
                    }
                  >
                    <option value="ALL_PATIENTS">All Patients (New & Existing)</option>
                    <option value="NEW_PATIENT_ONLY">New Patients Only</option>
                    <option value="EXISTING_PATIENT_ONLY">Existing / Follow-Up Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <Input
                  label="Buffer After (m)"
                  type="number"
                  min={0}
                  value={currentType.bufferAfterMinutes || 0}
                  onChange={(e) =>
                    setCurrentType({
                      ...currentType,
                      bufferAfterMinutes: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Min Lead Time (h)"
                  type="number"
                  min={0}
                  value={currentType.leadTimeHours || 2}
                  onChange={(e) =>
                    setCurrentType({
                      ...currentType,
                      leadTimeHours: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Max Horizon (d)"
                  type="number"
                  min={1}
                  value={currentType.bookingHorizonDays || 30}
                  onChange={(e) =>
                    setCurrentType({
                      ...currentType,
                      bookingHorizonDays: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Cancel Notice (h)"
                  type="number"
                  min={0}
                  value={currentType.minCancellationNoticeHours || 24}
                  onChange={(e) =>
                    setCurrentType({
                      ...currentType,
                      minCancellationNoticeHours: Number(e.target.value),
                    })
                  }
                />
              </div>

              <Input
                label="Cancellation Policy Notice"
                value={currentType.cancellationPolicyText || ''}
                onChange={(e) =>
                  setCurrentType({ ...currentType, cancellationPolicyText: e.target.value })
                }
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Appointment Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

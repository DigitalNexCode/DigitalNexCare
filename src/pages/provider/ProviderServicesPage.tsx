import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { PracticeService } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  Plus,
  Clock,
  Video,
  Building,
  CheckCircle2,
  FileText,
  Edit,
  Tag,
} from 'lucide-react';

export const ProviderServicesPage: React.FC = () => {
  const [services, setServices] = useState<PracticeService[]>(
    Chunk8OperationsService.getServices()
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priceZAR, setPriceZAR] = useState(650);
  const [isVirtual, setIsVirtual] = useState(false);
  const [isInPerson, setIsInPerson] = useState(true);
  const [tariffCode, setTariffCode] = useState('0190');
  const [icd10Category, setIcd10Category] = useState('General Consultation');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const created = Chunk8OperationsService.addService({
      practiceId: 'prac-hatfield-01',
      name,
      description,
      durationMinutes: Number(durationMinutes),
      priceZAR: Number(priceZAR),
      isVirtual,
      isInPerson,
      tariffCode,
      icd10Category,
      active: true,
    });

    setServices(Chunk8OperationsService.getServices());
    setShowAddModal(false);
    setName('');
    setDescription('');
    setSuccessMessage(`Service "${created.name}" created and published to patient booking engine.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <ProviderLayout
      title="Practice Services, Fees & Medical Tariffs"
      subtitle="Configure consultation procedures, durations, cash/card prices, medical aid tariff codes, and virtual modes."
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Practice Services ({services.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hatfield Family Medical Centre • Direct Medical Aid Billing Supported
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Practice Service
          </Button>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#176BFF]/10 text-[#176BFF] flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-emerald-600">
                          R{srv.priceZAR} ZAR
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {srv.durationMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={srv.active ? 'verified' : 'neutral'} size="sm">
                    {srv.active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {srv.description}
                </p>

                {/* Modality & Codes */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Consultation Modes:</span>
                    <div className="flex items-center gap-1.5">
                      {srv.isInPerson && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-500" />
                          In-Person
                        </span>
                      )}
                      {srv.isVirtual && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center gap-1">
                          <Video className="w-3 h-3 text-indigo-500" />
                          Virtual Video
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tariff: <strong className="text-slate-800">{srv.tariffCode || '0190'}</strong></span>
                    </div>
                    {srv.icd10Category && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{srv.icd10Category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Direct Medical Aid Claimable
                </span>
                <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Edit Fee
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Service */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Practice Service</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                <Input
                  label="Service Procedure Name"
                  placeholder="e.g. Minor Surgical Excision / Stitches"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Clinical Description"
                  placeholder="Detailed procedure overview for patient understanding"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price in ZAR (R)"
                    type="number"
                    value={priceZAR}
                    onChange={(e) => setPriceZAR(Number(e.target.value))}
                    required
                  />
                  <Input
                    label="Duration (Minutes)"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Medical Aid Tariff Code"
                    placeholder="e.g. 0190 / 0201"
                    value={tariffCode}
                    onChange={(e) => setTariffCode(e.target.value)}
                    required
                  />
                  <Input
                    label="ICD-10 Primary Category"
                    placeholder="e.g. General Consult (Z71)"
                    value={icd10Category}
                    onChange={(e) => setIcd10Category(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2">
                  <span className="font-bold text-slate-700 block mb-1.5">Consultation Modes</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInPerson}
                        onChange={(e) => setIsInPerson(e.target.checked)}
                        className="rounded-md text-[#176BFF] focus:ring-[#176BFF]"
                      />
                      <span className="font-semibold text-slate-800">In-Person Consultation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVirtual}
                        onChange={(e) => setIsVirtual(e.target.checked)}
                        className="rounded-md text-[#176BFF] focus:ring-[#176BFF]"
                      />
                      <span className="font-semibold text-slate-800">Virtual Video / Audio</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Service
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};

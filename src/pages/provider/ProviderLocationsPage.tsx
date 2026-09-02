import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { PracticeLocation, SouthAfricanProvince } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  MapPin,
  Building,
  Plus,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Navigation,
  DoorOpen,
  Edit,
} from 'lucide-react';

export const ProviderLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<PracticeLocation[]>(
    Chunk8OperationsService.getLocations()
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('Pretoria');
  const [province, setProvince] = useState<SouthAfricanProvince>('Gauteng');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomsInput, setRoomsInput] = useState('Consulting Room 1, Consulting Room 2');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const roomsList = roomsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const created = Chunk8OperationsService.addLocation({
      practiceId: 'prac-hatfield-01',
      name: newBranchName,
      address,
      suburb,
      city,
      province,
      coordinates: { latitude: -25.75 + Math.random() * 0.05, longitude: 28.23 + Math.random() * 0.05 },
      phone,
      email,
      rooms: roomsList.length > 0 ? roomsList : ['Standard Consultation Suite'],
      isMainBranch: false,
      operatingHours: {
        monday: '08:00 - 17:00',
        tuesday: '08:00 - 17:00',
        wednesday: '08:00 - 17:00',
        thursday: '08:00 - 17:00',
        friday: '08:00 - 16:00',
        saturday: '09:00 - 12:30',
        sunday: 'Closed',
      },
    });

    setLocations(Chunk8OperationsService.getLocations());
    setShowAddModal(false);
    setNewBranchName('');
    setAddress('');
    setSuburb('');
    setPhone('');
    setEmail('');
    setSuccessMessage(`Branch location "${created.name}" created successfully.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <ProviderLayout
      title="Practice Locations & Consulting Rooms"
      subtitle="Manage your physical clinics, satellite consultation branches, GPS map pins, and allocated rooms."
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Configured Clinical Branches ({locations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hatfield Family Medical Centre • Multi-Location Practice Network
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Branch Location
          </Button>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                      <p className="text-xs text-slate-500">{loc.suburb}, {loc.city}</p>
                    </div>
                  </div>
                  {loc.isMainBranch ? (
                    <Badge variant="verified" size="sm">
                      Main Clinic
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Satellite Branch
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{loc.address}, {loc.city}, {loc.province}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{loc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{loc.email}</span>
                  </div>
                </div>

                {/* Rooms List */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Consulting Rooms & Procedure Facilities ({loc.rooms.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {loc.rooms.map((room, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium"
                      >
                        {room}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hours Preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Mon - Fri:</span>
                    <span>{loc.operatingHours.monday}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-semibold text-slate-700">Saturday:</span>
                    <span>{loc.operatingHours.saturday}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS: {loc.coordinates.latitude.toFixed(4)}, {loc.coordinates.longitude.toFixed(4)}</span>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Edit Branch
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Location */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Practice Branch</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
                <Input
                  label="Branch / Facility Name"
                  placeholder="e.g. Centurion Wellness Suite"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  required
                />

                <Input
                  label="Physical Street Address"
                  placeholder="e.g. 14 Botha Avenue, Die Hoewes"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Suburb"
                    placeholder="e.g. Die Hoewes"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Centurion / Pretoria"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Contact Phone"
                    placeholder="+27 12 664 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Input
                    label="Contact Email"
                    placeholder="branch@practice.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Rooms / Facilities (comma separated)"
                  placeholder="Room 1, Paediatric Room, Lab Suite"
                  value={roomsInput}
                  onChange={(e) => setRoomsInput(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Branch
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

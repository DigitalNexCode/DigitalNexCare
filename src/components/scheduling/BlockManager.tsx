import React, { useState } from 'react';
import { ScheduleBlock, ScheduleBlockType } from '../../types';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Ban,
  Plus,
  Trash2,
  Calendar,
  Clock,
  X,
  ShieldAlert,
  Coffee,
  HeartHandshake,
  AlertTriangle,
} from 'lucide-react';

interface BlockManagerProps {
  providerId: string;
  onUpdated?: () => void;
}

export const BlockManager: React.FC<BlockManagerProps> = ({ providerId, onUpdated }) => {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(SchedulingEngine.getBlocks(providerId));
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [blockType, setBlockType] = useState<ScheduleBlockType>('LUNCH_BREAK');
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-10');
  const [startTime, setStartTime] = useState('12:30');
  const [endTime, setEndTime] = useState('13:30');
  const [isAllDay, setIsAllDay] = useState(false);
  const [notes, setNotes] = useState('');

  const refresh = () => {
    const updated = SchedulingEngine.getBlocks(providerId);
    setBlocks(updated);
    if (onUpdated) onUpdated();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    SchedulingEngine.createBlock({
      providerId,
      title,
      blockType,
      startDate,
      endDate,
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime,
      isAllDay,
      notes,
    });

    setIsCreating(false);
    setTitle('');
    setNotes('');
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this schedule block?')) {
      SchedulingEngine.deleteBlock(id);
      refresh();
    }
  };

  const getBlockTypeIcon = (type: ScheduleBlockType) => {
    switch (type) {
      case 'LUNCH_BREAK':
        return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
      case 'EMERGENCY_COVER':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#FF3D71]" />;
      case 'LEAVE':
        return <Ban className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#FF3D71]" /> Leave, Breaks & Blackout Blocks
          </h3>
          <p className="text-xs text-slate-500">
            Blackout slots for lunch, administrative charting, annual leave, or emergency theatre rounds.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Block / Break
        </Button>
      </div>

      <div className="space-y-2.5">
        {blocks.map((b) => (
          <div
            key={b.id}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 mt-0.5 sm:mt-0">{getBlockTypeIcon(b.blockType)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{b.title}</span>
                  <Badge variant="warning" size="sm">
                    {b.blockType.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {b.startDate} {b.startDate !== b.endDate ? `to ${b.endDate}` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {b.isAllDay ? 'All Day' : `${b.startTime} - ${b.endTime}`}
                  </span>
                  {b.notes && <span className="italic text-slate-400">"{b.notes}"</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(b.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF3D71] hover:bg-rose-50 transition-colors self-end sm:self-center"
              title="Delete Block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Schedule Block / Leave</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <Input
                label="Block Title / Reason"
                placeholder="e.g. Daily Lunch Break or Annual Leave"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Block Category</label>
                <select
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#176BFF]"
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as ScheduleBlockType)}
                >
                  <option value="LUNCH_BREAK">Lunch Break & Charting</option>
                  <option value="LEAVE">Annual / Sick Leave</option>
                  <option value="ADMIN_TIME">Practice Admin / Meetings</option>
                  <option value="EMERGENCY_COVER">Hospital / Emergency Cover</option>
                  <option value="PUBLIC_HOLIDAY">Public Holiday</option>
                  <option value="PERSONAL">Personal Time</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allDayCheck"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="rounded text-[#176BFF]"
                />
                <label htmlFor="allDayCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  All-Day Blackout (entire business day)
                </label>
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              )}

              <Input
                label="Notes (Optional)"
                placeholder="Internal notes for reception staff"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Block
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

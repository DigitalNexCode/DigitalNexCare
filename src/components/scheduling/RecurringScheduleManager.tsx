import React, { useState } from 'react';
import { RecurringDaySchedule, DayOfWeek, DayTimeInterval } from '../../types';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Clock, Plus, Trash2, Check, Calendar, AlertCircle } from 'lucide-react';

interface RecurringScheduleManagerProps {
  providerId: string;
  onSaved?: () => void;
}

const DAYS_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const RecurringScheduleManager: React.FC<RecurringScheduleManagerProps> = ({
  providerId,
  onSaved,
}) => {
  const [schedule, setSchedule] = useState<RecurringDaySchedule[]>(
    SchedulingEngine.getRecurringSchedule(providerId)
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  const handleToggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === day) {
          const isEnabled = !item.isEnabled;
          return {
            ...item,
            isEnabled,
            intervals:
              isEnabled && item.intervals.length === 0
                ? [{ id: `int-${Date.now()}`, startTime: '08:30', endTime: '16:30' }]
                : item.intervals,
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleAddInterval = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === day) {
          const newInt: DayTimeInterval = {
            id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            startTime: '13:30',
            endTime: '17:00',
          };
          return {
            ...item,
            intervals: [...item.intervals, newInt],
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleRemoveInterval = (day: DayOfWeek, intervalId: string) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === day) {
          return {
            ...item,
            intervals: item.intervals.filter((i) => i.id !== intervalId),
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleTimeChange = (
    day: DayOfWeek,
    intervalId: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === day) {
          return {
            ...item,
            intervals: item.intervals.map((i) => (i.id === intervalId ? { ...i, [field]: value } : i)),
          };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    SchedulingEngine.saveRecurringSchedule(providerId, schedule);
    setHasUnsavedChanges(false);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#176BFF]" /> Weekly Recurring Working Hours
          </h3>
          <p className="text-xs text-slate-500">
            Configure open shifts and consultation intervals for each day of the week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMessage && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Changes Saved
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            Save Working Hours
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {DAYS_ORDER.map((day) => {
          const dayConfig = schedule.find((s) => s.dayOfWeek === day) || {
            dayOfWeek: day,
            isEnabled: false,
            intervals: [],
          };

          return (
            <div
              key={day}
              className={`p-4 rounded-2xl border transition-all ${
                dayConfig.isEnabled
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/60 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayConfig.isEnabled}
                      onChange={() => handleToggleDay(day)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#176BFF]"></div>
                  </label>
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {dayConfig.isEnabled ? `${dayConfig.intervals.length} shift(s)` : 'Closed'}
                    </span>
                  </div>
                </div>

                {dayConfig.isEnabled && (
                  <div className="flex flex-wrap items-center gap-2">
                    {dayConfig.intervals.map((interval, idx) => (
                      <div
                        key={interval.id}
                        className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <input
                          type="time"
                          value={interval.startTime}
                          onChange={(e) =>
                            handleTimeChange(day, interval.id, 'startTime', e.target.value)
                          }
                          className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={interval.endTime}
                          onChange={(e) =>
                            handleTimeChange(day, interval.id, 'endTime', e.target.value)
                          }
                          className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                        />

                        {dayConfig.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInterval(day, interval.id)}
                            className="p-1 text-slate-400 hover:text-[#FF3D71] transition-colors ml-1"
                            title="Remove Shift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddInterval(day)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-[#176BFF] hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Shift
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Time Slot Picker Component
 *
 * Calendar and time slot selector with:
 * - Date picker within min/max range
 * - 30-minute time slot increments
 * - Availability highlighting
 * - Timezone display
 */

'use client';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  minDate: Date;
  maxDate: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  unavailableSlots?: string[]; // Optional: list of unavailable time slots
}

export function TimeSlotPicker({
  minDate,
  maxDate,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  unavailableSlots = [],
}: TimeSlotPickerProps) {
  // Generate time slots (9am - 5pm in 30-minute increments)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 17 && minute === 30) break; // Stop at 5:30 PM
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotAvailable = (time: string) => {
    if (!selectedDate) return true;

    // Check if slot is in the past
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    if (slotDateTime < new Date()) {
      return false;
    }

    // Check against unavailable slots
    return !unavailableSlots.includes(time);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calendar */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Select Date</h4>
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && onSelectDate(date)}
          disabled={(date) => date < minDate || date > maxDate}
          className="rounded-lg border border-proofound-stone"
        />
        <div className="mt-3 text-xs text-muted-foreground">
          <p>
            Available: {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Select Time</h4>
        {!selectedDate ? (
          <div className="flex items-center justify-center h-64 border border-proofound-stone rounded-lg bg-japandi-bg">
            <p className="text-sm text-muted-foreground">Select a date first</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {timeSlots.map((time) => {
              const available = isSlotAvailable(time);
              const isSelected = selectedTime === time;

              return (
                <Button
                  key={time}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => available && onSelectTime(time)}
                  disabled={!available}
                  className={`w-full justify-between ${
                    isSelected
                      ? 'bg-proofound-forest text-white'
                      : available
                        ? 'hover:border-proofound-forest hover:bg-proofound-success-tint'
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                  {!available && (
                    <Badge variant="secondary" className="text-xs">
                      Unavailable
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Check-In History Component
 *
 * Displays user's well-being check-in history with filtering, date ranges, and CSV export
 * Implements PRD requirement for well-being tracking transparency
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CheckIn {
  id: string;
  stressLevel: number;
  controlLevel: number;
  notes?: string;
  createdAt: string;
}

interface CheckInHistoryProps {
  userId: string;
}

export function CheckInHistory({ userId }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [stressFilter, setStressFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIns, dateRange, stressFilter]);

  const fetchCheckIns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wellbeing/checkins?limit=100');
      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkins || []);
      } else {
        toast.error('Failed to load check-in history');
      }
    } catch (error) {
      console.error('Failed to fetch check-ins:', error);
      toast.error('Failed to load check-in history');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...checkIns];

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((c) => new Date(c.createdAt) >= dateRange.from!);
    }
    if (dateRange.to) {
      filtered = filtered.filter((c) => new Date(c.createdAt) <= dateRange.to!);
    }

    // Stress level filter
    if (stressFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (stressFilter === 'low') return c.stressLevel >= 1 && c.stressLevel <= 3;
        if (stressFilter === 'medium') return c.stressLevel >= 4 && c.stressLevel <= 6;
        if (stressFilter === 'high') return c.stressLevel >= 7 && c.stressLevel <= 10;
        return true;
      });
    }

    setFilteredCheckIns(filtered);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csvHeaders = ['Date', 'Time', 'Stress Level', 'Control Level', 'Notes'];
      const csvRows = filteredCheckIns.map((c) => {
        const date = new Date(c.createdAt);
        return [
          format(date, 'yyyy-MM-dd'),
          format(date, 'HH:mm'),
          c.stressLevel.toString(),
          c.controlLevel.toString(),
          c.notes ? `"${c.notes.replace(/"/g, '""')}"` : '',
        ];
      });

      const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wellbeing-checkins-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredCheckIns.length} check-ins to CSV`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setDateRange({});
    setStressFilter('all');
    toast.info('Filters cleared');
  };

  const getStressLevelBadge = (level: number) => {
    if (level >= 1 && level <= 3) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          Low ({level})
        </Badge>
      );
    }
    if (level >= 4 && level <= 6) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          Medium ({level})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
        High ({level})
      </Badge>
    );
  };

  const getControlLevelBadge = (level: number) => {
    if (level >= 1 && level <= 3) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
          Low ({level})
        </Badge>
      );
    }
    if (level >= 4 && level <= 6) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          Medium ({level})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
        High ({level})
      </Badge>
    );
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const activeFiltersCount =
    (dateRange.from || dateRange.to ? 1 : 0) + (stressFilter !== 'all' ? 1 : 0);

  if (isLoading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-8">
          <p className="text-center text-[#6B6760] dark:text-muted-foreground">
            Loading check-in history...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Check-In History
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              View and analyze your past well-being check-ins
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || filteredCheckIns.length === 0}
            className="border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#1C4D3A]/5"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center p-4 bg-[#F7F6F1] dark:bg-background/50 rounded-lg border border-[#E8E6DD] dark:border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B6760]" />
            <span className="text-sm font-medium text-[#2D3330] dark:text-foreground">
              Filters:
            </span>
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-[#E8E6DD]">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Stress Level Filter */}
          <div className="flex gap-1">
            {(['all', 'low', 'medium', 'high'] as const).map((level) => (
              <Button
                key={level}
                variant={stressFilter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStressFilter(level)}
                className={stressFilter === level ? 'bg-[#1C4D3A] text-white' : 'border-[#E8E6DD]'}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Stats Summary */}
        {filteredCheckIns.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-background border border-[#E8E6DD] dark:border-border rounded-lg">
            <div className="text-center">
              <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-1">
                Total Check-Ins
              </p>
              <p className="text-2xl font-semibold text-[#2D3330] dark:text-foreground">
                {filteredCheckIns.length}
              </p>
            </div>
            <div className="text-center border-x border-[#E8E6DD] dark:border-border">
              <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-1">Avg Stress</p>
              <p className="text-2xl font-semibold text-[#2D3330] dark:text-foreground">
                {(
                  filteredCheckIns.reduce((sum, c) => sum + c.stressLevel, 0) /
                  filteredCheckIns.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-1">Avg Control</p>
              <p className="text-2xl font-semibold text-[#2D3330] dark:text-foreground">
                {(
                  filteredCheckIns.reduce((sum, c) => sum + c.controlLevel, 0) /
                  filteredCheckIns.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Check-Ins List */}
        <div className="space-y-3">
          {filteredCheckIns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#6B6760] dark:text-muted-foreground">
                {checkIns.length === 0
                  ? 'No check-ins yet. Complete your first check-in to start tracking.'
                  : 'No check-ins match your filters. Try adjusting your search.'}
              </p>
            </div>
          ) : (
            filteredCheckIns.map((checkIn, index) => {
              const previousCheckIn = filteredCheckIns[index + 1];
              return (
                <div
                  key={checkIn.id}
                  className="p-4 bg-white dark:bg-background border border-[#E8E6DD] dark:border-border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#2D3330] dark:text-foreground">
                        {format(new Date(checkIn.createdAt), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                        {format(new Date(checkIn.createdAt), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getStressLevelBadge(checkIn.stressLevel)}
                      {getTrendIcon(checkIn.stressLevel, previousCheckIn?.stressLevel)}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-2">
                    <div>
                      <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                        Stress Level
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#E8E6DD] dark:bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                            style={{ width: `${(checkIn.stressLevel / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#2D3330] dark:text-foreground">
                          {checkIn.stressLevel}/10
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                        Control Level
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#E8E6DD] dark:bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            style={{ width: `${(checkIn.controlLevel / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#2D3330] dark:text-foreground">
                          {checkIn.controlLevel}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {checkIn.notes && (
                    <div className="mt-3 pt-3 border-t border-[#E8E6DD] dark:border-border">
                      <p className="text-sm text-[#2D3330] dark:text-foreground">{checkIn.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

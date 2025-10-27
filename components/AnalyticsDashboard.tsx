"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Eye,
  MessageSquare,
  CheckCircle2,
  FileText,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsDashboardProps {
  events: any[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function AnalyticsDashboard({ events, dateRange }: AnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate metrics
  const totalEvents = events.length;
  const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size;
  const eventCategories = [...new Set(events.map(e => e.event_category).filter(Boolean))];
  
  // Group events by category
  const eventsByCategory = events.reduce((acc, event) => {
    const category = event.event_category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, any[]>);

  // Top events
  const eventCounts = events.reduce((acc, event) => {
    acc[event.event_name] = (acc[event.event_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Filter events by category
  const filteredEvents = selectedCategory
    ? events.filter(e => e.event_category === selectedCategory)
    : events;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="border-b px-6 py-6" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
                Analytics Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                {dateRange 
                  ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  : 'All time'
                }
              </p>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                  {totalEvents.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                Unique Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#C76B4A' }} />
                <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                  {uniqueUsers.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                Event Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: '#7A9278' }} />
                <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                  {eventCategories.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                Page Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" style={{ color: '#5C8B89' }} />
                <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                  {events.filter(e => e.event_name === 'page_view').length.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                style={selectedCategory === null ? { backgroundColor: '#1C4D3A', color: 'white' } : {}}
              >
                All ({totalEvents})
              </Button>
              {Object.entries(eventsByCategory).map(([category, categoryEvents]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  style={selectedCategory === category ? { backgroundColor: '#1C4D3A', color: 'white' } : {}}
                  className="capitalize"
                >
                  {category} ({categoryEvents.length})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Events */}
          <Card>
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {topEvents.map(([eventName, count], index) => (
                    <div
                      key={eventName}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: '#F7F6F1' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold" style={{ color: '#6B6760' }}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-medium" style={{ color: '#2D3330' }}>
                            {eventName.replace(/_/g, ' ')}
                          </h4>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {events.find(e => e.event_name === eventName)?.event_category || 'other'}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-lg font-semibold" style={{ color: '#1C4D3A' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredEvents.slice(0, 20).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border"
                      style={{ borderColor: '#E8E6DD' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium" style={{ color: '#2D3330' }}>
                          {event.event_name.replace(/_/g, ' ')}
                        </h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.event_category}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1" style={{ color: '#6B6760' }}>
                        <p>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.user_id && (
                          <p>
                            <Users className="w-3 h-3 inline mr-1" />
                            User: {event.user_id.substring(0, 8)}...
                          </p>
                        )}
                        {event.properties && Object.keys(event.properties).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer hover:underline">
                              View properties
                            </summary>
                            <pre className="mt-2 p-2 rounded text-xs overflow-x-auto" style={{ backgroundColor: '#F7F6F1' }}>
                              {JSON.stringify(event.properties, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Authentication Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Sign Ups:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'signed_up').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Logins:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'logged_in').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Logouts:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'logged_out').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Matching Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Matches Viewed:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'match_viewed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Matches Accepted:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'match_accepted').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Matches Declined:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'match_declined').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Messages Sent:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'message_sent').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Conversations Started:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'conversation_started').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6760' }}>Proofs Submitted:</span>
                  <span className="font-semibold" style={{ color: '#2D3330' }}>
                    {events.filter(e => e.event_name === 'proof_submitted').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


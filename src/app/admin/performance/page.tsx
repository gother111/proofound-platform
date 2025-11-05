/**
 * Admin Performance Dashboard
 *
 * Displays performance metrics, SLA compliance, and alerts
 * Shows page load times, API latency, trends, and device-specific metrics
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PerformanceMetric {
  route: string;
  metricType: string;
  p50: number;
  p95: number;
  p99: number;
  sampleCount: number;
  deviceType?: string;
}

interface SLAStatus {
  metric: string;
  threshold: number;
  actual: number;
  status: 'pass' | 'warn' | 'fail';
  compliance: number;
}

interface PerformanceAlert {
  id: string;
  alertType: string;
  metricType: string;
  route: string;
  thresholdMs: number;
  actualValueMs: number;
  severity: string;
  status: string;
  createdAt: string;
}

export default function PerformanceDashboardPage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [slaStatus, setSlaStatus] = useState<SLAStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceFilter, setDeviceFilter] = useState('all');

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/performance/metrics?timeRange=${timeRange}&deviceType=${deviceFilter}`
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics || []);
        setAlerts(data.alerts || []);
        setSlaStatus(data.slaStatus || []);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, deviceFilter]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600';
      case 'warn':
        return 'text-yellow-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSLAIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warn':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor page load times, API latency, and SLA compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Device type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SLA Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slaStatus.map((sla, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{sla.metric}</CardTitle>
                {getSLAIcon(sla.status)}
              </div>
              <CardDescription>Target: ≤{formatMs(sla.threshold)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{formatMs(sla.actual)}</span>
                  <Badge
                    variant={
                      sla.status === 'pass'
                        ? 'default'
                        : sla.status === 'warn'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {sla.status}
                  </Badge>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sla.status === 'pass' ? 'bg-green-600' : sla.status === 'warn' ? 'bg-yellow-600' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(100, sla.compliance)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {sla.compliance.toFixed(1)}% compliance
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Active Performance Alerts
            </CardTitle>
            <CardDescription>SLA violations and performance degradations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <Alert
                  key={alert.id}
                  variant={
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'destructive'
                      : 'default'
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <AlertTitle className="text-sm font-medium">
                        {alert.metricType} - {alert.route}
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        {formatMs(alert.actualValueMs)} exceeds threshold of{' '}
                        {formatMs(alert.thresholdMs)}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Page Performance Metrics</CardTitle>
          <CardDescription>Response times by route and device type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>P50</TableHead>
                <TableHead>P95</TableHead>
                <TableHead>P99</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics
                .filter((m) => m.metricType === 'page_load' || m.metricType === 'tti')
                .slice(0, 20)
                .map((metric, idx) => {
                  const isDesktop = metric.deviceType === 'desktop';
                  const threshold = isDesktop ? 2500 : 3500; // 2.5s desktop, 3.5s mobile
                  const status = metric.p95 <= threshold ? 'pass' : 'fail';

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{metric.route}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.deviceType || 'all'}</Badge>
                      </TableCell>
                      <TableCell>{formatMs(metric.p50)}</TableCell>
                      <TableCell className={getSLAColor(status)}>{formatMs(metric.p95)}</TableCell>
                      <TableCell>{formatMs(metric.p99)}</TableCell>
                      <TableCell className="text-muted-foreground">{metric.sampleCount}</TableCell>
                      <TableCell>
                        {status === 'pass' ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Fail
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Latency Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Performance</CardTitle>
          <CardDescription>API response times (target: P95 ≤1.5s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>P50</TableHead>
                <TableHead>P95</TableHead>
                <TableHead>P99</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics
                .filter((m) => m.metricType === 'api_latency')
                .slice(0, 20)
                .map((metric, idx) => {
                  const threshold = 1500; // 1.5s
                  const status = metric.p95 <= threshold ? 'pass' : 'fail';

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{metric.route}</TableCell>
                      <TableCell>{formatMs(metric.p50)}</TableCell>
                      <TableCell className={getSLAColor(status)}>{formatMs(metric.p95)}</TableCell>
                      <TableCell>{formatMs(metric.p99)}</TableCell>
                      <TableCell className="text-muted-foreground">{metric.sampleCount}</TableCell>
                      <TableCell>
                        {status === 'pass' ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Fail
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

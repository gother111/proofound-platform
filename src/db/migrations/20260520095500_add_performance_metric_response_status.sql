ALTER TABLE public.performance_metrics
  ADD COLUMN IF NOT EXISTS response_status integer;

CREATE INDEX IF NOT EXISTS performance_metrics_api_latency_status_idx
  ON public.performance_metrics (api_endpoint, response_status, timestamp)
  WHERE metric_type = 'api_latency' AND api_endpoint IS NOT NULL;

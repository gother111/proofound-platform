-- Add fairness_reports table for automated fairness monitoring

CREATE TABLE IF NOT EXISTS "fairness_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "release_version" text NOT NULL,
  "report_markdown" text NOT NULL,
  "metrics_json" jsonb NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "fairness_reports_release_version_idx" ON "fairness_reports"("release_version");
CREATE INDEX IF NOT EXISTS "fairness_reports_published_at_idx" ON "fairness_reports"("published_at");
CREATE INDEX IF NOT EXISTS "fairness_reports_created_at_idx" ON "fairness_reports"("created_at");

COMMENT ON TABLE "fairness_reports" IS 'Automated fairness analysis reports';

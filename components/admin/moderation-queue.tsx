"use client";

// Moderation queue component
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

interface ModerationQueueProps {
  reports: any[];
  moderatorId: string;
}

export function ModerationQueue({ reports: initialReports, moderatorId }: ModerationQueueProps) {
  const [reports, setReports] = useState(initialReports || []);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleTakeAction = async (reportId: string, action: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from("reports")
        .update({
          moderation_status: "actioned",
          action_taken: action,
          action_details: notes || null,
          assigned_moderator_id: moderatorId,
          actioned_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          moderator_notes: notes || null,
        })
        .eq("id", reportId);

      if (error) throw error;

      // Remove from list
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setSelectedReport(null);
      setNotes("");
      alert(`Action taken: ${action}`);
    } catch (error) {
      console.error("Error taking action:", error);
      alert("Failed to take action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToSelf = async (reportId: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from("reports")
        .update({
          moderation_status: "under_review",
          assigned_moderator_id: moderatorId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, moderation_status: "under_review", assigned_moderator_id: moderatorId }
            : r
        )
      );
    } catch (error) {
      console.error("Error assigning report:", error);
      alert("Failed to assign report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Queue is empty
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No pending reports to review
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Reports list */}
      <div className="w-96 space-y-4">
        {reports.map((report: any) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className={`cursor-pointer rounded-lg border p-4 transition-colors ${
              selectedReport?.id === report.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  report.moderation_status === "pending"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                }`}
              >
                {report.moderation_status}
              </span>
              {report.ai_flagged && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  🤖 AI flagged
                </span>
              )}
            </div>

            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {report.reason_category || "Report"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {report.reason_text}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(report.created_at)}
            </p>
          </div>
        ))}
      </div>

      {/* Report details */}
      <div className="flex-1">
        {selectedReport ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Report Details
            </h2>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Reported Entity
                </h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedReport.reported_entity_type}: {selectedReport.reported_entity_id}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Category
                </h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedReport.reason_category}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedReport.reason_text}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Reported By
                </h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedReport.reporter?.full_name || "Anonymous"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Reported
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {formatRelativeTime(selectedReport.created_at)}
                </p>
              </div>

              {selectedReport.ai_flagged && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    🤖 AI Analysis
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Confidence: {Math.round((selectedReport.ai_confidence_score || 0) * 100)}%
                  </p>
                  {selectedReport.ai_flag_reasons && (
                    <ul className="mt-2 text-sm text-red-800 dark:text-red-200 space-y-1">
                      {Object.entries(selectedReport.ai_flag_reasons as any).map(([key, value]) => (
                        <li key={key}>• {key}: {String(value)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Moderator Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add notes about your decision..."
                />
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Take Action
                </h4>

                {selectedReport.moderation_status === "pending" && (
                  <Button
                    onClick={() => handleAssignToSelf(selectedReport.id)}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Assign to Me
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleTakeAction(selectedReport.id, "no_action")}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleTakeAction(selectedReport.id, "warning_sent")}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Send Warning
                  </Button>
                  <Button
                    onClick={() => handleTakeAction(selectedReport.id, "content_removed")}
                    disabled={isLoading}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Remove Content
                  </Button>
                  <Button
                    onClick={() => handleTakeAction(selectedReport.id, "account_suspended")}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Suspend Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              Select a report to review
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


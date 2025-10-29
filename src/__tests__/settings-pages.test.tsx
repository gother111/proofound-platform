import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IndividualSettingsView } from "@/components/settings/individual/IndividualSettingsView";
import { OrganizationSettingsView } from "@/components/settings/organization/OrganizationSettingsView";

describe("Settings views", () => {
  it("renders individual settings sections and switches between them", () => {
    render(
      <IndividualSettingsView
        profile={{
          id: "user-1",
          displayName: "Sarah Chen",
          handle: "sarah",
          avatarUrl: null,
          locale: "en",
          persona: "creator",
        }}
        email="sarah@example.com"
      />,
    );

    expect(screen.getByText(/Profile Settings/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.getByText(/Notification Preferences/i)).toBeInTheDocument();
  });

  it("renders organization settings and displays audit logs", () => {
    const logs = [
      {
        id: "log-1",
        action: "Updated billing",
        targetType: "subscription",
        targetId: "plan-123",
        createdAt: new Date("2025-10-20T12:30:00Z").toISOString(),
      },
    ];

    render(
      <OrganizationSettingsView
        organization={{
          id: "org-1",
          displayName: "Proofound",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          tagline: "Forecast with confidence",
          website: "https://proofound.com",
          registrationCountry: "US",
          registrationRegion: "CA",
          logoUrl: null,
        }}
        membership={{ role: "owner" }}
        logs={logs}
      />,
    );

    expect(screen.getByText(/Organization Profile/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Security & Access/i }));

    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Updated billing/i)).toBeInTheDocument();
  });
});



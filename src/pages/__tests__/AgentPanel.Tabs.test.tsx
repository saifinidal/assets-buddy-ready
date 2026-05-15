import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import AgentPanel from "../AgentPanel";

const renderPanel = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <AgentPanel />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("AgentPanel - Tabs", () => {
  it("renders AGENT PANEL header", () => {
    renderPanel();
    expect(screen.getByText(/AGENT/)).toBeInTheDocument();
  });

  it("renders all sidebar tabs", () => {
    renderPanel();
    const labels = ["Dashboard", "Downline", "Commission", "Settlement", "Hierarchy", "Reports"];
    for (const label of labels) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});

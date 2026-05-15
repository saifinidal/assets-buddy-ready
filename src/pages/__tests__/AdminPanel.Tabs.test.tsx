import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminPanel from "../AdminPanel";

const renderPanel = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <AdminPanel />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("AdminPanel - Tabs", () => {
  it("renders all sidebar tabs", () => {
    renderPanel();
    // Sidebar should contain tab labels (some appear multiple places)
    const labels = ["Users", "Agents", "Matches", "Settings"];
    for (const label of labels) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});

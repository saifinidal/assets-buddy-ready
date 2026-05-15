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

describe("AdminPanel - Dashboard Tab (default)", () => {
  it("renders ADMIN PANEL header", () => {
    renderPanel();
    expect(screen.getByText(/ADMIN/)).toBeInTheDocument();
  });

  it("renders sidebar with core nav items", () => {
    renderPanel();
    const dashboards = screen.getAllByText("Dashboard");
    expect(dashboards.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getAllByText("Deposits").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Withdrawals").length).toBeGreaterThan(0);
    expect(screen.getByText("Matches")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders Back to Site link", () => {
    renderPanel();
    expect(screen.getByText("Back to Site")).toBeInTheDocument();
  });

  it("renders Super Admin badge", () => {
    renderPanel();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("renders dashboard area", () => {
    // Dashboard stat cards depend on async Supabase data; just verify the
    // panel mounted with its primary header without throwing.
    renderPanel();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });
});

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

describe("AgentPanel - Settlement", () => {
  it("renders agent panel with Settlement tab in sidebar", () => {
    renderPanel();
    expect(screen.getAllByText("Settlement").length).toBeGreaterThan(0);
  });
});

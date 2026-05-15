import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/i18n";
import { Navbar } from "../Navbar";

const renderNavbar = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Navbar />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe("Navbar", () => {
  it("renders nav landmark", () => {
    const { container } = renderNavbar();
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("renders site logo image", () => {
    renderNavbar();
    const logos = screen.getAllByRole("img");
    expect(logos.length).toBeGreaterThan(0);
  });

  it("renders home link", () => {
    const { container } = renderNavbar();
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
  });
});

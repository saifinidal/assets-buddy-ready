import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/i18n";
import { BottomNav } from "../BottomNav";

const renderNav = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  );

describe("BottomNav", () => {
  it("renders the nav landmark", () => {
    const { container } = renderNav();
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("renders core navigation links", () => {
    const { container } = renderNav();
    const links = container.querySelectorAll("a");
    // Public items: Home, Inplay, Casino, Account (History is auth-only)
    expect(links.length).toBeGreaterThanOrEqual(4);
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/inplay");
    expect(hrefs).toContain("/casino");
    expect(hrefs).toContain("/account");
  });
});

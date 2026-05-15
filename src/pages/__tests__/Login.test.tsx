import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "../Login";

const renderLogin = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );

describe("Login Page", () => {
  it("renders LOGIN heading", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: /LOGIN/i })).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter password/i)).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    renderLogin();
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });

  it("renders signup link", () => {
    renderLogin();
    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  });

  it("renders back to home link", () => {
    renderLogin();
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderLogin();
    const pwd = screen.getByPlaceholderText(/Enter password/i) as HTMLInputElement;
    expect(pwd.type).toBe("password");
    const toggle = pwd.parentElement!.querySelector("button")!;
    fireEvent.click(toggle);
    expect(pwd.type).toBe("text");
  });
});

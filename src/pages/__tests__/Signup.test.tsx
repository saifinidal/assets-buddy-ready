import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Signup from "../Signup";

const renderSignup = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <Signup />
      </AuthProvider>
    </BrowserRouter>
  );

describe("Signup Page", () => {
  it("renders SIGN UP heading", () => {
    renderSignup();
    expect(screen.getByRole("heading", { name: /SIGN UP/i })).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/Enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+91/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@email\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min 6 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Re-enter password/i)).toBeInTheDocument();
  });

  it("renders terms checkbox", () => {
    renderSignup();
    expect(screen.getByText(/Terms & Conditions/i)).toBeInTheDocument();
  });

  it("renders create account button", () => {
    renderSignup();
    expect(screen.getByRole("button", { name: /CREATE ACCOUNT/i })).toBeInTheDocument();
  });

  it("renders login link", () => {
    renderSignup();
    expect(screen.getByText(/Login Here/i)).toBeInTheDocument();
  });

  it("updates name input on typing", () => {
    renderSignup();
    const nameInput = screen.getByPlaceholderText(/Enter your full name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Test User" } });
    expect(nameInput.value).toBe("Test User");
  });

  it("renders back to home link", () => {
    renderSignup();
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletTab } from "../WalletTab";

const mockWallet = { balance: 50000, exposure: 5000, bonus: 1000 };
const mockTransactions = [
  { id: "1", type: "deposit", amount: 10000, status: "approved", date: "2026-03-01" },
  { id: "2", type: "withdrawal", amount: 5000, status: "pending", date: "2026-03-02" },
];

describe("WalletTab", () => {
  it("renders balance amounts", () => {
    render(<WalletTab wallet={mockWallet} transactions={mockTransactions} />);
    // Main balance, exposure, and bonus values render somewhere in the tree
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
  });

  it("renders deposit and withdraw buttons", () => {
    render(<WalletTab wallet={mockWallet} transactions={mockTransactions} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
  });
});

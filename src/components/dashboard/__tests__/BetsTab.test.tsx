import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { BetsTab } from "../BetsTab";

const mockBets = [
  { id: "1", match: "IND vs AUS", selection: "India", odds: 1.85, stake: 1000, type: "back", result: "won", profit: 850, date: "2026-03-01" },
  { id: "2", match: "CSK vs MI", selection: "CSK", odds: 2.1, stake: 500, type: "lay", result: "lost", profit: -500, date: "2026-03-02" },
  { id: "3", match: "RCB vs DC", selection: "RCB", odds: 1.5, stake: 2000, type: "back", result: "pending", profit: 0, date: "2026-03-03" },
];

const renderBets = () =>
  render(
    <BrowserRouter>
      <BetsTab bets={mockBets} totalPL={350} />
    </BrowserRouter>
  );

describe("BetsTab", () => {
  it("renders filter options", () => {
    renderBets();
    expect(screen.getByText("All Bets")).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
  });

  it("renders bet match names", () => {
    renderBets();
    expect(screen.getByText("IND vs AUS")).toBeInTheDocument();
    expect(screen.getByText("CSK vs MI")).toBeInTheDocument();
    expect(screen.getByText("RCB vs DC")).toBeInTheDocument();
  });

  it("renders link to full history", () => {
    renderBets();
    expect(screen.getByText(/Open Full History/i)).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import StatsBar from "@/components/StatsBar";

describe("StatsBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading skeletons before data loads", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves

    render(<StatsBar />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders stat labels regardless of data state", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    render(<StatsBar />);

    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("Total Documents")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
  });

  it("displays fetched numbers after successful API call", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        stats: { total_patients: 42, total_documents: 150, this_week: 7 },
      }),
    } as any);

    render(<StatsBar />);

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("formats large numbers with locale separator", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        stats: { total_patients: 1000, total_documents: 12345, this_week: 0 },
      }),
    } as any);

    render(<StatsBar />);

    await waitFor(() => {
      expect(screen.getByText("1,000")).toBeInTheDocument();
      expect(screen.getByText("12,345")).toBeInTheDocument();
    });
  });

  it("keeps showing skeletons when API returns success: false", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false }),
    } as any);

    render(<StatsBar />);

    await waitFor(() => {
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});

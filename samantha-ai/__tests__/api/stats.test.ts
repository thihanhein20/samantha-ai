/**
 * @jest-environment node
 */
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

import { GET } from "@/app/api/stats/route";
import pool from "@/lib/db";

const mockQuery = pool.query as jest.Mock;

describe("GET /api/stats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns correct stats structure on success", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total_patients: "42", total_documents: "150", this_week: "7" }],
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.stats).toEqual({
      total_patients: 42,
      total_documents: 150,
      this_week: 7,
    });
  });

  it("parses string numbers from DB into integers", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total_patients: "0", total_documents: "0", this_week: "0" }],
    });

    const res = await GET();
    const body = await res.json();

    expect(typeof body.stats.total_patients).toBe("number");
    expect(typeof body.stats.total_documents).toBe("number");
    expect(typeof body.stats.this_week).toBe("number");
  });

  it("returns 500 when DB query throws", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});

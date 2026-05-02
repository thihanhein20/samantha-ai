/**
 * @jest-environment node
 */
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

import { GET } from "@/app/api/documents/route";
import pool from "@/lib/db";

const mockQuery = pool.query as jest.Mock;

const mockDocs = [
  {
    id: 1,
    file_name: "report.pdf",
    s3_key: "uploads/report.pdf",
    created_at: "2024-01-15",
    document_subject: "Annual Checkup",
    date_of_report: "2024-01-10",
    doctor_name: "Dr. Smith",
    category_name: "Clinical notes",
    patient_name: "John Doe",
  },
];

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/documents");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/documents", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns documents with default pagination", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: mockDocs });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].patient_name).toBe("John Doe");
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("passes search param into the query", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] });

    await GET(makeRequest({ search: "John" }));

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain("%John%");
  });

  it("passes category filter into the query", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] });

    await GET(makeRequest({ category: "3" }));

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain("3");
  });

  it("passes dateFrom and dateTo filters", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] });

    await GET(makeRequest({ dateFrom: "2024-01-01", dateTo: "2024-12-31" }));

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain("2024-01-01");
    expect(countCall[1]).toContain("2024-12-31");
  });

  it("calculates totalPages correctly", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "45" }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await GET(makeRequest({ limit: "15", page: "1" }));
    const body = await res.json();

    expect(body.total).toBe(45);
    expect(body.totalPages).toBe(3);
  });

  it("returns 500 on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB down"));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});

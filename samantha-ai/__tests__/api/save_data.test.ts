/**
 * @jest-environment node
 */
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

import { POST } from "@/app/api/save_data/route";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

const mockQuery = pool.query as jest.Mock;

const validPayload = {
  prefix: "Mr",
  patient_name: "John Doe",
  date_of_report: "2024-01-15",
  document_subject: "Annual Checkup",
  source_contact: "City Clinic",
  store_in: "archive",
  gp_doctor: "Dr. Smith",
  category: "Clinical notes",
  s3_key: "uploads/test.pdf",
  s3_url: "https://s3.example.com/test.pdf",
  file_name: "test.pdf",
};

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/save_data", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/save_data", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a new patient and inserts document when patient does not exist", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })               // patient lookup: not found
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })    // patient insert
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })     // category lookup
      .mockResolvedValueOnce({ rows: [{ id: 101 }] });  // document insert

    const res = await POST(makeRequest(validPayload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.document_id).toBe(101);
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  it("reuses existing patient instead of inserting a new one", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42 }] })   // patient lookup: found
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })    // category lookup
      .mockResolvedValueOnce({ rows: [{ id: 200 }] }); // document insert

    const res = await POST(makeRequest(validPayload));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("inserts document with null category_id when category not found", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42 }] })   // patient lookup
      .mockResolvedValueOnce({ rows: [] })              // category lookup: not found
      .mockResolvedValueOnce({ rows: [{ id: 201 }] }); // document insert

    const res = await POST(makeRequest(validPayload));
    const body = await res.json();

    expect(body.success).toBe(true);
    const docInsertArgs = mockQuery.mock.calls[2][1];
    expect(docInsertArgs[6]).toBeNull(); // category_id position
  });

  it("returns 500 on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("constraint violation"));

    const res = await POST(makeRequest(validPayload));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });
});

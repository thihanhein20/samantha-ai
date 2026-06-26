/**
 * @jest-environment node
 */

// Mock Supabase client before imports
jest.mock("@/lib/supabase", () => {
  const mockUpload = jest.fn().mockResolvedValue({ data: { path: "test-key" }, error: null });
  const mockCreateSignedUrl = jest.fn().mockResolvedValue({
    data: { signedUrl: "https://signed.example.com/file.pdf" },
    error: null,
  });
  const mockFrom = jest.fn().mockReturnValue({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  });

  return {
    __esModule: true,
    __mockUpload: mockUpload,
    __mockCreateSignedUrl: mockCreateSignedUrl,
    __mockFrom: mockFrom,
    supabase: { storage: { from: mockFrom } },
  };
});

import { POST } from "@/app/api/upload/route";
import { NextRequest } from "next/server";

const supabaseModule = require("@/lib/supabase");
const mockUpload: jest.Mock = supabaseModule.__mockUpload;
const mockCreateSignedUrl: jest.Mock = supabaseModule.__mockCreateSignedUrl;

function makeRequest(filename: string | null, body: ArrayBuffer = new ArrayBuffer(8)) {
  const headers: Record<string, string> = { "Content-Type": "application/pdf" };
  if (filename) headers["x-filename"] = filename;
  return new NextRequest("http://localhost/api/upload", { method: "POST", body, headers });
}

describe("POST /api/upload", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when x-filename header is missing", async () => {
    const res = await POST(makeRequest(null));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/filename/i);
  });

  it("uploads to Supabase Storage and returns signed URL on success", async () => {
    mockUpload.mockResolvedValueOnce({ data: { path: "test-key" }, error: null });
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed.example.com/file.pdf" },
      error: null,
    });

    const res = await POST(makeRequest("report.pdf"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fileUrl).toBe("https://signed.example.com/file.pdf");
    expect(body.s3key).toMatch(/uploads\/.*report\.pdf/);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("includes timestamp prefix in storage key", async () => {
    mockUpload.mockResolvedValueOnce({ data: { path: "test-key" }, error: null });
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed.example.com/test.pdf" },
      error: null,
    });

    const res = await POST(makeRequest("test.pdf"));
    const body = await res.json();

    expect(body.s3key).toMatch(/^uploads\/\d+-test\.pdf$/);
  });

  it("returns 500 when upload throws", async () => {
    mockUpload.mockResolvedValueOnce({ data: null, error: new Error("Storage unreachable") });

    const res = await POST(makeRequest("file.pdf"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});

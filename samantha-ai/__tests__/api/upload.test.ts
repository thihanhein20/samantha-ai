/**
 * @jest-environment node
 */

// Define mocks inside factory to avoid const TDZ hoisting issues
jest.mock("@aws-sdk/client-s3", () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    __esModule: true,
    __mockSend: mockSend,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((args) => args),
    GetObjectCommand: jest.fn().mockImplementation((args) => args),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => {
  const mockGetSignedUrl = jest.fn().mockResolvedValue("https://signed.example.com/file.pdf");
  return {
    __esModule: true,
    __mockGetSignedUrl: mockGetSignedUrl,
    getSignedUrl: mockGetSignedUrl,
  };
});

import { POST } from "@/app/api/upload/route";
import { NextRequest } from "next/server";

// Access the mock functions exported from factory
const s3Module = require("@aws-sdk/client-s3");
const presignerModule = require("@aws-sdk/s3-request-presigner");
const mockSend: jest.Mock = s3Module.__mockSend;
const mockGetSignedUrl: jest.Mock = presignerModule.__mockGetSignedUrl;

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

  it("uploads to S3 and returns signed URL on success", async () => {
    mockSend.mockResolvedValueOnce({});
    mockGetSignedUrl.mockResolvedValueOnce("https://signed.example.com/file.pdf");

    const res = await POST(makeRequest("report.pdf"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fileUrl).toBe("https://signed.example.com/file.pdf");
    expect(body.s3key).toMatch(/uploads\/.*report\.pdf/);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("includes timestamp prefix in S3 key", async () => {
    mockSend.mockResolvedValueOnce({});
    mockGetSignedUrl.mockResolvedValueOnce("https://signed.example.com/test.pdf");

    const res = await POST(makeRequest("test.pdf"));
    const body = await res.json();

    expect(body.s3key).toMatch(/^uploads\/\d+-test\.pdf$/);
  });

  it("returns 500 when S3 send throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("S3 unreachable"));

    const res = await POST(makeRequest("file.pdf"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});

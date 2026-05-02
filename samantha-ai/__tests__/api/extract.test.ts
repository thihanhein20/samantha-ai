/**
 * @jest-environment node
 */

// genAI is instantiated at module load time in the route, so the mock must be
// ready before the route module is imported. We keep mockGenerateContent inside
// the factory and expose it via a __mock__ property.
jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn();
  return {
    __esModule: true,
    __mockGenerateContent: mockGenerateContent,
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({ generateContent: mockGenerateContent }),
    })),
  };
});

jest.mock("node-fetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { POST } from "@/app/api/extract/route";
import { NextRequest } from "next/server";

const genaiModule = require("@google/generative-ai");
const mockGenerateContent: jest.Mock = genaiModule.__mockGenerateContent;
const mockFetch: jest.Mock = require("node-fetch").default;

const geminiOutput =
  "prefix: Mr\npatient_name: John Doe\ndate_of_report: 2024-01-15\ndocument_subject: Annual Checkup\ngp_doctor: Dr. Smith\ncategory: Clinical notes";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/extract", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/extract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    });
    mockGenerateContent.mockResolvedValue({
      response: { text: () => geminiOutput },
    });
  });

  it("returns 400 when fileUrl is missing", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/fileUrl/i);
  });

  it("calls Gemini and returns extracted text", async () => {
    const res = await POST(makeRequest({ fileUrl: "https://s3.example.com/file.pdf" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.extractedText).toBe(geminiOutput);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("passes the PDF as base64 inline data to Gemini", async () => {
    await POST(makeRequest({ fileUrl: "https://s3.example.com/file.pdf" }));

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const inlinePart = callArgs.find((p: any) => p.inlineData);
    expect(inlinePart.inlineData.mimeType).toBe("application/pdf");
    expect(typeof inlinePart.inlineData.data).toBe("string");
  });

  it("returns 500 when Gemini throws", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("quota exceeded"));

    const res = await POST(makeRequest({ fileUrl: "https://s3.example.com/file.pdf" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it("returns 500 when PDF fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const res = await POST(makeRequest({ fileUrl: "https://s3.example.com/missing.pdf" }));
    const body = await res.json();

    expect(res.status).toBe(500);
  });
});

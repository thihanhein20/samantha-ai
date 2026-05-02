import "@testing-library/jest-dom";

// Silence console.error during tests — routes log errors in catch blocks,
// which creates noise when we intentionally trigger error paths.
jest.spyOn(console, "error").mockImplementation(() => {});

import React from "react";
import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next/link", () =>
  function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  },
);

import { usePathname } from "next/navigation";
const mockUsePathname = usePathname as jest.Mock;

describe("Sidebar", () => {
  it("renders 3 navigation links", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("renders links with correct hrefs", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/upload");
    expect(hrefs).toContain("/patients");
  });

  it("applies active gradient class to the current route link", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const dashboardLink = screen.getAllByRole("link").find(
      (l) => l.getAttribute("href") === "/dashboard",
    );
    expect(dashboardLink?.className).toContain("from-blue-600");
  });

  it("does not apply active class to non-current routes", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    const uploadLink = screen.getAllByRole("link").find(
      (l) => l.getAttribute("href") === "/upload",
    );
    expect(uploadLink?.className).not.toContain("from-blue-600");
  });

  it("marks /upload as active when on that route", () => {
    mockUsePathname.mockReturnValue("/upload");
    render(<Sidebar />);
    const uploadLink = screen.getAllByRole("link").find(
      (l) => l.getAttribute("href") === "/upload",
    );
    expect(uploadLink?.className).toContain("from-blue-600");
  });

  it("marks /patients as active when on that route", () => {
    mockUsePathname.mockReturnValue("/patients");
    render(<Sidebar />);
    const patientsLink = screen.getAllByRole("link").find(
      (l) => l.getAttribute("href") === "/patients",
    );
    expect(patientsLink?.className).toContain("from-blue-600");
  });

  it("renders tooltips for each nav item", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
  });
});

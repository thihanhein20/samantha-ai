import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BatchUploader from "@/components/BatchUploader";
import type { BatchItem } from "@/types/batch";

function makeItem(overrides: Partial<BatchItem> = {}): BatchItem {
  return {
    id: `id-${Math.random()}`,
    file: new File(["content"], "report.pdf", { type: "application/pdf" }),
    status: "pending",
    ...overrides,
  };
}

describe("BatchUploader — empty state", () => {
  it("shows 'Select PDFs to begin' when queue is empty", () => {
    render(
      <BatchUploader items={[]} activeId={null} onFilesAdded={jest.fn()} />,
    );
    expect(screen.getByText("Select PDFs to begin")).toBeInTheDocument();
  });

  it("does not show done counter when queue is empty", () => {
    render(
      <BatchUploader items={[]} activeId={null} onFilesAdded={jest.fn()} />,
    );
    expect(screen.queryByText(/done/)).not.toBeInTheDocument();
  });
});

describe("BatchUploader — with items", () => {
  const items: BatchItem[] = [
    makeItem({ id: "a", status: "done", file: new File([], "a.pdf", { type: "application/pdf" }) }),
    makeItem({ id: "b", status: "extracting", file: new File([], "b.pdf", { type: "application/pdf" }) }),
    makeItem({ id: "c", status: "error", file: new File([], "c.pdf", { type: "application/pdf" }) }),
  ];

  it("renders all item file names", () => {
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} />);
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("b.pdf")).toBeInTheDocument();
    expect(screen.getByText("c.pdf")).toBeInTheDocument();
  });

  it("shows done/total counter", () => {
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} />);
    expect(screen.getByText("1/3 done")).toBeInTheDocument();
  });

  it("shows 'Add More' button when items exist", () => {
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} />);
    expect(screen.getByText("Add More")).toBeInTheDocument();
  });

  it("highlights the active item with blue border classes", () => {
    render(<BatchUploader items={items} activeId="b" onFilesAdded={jest.fn()} />);
    const bItem = screen.getByText("b.pdf").closest("div");
    expect(bItem?.className).toContain("border-blue-400");
  });

  it("shows X remove button only for error items", () => {
    const onRemove = jest.fn();
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} onRemove={onRemove} />);
    const removeButtons = screen.getAllByTitle("Remove");
    expect(removeButtons).toHaveLength(1); // only 'c' is error
  });

  it("calls onRemove with the correct item id when X is clicked", () => {
    const onRemove = jest.fn();
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle("Remove"));
    expect(onRemove).toHaveBeenCalledWith("c");
  });

  it("does not show Remove button when onRemove prop is not provided", () => {
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} />);
    expect(screen.queryByTitle("Remove")).not.toBeInTheDocument();
  });
});

describe("BatchUploader — status badges", () => {
  it("shows correct badge labels", () => {
    const items: BatchItem[] = [
      makeItem({ status: "pending" }),
      makeItem({ status: "uploading" }),
      makeItem({ status: "done" }),
    ];
    render(<BatchUploader items={items} activeId={null} onFilesAdded={jest.fn()} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Uploading")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

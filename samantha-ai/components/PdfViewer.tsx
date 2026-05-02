"use client";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface Props {
  url: string;
}

export default function PdfViewer({ url }: Props) {
  const layoutPlugin = defaultLayoutPlugin();

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <div className="h-full">
        <Viewer fileUrl={url} plugins={[layoutPlugin]} />
      </div>
    </Worker>
  );
}

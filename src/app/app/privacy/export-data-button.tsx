'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportDataButtonProps {
  exportData: Record<string, unknown>;
}

export function ExportDataButton({ exportData }: ExportDataButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `prapti-citizen-data-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
      {downloading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-3.5 w-3.5" />
      )}
      Download My Data (JSON)
    </Button>
  );
}


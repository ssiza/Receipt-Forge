'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image } from 'lucide-react';

interface DownloadButtonProps {
  receiptId: string;
  receiptNumber: string;
  variant?: 'pdf' | 'image' | 'both';
  className?: string;
  disabled?: boolean;
}

export function DownloadButton({ 
  receiptId, 
  receiptNumber, 
  variant = 'both',
  className = '',
  disabled = false
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf' | 'image' | null>(null);

  const downloadFile = async (type: 'pdf' | 'image') => {
    // Check if disabled
    if (disabled) {
      alert('Monthly limit reached. Upgrade to download receipts.');
      return;
    }

    // Show popup for image downloads
    if (type === 'image') {
      alert('Image download feature is coming soon! 🚀\n\nFor now, you can download your receipt as a PDF.');
      return;
    }

    setIsDownloading(true);
    setDownloadType(type);
    
    try {
      const url = `/api/receipts/${receiptId}/${type}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Download failed: ${response.statusText}`;
        try {
          const errorData = await response.text();
          if (errorData.trim()) {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.error || parsedError.details || errorMessage;
          }
        } catch {
          // If we can't parse the error, use the status text
        }
        
        throw new Error(errorMessage);
      }

      // Verify we have a valid response
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response format - expected PDF');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 
                      `receipt-${receiptNumber}.${type === 'pdf' ? 'pdf' : 'jpg'}`;

      // Create blob and download
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Download error:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Failed to download ${type.toUpperCase()}: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  if (variant === 'pdf') {
    return (
      <Button
        onClick={() => downloadFile('pdf')}
        disabled={isDownloading || disabled}
        className={`${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        variant="outline"
        size="sm"
        title={disabled ? 'Monthly limit reached. Upgrade to download receipts.' : 'Download PDF'}
      >
        {isDownloading && downloadType === 'pdf' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        <span className="hidden sm:inline">{isDownloading && downloadType === 'pdf' ? 'Downloading...' : 'Download PDF'}</span>
        <span className="sm:hidden">PDF</span>
      </Button>
    );
  }

  if (variant === 'image') {
    return (
      <Button
        onClick={() => downloadFile('image')}
        disabled={isDownloading || disabled}
        className={`${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        variant="outline"
        size="sm"
        title={disabled ? 'Monthly limit reached. Upgrade to download receipts.' : 'Download Image'}
      >
        <Image className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Coming Soon</span>
        <span className="sm:hidden">Image</span>
      </Button>
    );
  }

  // Both variants
  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={() => downloadFile('pdf')}
        disabled={isDownloading || disabled}
        variant="outline"
        size="sm"
        className={`flex-1 sm:flex-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        title={disabled ? 'Monthly limit reached. Upgrade to download receipts.' : 'Download PDF'}
      >
        {isDownloading && downloadType === 'pdf' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        <span className="hidden sm:inline">{isDownloading && downloadType === 'pdf' ? 'Downloading...' : 'PDF'}</span>
        <span className="sm:hidden">PDF</span>
      </Button>
      
      <Button
        onClick={() => downloadFile('image')}
        disabled={isDownloading || disabled}
        variant="outline"
        size="sm"
        className={`opacity-60 flex-1 sm:flex-none ${disabled ? 'cursor-not-allowed' : ''}`}
        title={disabled ? 'Monthly limit reached. Upgrade to download receipts.' : 'Download Image (Coming Soon)'}
      >
        <Image className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Coming Soon</span>
        <span className="sm:hidden">Image</span>
      </Button>
    </div>
  );
} 
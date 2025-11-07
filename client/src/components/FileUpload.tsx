import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    if (!disabled) {
      document.getElementById('fileInput')?.click();
    }
  };

  return (
    <Card className="p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-4 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover-elevate'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        data-testid="upload-area"
      >
        <input
          id="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
          data-testid="input-file"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-6 rounded-full ${selectedFile ? 'bg-primary/10' : 'bg-muted'} transition-colors`}>
            {selectedFile ? (
              <FileSpreadsheet className="w-16 h-16 text-primary" />
            ) : (
              <Upload className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {selectedFile ? selectedFile.name : 'Click to Upload CSV or Excel File'}
            </h3>
            <p className="text-muted-foreground">
              {selectedFile ? 'File ready for validation' : 'or drag and drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supported: .csv, .xlsx, .xls
            </p>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            disabled={disabled}
            data-testid="button-clear-file"
          >
            Clear Selection
          </Button>
        </div>
      )}
    </Card>
  );
}

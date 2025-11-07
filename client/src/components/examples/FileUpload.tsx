import FileUpload from '../FileUpload';

export default function FileUploadExample() {
  return (
    <div className="max-w-3xl mx-auto">
      <FileUpload 
        onFileSelect={(file) => console.log('File selected:', file.name)}
      />
    </div>
  );
}

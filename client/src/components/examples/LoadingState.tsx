import LoadingState from '../LoadingState';

export default function LoadingStateExample() {
  return (
    <div className="max-w-3xl mx-auto">
      <LoadingState 
        message="Validating phone numbers..."
        progress="Processing 5 of 10 numbers..."
      />
    </div>
  );
}

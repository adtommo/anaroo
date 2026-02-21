interface NotFoundProps {
  onBack: () => void;
  onHome: () => void;
}

export function NotFound({ onBack, onHome }: NotFoundProps) {
  return (
    <div className="static-page">
      <div className="static-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>404</h1>
      </div>

      <div className="static-content">
        <p>The page you're looking for doesn't exist.</p>
        <button onClick={onHome} className="btn-home">Go to Home</button>
      </div>
    </div>
  );
}

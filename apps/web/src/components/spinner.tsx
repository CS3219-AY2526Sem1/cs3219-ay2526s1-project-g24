// Simple spinner component
type SpinnerProps = {
  text?: string;
};

function Spinner({ text }: SpinnerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "spin 1s linear infinite" }}
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="#888"
          strokeWidth="4"
          opacity="0.2"
        />
        <path
          d="M38 20a18 18 0 0 1-18 18"
          stroke="#1976d2"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </svg>
      {text && (
        <div style={{ marginTop: 16, color: '#555', fontSize: 16 }}>{text}</div>
      )}
    </div>
  );
}

export default Spinner;

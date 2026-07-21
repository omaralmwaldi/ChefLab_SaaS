// Slow-drifting warm gradient mesh behind the auth cards.
// Pure CSS; respects prefers-reduced-motion (see index.css .auth-blob rules).
function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden="true">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
    </div>
  );
}

export default AuthBackground;

import { useEffect } from "react";
import AuthBackground from "./AuthBackground";

// Full-screen celebratory hand-off shown right after a successful sign-in or
// sign-up, then auto-advances into the app via onDone.
function WelcomeOverlay({ title, subtitle, hint, onDone, duration = 1900 }) {
  useEffect(() => {
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [onDone, duration]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-100">
      <AuthBackground />
      <div className="welcome-card relative flex flex-col items-center px-6 text-center">
        <div className="welcome-ring mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 shadow-[0_10px_40px_rgba(234,88,12,0.35)]">
          <svg className="h-10 w-10 fill-none stroke-white" strokeWidth={2.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="welcome-line m-0 text-[32px] font-bold tracking-[-0.5px] text-stone-800">
          {title}
        </h1>
        {subtitle && (
          <p className="welcome-line-2 m-0 mt-2 text-[17px] font-medium text-orange-600">
            {subtitle}
          </p>
        )}
        {hint && (
          <p className="welcome-line-2 m-0 mt-4 text-sm text-stone-400">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default WelcomeOverlay;

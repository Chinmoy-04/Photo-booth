"use client";

interface CaptureControlsProps {
  onCapture: () => void;
  onCancelCountdown?: () => void;
  isCountingDown: boolean;
  disabled?: boolean;
}

export function CaptureControls({
  onCapture,
  onCancelCountdown,
  isCountingDown,
  disabled = false,
}: CaptureControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {isCountingDown ? (
        <button
          type="button"
          onClick={onCancelCountdown}
          className="btn-secondary"
        >
          Cancel countdown
        </button>
      ) : (
        <button
          type="button"
          onClick={onCapture}
          disabled={disabled}
          className="btn-primary px-10 text-lg"
        >
          Take photo
        </button>
      )}
      <p className="text-center text-xs text-ink-soft">
        3-second countdown · photos sync to the shared gallery
      </p>
    </div>
  );
}

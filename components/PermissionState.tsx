"use client";

import type { CameraState } from "@/lib/hooks/useCamera";

interface PermissionStateProps {
  state: CameraState;
  errorMessage: string | null;
}

export function PermissionState({ state, errorMessage }: PermissionStateProps) {
  if (state === "denied") {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Camera access was denied. Allow camera permission for this site in your browser settings, then toggle the
        camera on again.
      </p>
    );
  }
  if (state === "no-device") {
    return <p className="text-sm text-amber-600 dark:text-amber-400">No camera was found on this device.</p>;
  }
  if (state === "error") {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Couldn&apos;t start the camera{errorMessage ? `: ${errorMessage}` : "."}
      </p>
    );
  }
  return null;
}

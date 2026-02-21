import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-[200px] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
    </div>
  );
}

export function PageOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
      <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface MeisterFlowLogoProps {
  size?: LogoSize;
  /** Nur Icon-Bereich (Sidebar eingeklappt) */
  iconOnly?: boolean;
  className?: string;
  priority?: boolean;
}

const sizeMap: Record<
  LogoSize,
  { width: number; height: number; box: string; image: string }
> = {
  xs: { width: 32, height: 32, box: "h-8 w-8", image: "h-8 w-8 object-cover object-top scale-[2.2]" },
  sm: { width: 140, height: 48, box: "h-10", image: "h-10 w-auto" },
  md: { width: 180, height: 64, box: "h-14", image: "h-14 w-auto" },
  lg: { width: 260, height: 96, box: "h-20 sm:h-24", image: "h-20 sm:h-24 w-auto" },
  xl: { width: 320, height: 120, box: "h-28 sm:h-32", image: "h-28 sm:h-32 w-auto" },
};

export default function MeisterFlowLogo({
  size = "sm",
  iconOnly = false,
  className,
  priority = false,
}: MeisterFlowLogoProps) {
  const config = sizeMap[iconOnly ? "xs" : size];

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20",
        iconOnly ? "p-0.5" : "px-2 py-1",
        !iconOnly && config.box,
        className,
      )}
    >
      <Image
        src="/meisterflow-logo.png"
        alt="MeisterFlow Logo"
        width={config.width}
        height={config.height}
        priority={priority}
        className={cn(config.image, iconOnly && "rounded-md")}
      />
    </div>
  );
}

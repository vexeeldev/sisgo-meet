import { Icon as Iconify } from "@iconify/react";

export function Icon({
  icon,
  className,
  size,
}: {
  icon: string;
  className?: string;
  size?: number;
}) {
  return (
    <Iconify icon={icon} className={className} width={size} height={size} />
  );
}

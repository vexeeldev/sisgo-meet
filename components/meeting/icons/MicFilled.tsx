'use client';

import { SVGProps } from 'react';

interface MicFilledProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  color?: string;
}

export default function MicFilled({
  width = 24,
  height = 24,
  color = '#fff',
  className,
  ...props
}: MicFilledProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      height={height}
      width={width}
      fill={color}
      className={className}
      {...props}
    >
      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm-40 280v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Z" />
    </svg>
  );
}
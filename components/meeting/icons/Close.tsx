'use client';

import { SVGProps } from 'react';

interface CloseProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  color?: string;
}

export default function Close({
  width = 24,
  height = 24,
  color = '#fff',
  className,
  ...props
}: CloseProps) {
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
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  );
}
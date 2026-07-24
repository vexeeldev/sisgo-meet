import React from 'react';

interface KeepFilledProps extends React.SVGProps<SVGSVGElement> {}

const KeepFilled = ({ className, ...props }: KeepFilledProps) => {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="m648.13-488.37 80 80v91.24H525.5v239.04L480-32.59l-45.5-45.5v-239.04H231.87v-91.24l80-80v-273.78h-40v-91h416.26v91h-40v273.78Z" />
    </svg>
  );
};

export default KeepFilled;

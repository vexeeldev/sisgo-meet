import React from 'react';

interface VisualEffectsProps extends React.SVGProps<SVGSVGElement> {}

const VisualEffects = ({ className, ...props }: VisualEffectsProps) => {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path d="M19 4h-2V2h-2v2h-2v2h2v2h2V6h2V4zm-7.06 4.94L11 6l-.94 2.94L7 9.88l2.94.94L11 13.82l.94-2.94 2.94-.94-2.94-.94zM16 11l-.94 2.94L12 14.88l2.94.94L16 18.82l.94-2.94 2.94-.94-2.94-.94L16 11zm-5.06 4.94L10 13l-.94 2.94L6 16.88l2.94.94L10 20.82l.94-2.94 2.94-.94-2.94-.94z"/>
    </svg>
  );
};

export default VisualEffects;

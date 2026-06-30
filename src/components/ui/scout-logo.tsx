import { SVGProps } from "react";

export function ScoutLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Left side of compass - lighter */}
      <path d="M12 2L8 12L12 22L12 2Z" fill="currentColor" opacity="0.4" />
      {/* Right side of compass - darker */}
      <path d="M12 2L16 12L12 22L12 2Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

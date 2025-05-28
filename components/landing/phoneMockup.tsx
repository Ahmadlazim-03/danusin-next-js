import React from "react";

const PhoneMockup: React.FC = () => {
  return (
    <div className="w-full max-w-[320px] mx-auto p-4">
      <svg
        className="w-full h-auto drop-shadow-xl"
        viewBox="0 0 320 640"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phone body with gradient */}
        <rect
          x="10"
          y="10"
          width="300"
          height="620"
          rx="40"
          fill="url(#phoneBodyGradient)"
          stroke="#333"
          strokeWidth="2"
        />
        {/* Screen with subtle glass effect */}
        <rect
          x="20"
          y="70"
          width="280"
          height="500"
          rx="20"
          fill="url(#screenGradient)"
          filter="url(#glassEffect)"
        />
        {/* Home button */}
        <circle
          cx="160"
          cy="595"
          r="12"
          fill="#444"
          stroke="#666"
          strokeWidth="1"
        />
        {/* Front camera */}
        <circle cx="160" cy="40" r="6" fill="#222" />
        {/* Speaker */}
        <rect x="140" y="35" width="40" height="4" rx="2" fill="#222" />
        {/* Side buttons */}
        <rect x="5" y="150" width="4" height="40" rx="2" fill="#444" />
        <rect x="5" y="210" width="4" height="60" rx="2" fill="#444" />
        <rect x="311" y="150" width="4" height="60" rx="2" fill="#444" />
        {/* Dynamic island (notch) */}
        <rect x="110" y="20" width="100" height="20" rx="10" fill="#222" />
        {/* Gradient definitions */}
        <defs>
          <linearGradient
            id="phoneBodyGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f0f0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
          </linearGradient>
          {/* Glass effect filter */}
          <filter id="glassEffect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.2 0"
            />
          </filter>
        </defs>
        {/* Screen content (iframe) */}
        <foreignObject x="20" y="70" width="280" height="500">
          <iframe
            src="/phonemockuponly"
            className="phone-mobile w-full h-full rounded-[20px] border-none"
            title="Mobile Preview"
            style={{ backgroundColor: "transparent" }}
          ></iframe>
        </foreignObject>
      </svg>
    </div>
  );
};

export default PhoneMockup;

import React from "react";

const phoneMockup: React.FC = () => {
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <svg
        className="w-full h-auto"
        viewBox="0 0 300 600"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phone body */}
        <rect x="10" y="10" width="280" height="580" rx="30" fill="#000" />
        {/* Screen */}
        <rect x="20" y="60" width="260" height="480" rx="10" fill="#fff" />
        {/* Home button */}
        <circle cx="150" cy="560" r="15" fill="#333" />
        {/* Camera */}
        <circle cx="150" cy="30" r="5" fill="#333" />
        {/* Speaker */}
        <rect x="130" y="25" width="40" height="5" rx="2" fill="#333" />
        {/* Screen content (iframe) */}
        <foreignObject x="20" y="60" width="260" height="480">
          <iframe
            src="/"
            className="phone-mobile w-full h-full rounded-[10px] border-none max-[500px]:hidden"
            title="Mobile Preview"
          ></iframe>
        </foreignObject>
      </svg>
    </div>
  );
};

export default phoneMockup;

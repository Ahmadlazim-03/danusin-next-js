'use client';

import { useEffect } from 'react';
import Image from 'next/image';


interface Feature {
  title: string;
  description: string;
  icon: string;
}

const PhoneMockup = () => (
  <div className="phone-mockup text-center">
    <Image
      src="/assets/img/phone-app-screen.webp"
      alt="Phone Mockup"
      className="img-fluid"
      width={200}
      height={400}
    />
  </div>
);

export default function FeaturesSection() {

  const leftFeatures: Feature[] = [
    {
      title: 'Use On Any Device',
      description:
        'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia.',
      icon: 'bi bi-display',
    },
    {
      title: 'Feather Icons',
      description:
        'Phasellus ullamcorper ipsum rutrum nunc nunc nonummy metus vestibulum volutpat sapien arcu sed augue aliquam erat volutpat.',
      icon: 'bi bi-feather',
    },
    {
      title: 'Retina Ready',
      description:
        'Aenean tellus metus bibendum sed posuere ac mattis non nunc vestibulum fringilla purus sit amet fermentum aenean commodo.',
      icon: 'bi bi-eye',
    },
  ];

  const rightFeatures: Feature[] = [
    {
      title: 'W3c Valid Code',
      description:
        'Donec vitae sapien ut libero venenatis faucibus nullam quis ante etiam sit amet orci eget eros faucibus tincidunt.',
      icon: 'bi bi-code-square',
    },
    {
      title: 'Fully Responsive',
      description:
        'Maecenas tempus tellus eget condimentum rhoncus sem quam semper libero sit amet adipiscing sem neque sed ipsum.',
      icon: 'bi bi-phone',
    },
    {
      title: 'Browser Compatibility',
      description:
        'Nullam dictum felis eu pede mollis pretium integer tincidunt cras dapibus vivamus elementum semper nisi aenean vulputate.',
      icon: 'bi bi-browser-chrome',
    },
  ];

  return (
    <section id="features-2" className="features-2 section">
      <div className="container">
        <div className="row align-items-center">
          {/* Left Column */}
          <div className="col-lg-4 col-12 d-flex justify-content-center flex-column">
            {leftFeatures.map((feature, index) => (
              <div
                key={index}
                className={`feature-item text-end ${index < leftFeatures.length - 1 ? 'mb-5' : ''}`}
              
              >
                <div className="d-flex align-items-center justify-content-end gap-4">
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                  <div className="feature-icon flex-shrink-0">
                    <i className={feature.icon}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Center Column (Phone Mockup) */}
          <div className="col-lg-4 col-12 d-flex justify-content-center">
            <PhoneMockup />
          </div>

          {/* Right Column */}
          <div className="col-lg-4 col-12 d-flex justify-content-center flex-column">
            {rightFeatures.map((feature, index) => (
              <div
                key={index}
                className={`feature-item ${index < rightFeatures.length - 1 ? 'mb-5' : ''}`}
               
              >
                <div className="d-flex align-items-center gap-4">
                  <div className="feature-icon flex-shrink-0">
                    <i className={feature.icon}></i>
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

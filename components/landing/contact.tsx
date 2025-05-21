'use client';

import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';

interface ContactInfo {
  title: string;
  lines: string[];
  icon: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<string>('');

  const contactInfo: ContactInfo[] = [
    {
      title: 'Our Location',
      lines: ['Surabaya', 'Jawa Timur'],
      icon: 'bi bi-geo-alt',
    },
    {
      title: 'Phone Number',
      lines: ['0812 - 4911 - 1169', '+62 812 5237 4308'],
      icon: 'bi bi-telephone',
    },
    {
      title: 'Email Address',
      lines: ['evoptech@gmail.com'],
      icon: 'bi bi-envelope',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    const templateParams = {
      from_name: form.name,
      from_email: form.email,
      subject: form.subject,
      message: form.message,
    };

    emailjs
      .send(
        'service_7yzw8bg',
        'template_bd5ukge',
        templateParams,
        'WVAQjK0ITum1fQ8H4'
      )
      .then(() => {
        setFormStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      })
      .catch(() => {
        setFormStatus('error');
      });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section id="contact" className="contact section">
      <div className="container section-title pt-20" >
        <h2>Contact</h2>
        <p>
          Hubungi kami untuk informasi lebih lanjut atau dukungan terkait kampanye danusan dan layanan Danusin lainnya.
        </p>
      </div>

      <div className="container" >
        <div className="row g-4 g-lg-5">
          <div className="col-lg-5">
            <div className="info-box">
              <h2>Kontak</h2>
              <p>
                Hubungi kami untuk informasi lebih lanjut atau dukungan terkait kampanye danusan dan layanan Danusin lainnya.
              </p>
              {contactInfo.map((info, index) => (
                <div key={index} className="info-item">
                  <div className="icon-box">
                    <i className={info.icon}></i>
                  </div>
                  <div className="content">
                    <h4>{info.title}</h4>
                    {info.lines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-7">
            <div className="contact-form">
              <h3>Hubungi Kami</h3>
              <p>
                Kirim pesan Anda, dan tim kami akan segera merespons untuk membantu kebutuhan bisnis Anda.
              </p>
              <form onSubmit={handleSubmit} className="php-email-form">
                <div className="row gy-4">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Your Name"
                      value={form.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Your Email"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      name="subject"
                      className="form-control"
                      placeholder="Subject"
                      value={form.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <textarea
                      name="message"
                      rows={6}
                      className="form-control"
                      placeholder="Message"
                      value={form.message}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-12 text-center">
                    {formStatus === 'loading' && <div className="loading">Loading...</div>}
                    {formStatus === 'error' && (
                      <div className="error-message">An error occurred. Please try again.</div>
                    )}
                    {formStatus === 'success' && (
                      <div className="sent-message">
                        Your message has been sent. Thank you!
                      </div>
                    )}
                    <button
                      type="submit"
                      className="btn"
                      disabled={formStatus === 'loading'}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

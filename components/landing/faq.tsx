'use client'

import { useEffect, useState } from 'react';
interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const faqItems: FaqItem[] = [
    {
      question: 'Bagaimana cara memulai kampanye danusan di Danusin?',
      answer:
        'Untuk memulai kampanye, daftar atau masuk ke akun Danusin Anda, lalu buka menu "Buat Kampanye". Isi detail usaha Anda, tetapkan target dana, dan unggah informasi menarik tentang produk Anda. Setelah disetujui, kampanye Anda akan tayang dan dapat didukung oleh komunitas.',
    },
    {
      question: 'Apa itu fitur pelacakan penjual real-time?',
      answer:
        'Fitur pelacakan real-time memungkinkan Anda melihat lokasi penjual UMKM aktif melalui peta interaktif. Anda dapat mengetahui produk yang mereka tawarkan, organisasi terkait, dan menghubungi penjual terdekat untuk mendukung bisnis lokal.',
    },
    {
      question: 'Bagaimana cara bergabung dengan komunitas pengusaha di Danusin?',
      answer:
        'Setelah mendaftar, Anda dapat bergabung dengan komunitas melalui menu "Komunitas" di aplikasi. Ikuti grup yang relevan, hadiri acara pelatihan, dan jalin koneksi dengan pengusaha lain untuk berbagi pengalaman dan peluang bisnis.',
    },
    {
      question: 'Apakah Danusin menyediakan analitik untuk kampanye saya?',
      answer:
        'Ya, Danusin menawarkan laporan analitik yang mudah dipahami. Anda dapat memantau performa kampanye, jumlah pendanaan, dan tren penjualan melalui dasbor pengguna, membantu Anda membuat keputusan strategis untuk usaha Anda.',
    },
    {
      question: 'Apa yang harus dilakukan jika saya lupa kata sandi akun?',
      answer:
        'Klik tautan "Lupa Kata Sandi" di halaman login, lalu masukkan alamat email Anda. Kami akan mengirimkan instruksi untuk mengatur ulang kata sandi. Pastikan untuk memeriksa folder spam jika email tidak muncul di kotak masuk.',
    },
    {
      question: 'Apakah ada biaya untuk menggunakan Danusin?',
      answer:
        'Pendaftaran dan penggunaan dasar Danusin gratis. Namun, untuk kampanye crowdfunding, kami mengenakan biaya platform kecil dari dana yang terkumpul untuk mendukung operasional. Detail biaya dapat dilihat di halaman "Kebijakan" kami.',
    },
  ];

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-9 faq section light-background">
      <div className="container">
        <div className="row">
          <div className="col-lg-5">
            <h2 className="faq-title">Punya Pertanyaan? Lihat FAQ</h2>
            <p className="faq-description">
              Temukan jawaban atas pertanyaan umum tentang penggunaan Danusin untuk mendukung UMKM Anda, mulai dari kampanye hingga pelacakan penjual.
            </p>
            <div className="faq-arrow d-none d-lg-block" >
              <svg className="faq-arrow" width="200" height="211" viewBox="0 0 200 211" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M198.804 194.488C189.279 189.596 179.529 185.52 169.407 182.07L169.384 182.049C169.227 181.994 169.07 181.939 168.912 181.884C166.669 181.139 165.906 184.546 167.669 185.615C174.053 189.473 182.761 191.837 189.146 195.695C156.603 195.912 119.781 196.591 91.266 179.049C62.5221 161.368 48.1094 130.695 56.934 98.891C84.5539 98.7247 112.556 84.0176 129.508 62.667C136.396 53.9724 146.193 35.1448 129.773 30.2717C114.292 25.6624 93.7109 41.8875 83.1971 51.3147C70.1109 63.039 59.63 78.433 54.2039 95.0087C52.1221 94.9842 50.0776 94.8683 48.0703 94.6608C30.1803 92.8027 11.2197 83.6338 5.44902 65.1074C-1.88449 41.5699 14.4994 19.0183 27.9202 1.56641C28.6411 0.625793 27.2862 -0.561638 26.5419 0.358501C13.4588 16.4098 -0.221091 34.5242 0.896608 56.5659C1.8218 74.6941 14.221 87.9401 30.4121 94.2058C37.7076 97.0203 45.3454 98.5003 53.0334 98.8449C47.8679 117.532 49.2961 137.487 60.7729 155.283C87.7615 197.081 139.616 201.147 184.786 201.155L174.332 206.827C172.119 208.033 174.345 211.287 176.537 210.105C182.06 207.125 187.582 204.122 193.084 201.144C193.346 201.147 195.161 199.887 195.423 199.868C197.08 198.548 193.084 201.144 195.528 199.81C196.688 199.192 197.846 198.552 199.006 197.935C200.397 197.167 200.007 195.087 198.804 194.488ZM60.8213 88.0427C67.6894 72.648 78.8538 59.1566 92.1207 49.0388C98.8475 43.9065 106.334 39.2953 114.188 36.1439C117.295 34.8947 120.798 33.6609 124.168 33.635C134.365 33.5511 136.354 42.9911 132.638 51.031C120.47 77.4222 86.8639 93.9837 58.0983 94.9666C58.8971 92.6666 59.783 90.3603 60.8213 88.0427Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="faq-container">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className={`faq-item ${activeIndex === index ? 'faq-active' : ''}`}
                  onClick={() => handleToggle(index)}
                  role="button"
                  aria-expanded={activeIndex === index}
                  aria-controls={`faq-content-${index}`}
                >
                  <h3>{item.question}</h3>
                  <div id={`faq-content-${index}`} className="faq-content" style={{ display: activeIndex === index ? 'block' : 'none' }}>
                    <p>{item.answer}</p>
                  </div>
                  <i className={`faq-toggle bi bi-chevron-${activeIndex === index ? 'down' : 'right'}`}></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { useState, useEffect } from 'react';

export default function Nav() {
  const [gender, setGender] = useState('female');

  useEffect(() => {
    function onGenderChange(e) {
      setGender(e.detail);
    }
    window.addEventListener('genderchange', onGenderChange);
    return () => window.removeEventListener('genderchange', onGenderChange);
  }, []);

  const dotColor = gender === 'male' ? '#334155' : '#D4789C';
  const btnBg = gender === 'male' ? '#334155' : '#ec4899';
  const btnHover = gender === 'male' ? '#1e293b' : '#db2777';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-cream-100/85 border-b border-cream-300">
      <div className="max-w-4xl mx-auto px-5 py-3 flex justify-between items-center">
        <a href="/" className="font-display text-xl text-text flex items-center gap-1.5 hover:opacity-80">
          <span
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{ background: dotColor }}
          />
          whatsmysize
        </a>
        <div className="flex gap-3 items-center">
          <a href="/brands" className="text-text-secondary text-sm font-medium hover:text-text transition-colors">Brands</a>
          <a
            href="/tool"
            className="text-white px-5 py-2 rounded-full font-semibold text-sm transition-colors duration-300"
            style={{ background: btnBg }}
            onMouseEnter={e => e.target.style.background = btnHover}
            onMouseLeave={e => e.target.style.background = btnBg}
          >
            Find My Size
          </a>
        </div>
      </div>
    </nav>
  );
}

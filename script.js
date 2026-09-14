  const toothCursor = document.querySelector('.tooth-cursor');
  let clickAudioContext;

  const playClickSound = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!clickAudioContext) {
      clickAudioContext = new AudioCtx();
    }

    if (clickAudioContext.state === 'suspended') {
      clickAudioContext.resume();
    }

    const oscillator = clickAudioContext.createOscillator();
    const gainNode = clickAudioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(520, clickAudioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, clickAudioContext.currentTime + 0.09);

    gainNode.gain.setValueAtTime(0.0001, clickAudioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.045, clickAudioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, clickAudioContext.currentTime + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(clickAudioContext.destination);

    oscillator.start(clickAudioContext.currentTime);
    oscillator.stop(clickAudioContext.currentTime + 0.12);
  };

  if (toothCursor && window.matchMedia('(pointer: fine)').matches) {
    const updateCursor = (event) => {
      toothCursor.style.left = `${event.clientX}px`;
      toothCursor.style.top = `${event.clientY}px`;
      toothCursor.classList.add('visible');
    };

    window.addEventListener('pointermove', updateCursor);
    window.addEventListener('pointerdown', () => {
      toothCursor.classList.add('active');
      playClickSound();
    });
    window.addEventListener('pointerup', () => toothCursor.classList.remove('active'));
    window.addEventListener('pointerleave', () => toothCursor.classList.remove('visible'));
    document.addEventListener('mouseleave', () => toothCursor.classList.remove('visible'));
  }

// Header scroll shadow
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }, { passive:true });

  // Mobile menu toggle
    const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });


  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const setActive = () => {
    let current = 'home';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      if (window.scrollY >= top) current = sec.id;
    });
    navAnchors.forEach(a => {
      if (a.classList.contains('nav-cta')) return;
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  };
  window.addEventListener('scroll', setActive, { passive:true });
  setActive();

  // Scroll-reveal animation — handles both .reveal and [data-animate] elements,
  // and honours each element's data-delay (ms) for a smoothly staggered effect.
  const revealEls = document.querySelectorAll('.reveal, [data-animate]');
  revealEls.forEach(el => {
    const delay = el.getAttribute('data-delay');
    if (delay) el.style.transitionDelay = `${parseInt(delay, 10)}ms`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  revealEls.forEach(el => io.observe(el));

  // Contact form (demo submit)
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Email validation - must end with @gmail.com
    const emailInput = form.querySelector('#email');
    const emailValue = emailInput.value.trim();
    
    if (!emailValue.endsWith('@gmail.com')) {
      alert('Invalid Email');
      return;
    }
    
    // Service validation - must select a service
    const serviceInput = form.querySelector('#service');
    if (!serviceInput.value) {
      alert('Please select a service');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Request sent ✓';
    btn.style.background = '#1C9C8E';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      form.reset();
    }, 2200);
  });

  // ============================================================
  // GALLERY LIGHTBOX
  // ============================================================
  (() => {
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    if (!items.length) return;

    const slides = items.map(item => {
      const img = item.querySelector('.gallery-img');
      return {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        caption: item.getAttribute('data-caption') || img.getAttribute('alt') || ''
      };
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const backdrop = document.getElementById('lightboxBackdrop');

    let current = 0;

    const render = () => {
      const slide = slides[current];
      lightboxImg.src = slide.src;
      lightboxImg.alt = slide.alt;
      lightboxCaption.textContent = slide.caption;
      lightboxCounter.textContent = `${current + 1} / ${slides.length}`;
    };

    const open = (index) => {
      current = index;
      render();
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-lock');
    };

    const close = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-lock');
    };

    const showPrev = () => {
      current = (current - 1 + slides.length) % slides.length;
      render();
    };
    const showNext = () => {
      current = (current + 1) % slides.length;
      render();
    };

    items.forEach((item, index) => {
      item.addEventListener('click', () => open(index));
    });

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  })();

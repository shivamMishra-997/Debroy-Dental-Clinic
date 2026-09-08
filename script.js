// ============================================================
  // LIQUID GLASS — floating navbar + button chrome
  // Adapted from a WebGL refraction-lens shader into a lightweight CSS/JS
  // technique: an SVG feDisplacementMap filter feeds `backdrop-filter` for
  // the actual refraction, while a pointer-tracked radial-gradient
  // pseudo-element stands in for the shader's mouse-driven specular lens.
  // ============================================================
  (() => {
    // 1. Inject the SVG displacement filter once. backdrop-filter: url(#id)
    //    references it to bend/refract whatever sits behind the glass.
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    svg.innerHTML = `
      <filter id="liquid-distortion" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.012" numOctaves="2" seed="7" result="noise"></feTurbulence>
        <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise"></feGaussianBlur>
        <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="16" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
      </filter>
    `;
    document.body.prepend(svg);

    // 2. Tag the navbar + buttons as liquid glass.
    const glassEls = Array.from(document.querySelectorAll(
      'header, .btn-primary, .btn-ghost, .nav-cta, .burger'
    ));
    glassEls.forEach(el => el.classList.add('liquid-glass'));

    // 3. Pointer-tracked specular highlight (the CSS stand-in for the
    //    shader's mouse-driven lens position).
    glassEls.forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--lg-x', `${x}%`);
        el.style.setProperty('--lg-y', `${y}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--lg-x', '50%');
        el.style.setProperty('--lg-y', '0%');
      });
    });

    // 4. Liquid "bloom" ripple on press, scoped to buttons only.
    const rippleEls = document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta, .burger');
    rippleEls.forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        const ripple = document.createElement('span');
        ripple.className = 'lg-ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  })();

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

  // ============================================================
  // TESTIMONIALS — user-submitted reviews (saved to this browser)
  // ============================================================
  (() => {
    const grid = document.getElementById('testimonialsGrid');
    const openBtn = document.getElementById('openReviewModal');
    const modal = document.getElementById('reviewModal');
    if (!grid || !openBtn || !modal) return;

    const modalBackdrop = document.getElementById('reviewModalBackdrop');
    const modalClose = document.getElementById('reviewModalClose');
    const reviewForm = document.getElementById('reviewForm');
    const nameInput = document.getElementById('reviewName');
    const serviceInput = document.getElementById('reviewService');
    const textInput = document.getElementById('reviewText');
    const ratingInput = document.getElementById('reviewRating');
    const starPicker = document.getElementById('starPicker');
    const starBtns = Array.from(starPicker.querySelectorAll('.star-btn'));

    const STORAGE_KEY = 'debroyReviews';

    const setRatingDisplay = (value) => {
      starBtns.forEach(btn => {
        const v = parseInt(btn.getAttribute('data-value'), 10);
        btn.classList.toggle('active', v <= value);
      });
    };

    // Star picker interactions
    starBtns.forEach(btn => {
      const value = parseInt(btn.getAttribute('data-value'), 10);
      btn.addEventListener('click', () => {
        ratingInput.value = value;
        setRatingDisplay(value);
      });
      btn.addEventListener('mouseenter', () => setRatingDisplay(value));
    });
    starPicker.addEventListener('mouseleave', () => {
      setRatingDisplay(parseInt(ratingInput.value, 10));
    });
    setRatingDisplay(parseInt(ratingInput.value, 10));

    const openModal = () => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-lock');
      setTimeout(() => nameInput.focus(), 250);
    };
    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-lock');
    };

    openBtn.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    const buildStars = (rating) => {
      const wrap = document.createElement('div');
      wrap.className = 'testimonial-stars';
      for (let i = 1; i <= 5; i++) {
        const icon = document.createElement('i');
        icon.className = i <= rating ? 'bx bxs-star' : 'bx bx-star';
        wrap.appendChild(icon);
      }
      return wrap;
    };

    const buildCard = ({ name, service, rating, text }, animate) => {
      const card = document.createElement('div');
      card.className = 'testimonial-card glass-card new-review';

      const badge = document.createElement('span');
      badge.className = 'testimonial-badge';
      badge.textContent = 'Patient review';
      card.appendChild(badge);

      card.appendChild(buildStars(rating));

      const p = document.createElement('p');
      p.className = 'testimonial-text';
      p.textContent = `"${text}"`;
      card.appendChild(p);

      const author = document.createElement('div');
      author.className = 'testimonial-author';

      const avatar = document.createElement('div');
      avatar.className = 'avatar-placeholder';
      const userIcon = document.createElement('i');
      userIcon.className = 'bx bx-user';
      avatar.appendChild(userIcon);
      author.appendChild(avatar);

      const info = document.createElement('div');
      const h4 = document.createElement('h4');
      h4.textContent = name;
      const roleP = document.createElement('p');
      roleP.textContent = service || 'Patient';
      info.appendChild(h4);
      info.appendChild(roleP);
      author.appendChild(info);

      card.appendChild(author);

      if (animate) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = 'opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        });
      }

      return card;
    };

    const loadSavedReviews = () => {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (err) {
        saved = [];
      }
      saved.forEach(review => {
        grid.prepend(buildCard(review, false));
      });
    };

    const saveReview = (review) => {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (err) {
        saved = [];
      }
      saved.push(review);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch (err) {
        // storage unavailable (e.g. private browsing quota) — fail silently
      }
    };

    loadSavedReviews();

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const service = serviceInput.value.trim();
      const text = textInput.value.trim();
      const rating = parseInt(ratingInput.value, 10) || 5;

      if (!name) {
        alert('Please enter your name.');
        nameInput.focus();
        return;
      }
      if (!text) {
        alert('Please write a short review.');
        textInput.focus();
        return;
      }

      const review = { name, service, rating, text };
      const card = buildCard(review, true);
      grid.prepend(card);
      saveReview(review);

      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.textContent = 'Review posted ✓';
      submitBtn.style.background = '#1C9C8E';

      setTimeout(() => {
        submitBtn.textContent = original;
        submitBtn.style.background = '';
        reviewForm.reset();
        ratingInput.value = 5;
        setRatingDisplay(5);
        closeModal();
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
    });
  })();

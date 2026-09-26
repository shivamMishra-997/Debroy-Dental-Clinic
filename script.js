  // ============================================================
  // LENIS SMOOTH SCROLL
  // ============================================================
  let lenis;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.Lenis && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    // Expose the instance so other modules (e.g. the hero WebGL background)
    // can sync their own animation to the same scroll position.
    window.__lenis = lenis;

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  // Route every in-page anchor through Lenis so the header offset and
  // easing stay consistent, whether the link lives in the nav, the hero,
  // or the footer. Falls back to native anchor jumping if Lenis didn't load.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -96 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

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

  // Contact form submit
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('#email');
      const emailValue = emailInput.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(emailValue)) {
        emailInput.focus();
        emailInput.reportValidity();
        return;
      }

      const serviceInput = form.querySelector('#service');
      if (!serviceInput.value) {
        serviceInput.focus();
        serviceInput.reportValidity();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';
      btn.style.background = '#1C9C8E';

      try {
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        btn.textContent = 'Request sent ✓';
        form.reset();
      } catch (error) {
        btn.textContent = 'Try again';
        btn.style.background = '#b94a48';
        console.error('Contact form error:', error);
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = original;
          btn.style.background = '';
        }, 2200);
      }
    });
  }

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
  // HERO WEBGL BACKGROUND — soft, flowing mint/beige gradient
  // Reacts to pointer position and to page scroll (synced to Lenis
  // when available, so the flow field drifts as you scroll).
  // ============================================================
  (() => {
    const canvas = document.getElementById('heroCanvas');
    const heroSection = document.getElementById('home');
    if (!canvas || !heroSection) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
            || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) return; // No WebGL support — the section keeps its solid background.

    const vertexSrc = `
      attribute vec2 aPosition;
      void main(){
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Classic 2D simplex noise (Ashima Arts), fed through a couple of
    // domain-warped fbm passes for an organic, water-like flow.
    const fragmentSrc = `
      precision highp float;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uScroll;

      vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p){
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++){
          value += amp * snoise(p);
          p *= 2.02;
          amp *= 0.55;
        }
        return value;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float aspect = uResolution.x / uResolution.y;

        vec2 p = uv;
        p.x *= aspect;
        vec2 mouse = uMouse;
        mouse.x *= aspect;

        float t = uTime * 0.045;
        vec2 warp = p + vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t)) * 0.35;
        warp += (mouse - p) * 0.05;
        warp.y += uScroll * 0.35;

        float n = fbm(warp * 1.4 + t) * 0.5 + 0.5;

        vec3 beige = vec3(0.9294, 0.8118, 0.6471);
        vec3 pale  = vec3(0.851, 0.925, 0.910);
        vec3 mint  = vec3(0.0118, 0.6706, 0.4078);
        vec3 deep  = vec3(0.0157, 0.3373, 0.2078);

        vec3 color = mix(beige, pale, smoothstep(0.25, 0.6, n));
        color = mix(color, mint, smoothstep(0.55, 0.85, n) * 0.5);
        color = mix(color, deep, smoothstep(0.82, 1.0, n) * 0.22);

        float vignette = smoothstep(1.05, 0.35, length(uv - 0.5));
        color = mix(beige, color, vignette);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compile(type, src){
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.warn('Hero shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
      console.warn('Hero shader link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // A single triangle big enough to cover the whole viewport —
    // cheaper than a quad and avoids a diagonal seam.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uScroll = gl.getUniformLocation(program, 'uScroll');

    const mouseTarget = { x: 0.5, y: 0.5 };
    const mouseSmooth = { x: 0.5, y: 0.5 };
    let scrollTarget = 0;
    let scrollSmooth = 0;

    if (window.matchMedia('(pointer: fine)').matches) {
      heroSection.addEventListener('pointermove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        mouseTarget.x = (e.clientX - rect.left) / rect.width;
        mouseTarget.y = 1.0 - (e.clientY - rect.top) / rect.height;
      });
    }

    function resize(){
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = heroSection.clientWidth;
      const h = heroSection.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Sync the flow field's drift to Lenis's scroll value when it's
    // running; otherwise fall back to the native scroll position.
    if (window.__lenis) {
      window.__lenis.on('scroll', ({ scroll, limit }) => {
        scrollTarget = limit ? scroll / limit : 0;
      });
    } else {
      window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollTarget = max > 0 ? window.scrollY / max : 0;
      }, { passive: true });
    }

    const draw = (time) => {
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * 0.06;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * 0.06;
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.06;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouseSmooth.x, mouseSmooth.y);
      gl.uniform1f(uScroll, scrollSmooth);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = null;
    const start = performance.now();

    const loop = (now) => {
      draw((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      draw(4.0); // one calm, static frame — no motion for reduced-motion users
    } else {
      frame = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && frame) {
          cancelAnimationFrame(frame);
          frame = null;
        } else if (!document.hidden && frame === null) {
          frame = requestAnimationFrame(loop);
        }
      });
    }
  })();

/* ====================================================================
   1. STICKY HEADER
   Shows the sticky bar once the user scrolls past the main navbar height.
   Hides again when scrolling back up to the top.
   Uses requestAnimationFrame for smooth performance.
==================================================================== */
const StickyHeader = (() => {
  const header  = document.getElementById('stickyHeader');
  const navbar  = document.getElementById('navbar');

  if (!header || !navbar) return;

  let lastScrollY  = window.scrollY;
  let ticking      = false;

  const update = () => {
    const navbarBottom = navbar.getBoundingClientRect().bottom;
    const scrollingDown = window.scrollY > lastScrollY;

  
    if (navbarBottom <= 0) {
      header.classList.add('is-visible');
    } else {
      header.classList.remove('is-visible');
    }

    lastScrollY = window.scrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ====================================================================
   2. MOBILE MENU
   Toggles the mobile nav drawer and updates ARIA attributes.
==================================================================== */
const MobileMenu = (() => {
  const hamburger  = document.getElementById('hamburger');
  const menu       = document.getElementById('mobileMenu');

  if (!hamburger || !menu) return;

  const toggle = () => {
    const isOpen = menu.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  };

 
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });

  hamburger.addEventListener('click', toggle);
})();


/* ====================================================================
   3. IMAGE CAROUSEL
   Uses the native scroll-snap track for smooth sliding.
   Prev / Next buttons scroll the track by one slide width.
   Dot indicators update to reflect the current visible slide.
==================================================================== */
const ImageCarousel = (() => {
  const track   = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('carouselDots');

  if (!track) return;

  const slides    = Array.from(track.querySelectorAll('.carousel__slide'));
  const totalSlides = slides.length;
  let currentIndex  = 0;

 
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));


  const goTo = (index) => {
    currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
    const slide  = slides[currentIndex];

    const trackLeft  = track.getBoundingClientRect().left;
    const slideLeft  = slide.getBoundingClientRect().left;
    track.scrollBy({ left: slideLeft - trackLeft, behavior: 'smooth' });
    updateUI();
  };


  const updateUI = () => {
    dots.forEach((dot, i) => {
      const active = i === currentIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalSlides - 1;
  };


  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  
  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
  
      const trackRect = track.getBoundingClientRect();
      let closestIndex = 0;
      let closestDist  = Infinity;
      slides.forEach((slide, i) => {
        const slideRect = slide.getBoundingClientRect();
        const dist = Math.abs(slideRect.left - trackRect.left);
        if (dist < closestDist) {
          closestDist  = dist;
          closestIndex = i;
        }
      });
      currentIndex = closestIndex;
      updateUI();
    }, 80);
  }, { passive: true });


  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
  });

  updateUI();
})();


/* ====================================================================
   4. ZOOM OVERLAY
   On mouseover of any .slide__img-wrap, position and reveal the
   .zoom-overlay for that slide at a smart offset from the cursor / card.
   The overlay follows cursor position for a "magnifying glass" feel.
==================================================================== */
const ZoomOverlay = (() => {
  const OFFSET_X = 20; 
  const OFFSET_Y = 20;

 
  const wraps = Array.from(document.querySelectorAll('.slide__img-wrap'));

  wraps.forEach(wrap => {
    const overlay = wrap.querySelector('.zoom-overlay');
    if (!overlay) return;

    let active = false;

    const show = () => {
      if (active) return;
      active = true;
      overlay.classList.add('is-active');
    };

    const hide = () => {
      active = false;
      overlay.classList.remove('is-active');
    };

    const move = (e) => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      const ovW = overlay.offsetWidth  || 480;
      const ovH = overlay.offsetHeight || 320;

      let x = e.clientX + OFFSET_X;
      let y = e.clientY + OFFSET_Y;

      if (x + ovW > vpW - 12) x = e.clientX - ovW - OFFSET_X;
  
      if (y + ovH > vpH - 12) y = e.clientY - ovH - OFFSET_Y;

      x = Math.max(8, Math.min(x, vpW - ovW - 8));
      y = Math.max(8, Math.min(y, vpH - ovH - 8));

      overlay.style.left = `${x}px`;
      overlay.style.top  = `${y}px`;
    };

    wrap.addEventListener('mouseenter', (e) => { show(); move(e); });
    wrap.addEventListener('mousemove',  (e) => { if (active) move(e); });
    wrap.addEventListener('mouseleave', hide);

    wrap.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      show();
      move({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    wrap.addEventListener('touchend', () => {
      setTimeout(hide, 700);
    });

    const slide = wrap.closest('.carousel__slide');
    if (slide) {
      slide.addEventListener('focus', () => {
        const rect = slide.getBoundingClientRect();
        show();
        move({ clientX: rect.right, clientY: rect.top });
      });
      slide.addEventListener('blur', hide);
    }
  });
})();


/* ====================================================================
   5. CONTACT FORM — client-side validation + success state
==================================================================== */
const ContactForm = (() => {
  const form    = document.getElementById('ctaForm');
  const success = document.getElementById('ctaSuccess');

  if (!form) return;

  const nameInput  = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const needInput  = document.getElementById('need');
  const nameError  = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isEmpty      = (v) => v.trim() === '';

  const setError = (input, errorEl, msg) => {
    input.classList.add('is-error');
    errorEl.textContent = msg;
  };

  const clearError = (input, errorEl) => {
    input.classList.remove('is-error');
    errorEl.textContent = '';
  };


  nameInput.addEventListener('blur', () => {
    if (isEmpty(nameInput.value)) {
      setError(nameInput, nameError, 'Please enter your name.');
    } else {
      clearError(nameInput, nameError);
    }
  });

  emailInput.addEventListener('blur', () => {
    if (isEmpty(emailInput.value)) {
      setError(emailInput, emailError, 'Please enter your email.');
    } else if (!isValidEmail(emailInput.value)) {
      setError(emailInput, emailError, 'Please enter a valid email address.');
    } else {
      clearError(emailInput, emailError);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    if (isEmpty(nameInput.value)) {
      setError(nameInput, nameError, 'Please enter your name.');
      valid = false;
    } else {
      clearError(nameInput, nameError);
    }

    if (isEmpty(emailInput.value)) {
      setError(emailInput, emailError, 'Please enter your email.');
      valid = false;
    } else if (!isValidEmail(emailInput.value)) {
      setError(emailInput, emailError, 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError(emailInput, emailError);
    }

    if (!needInput.value) {
      needInput.classList.add('is-error');
      valid = false;
    } else {
      needInput.classList.remove('is-error');
    }

    if (valid) {

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      setTimeout(() => {
        form.hidden   = true;
        success.hidden = false;
      }, 1000);
    }
  });
})();


/* ====================================================================
   6. SCROLL-REVEAL — lightweight intersection observer
   Adds 'revealed' class to sections as they enter the viewport.
==================================================================== */
const ScrollReveal = (() => {
  const targets = document.querySelectorAll(
    '.service-card, .step, .testimonial-card, .carousel__slide'
  );

  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = `
    .service-card,
    .step,
    .testimonial-card,
    .carousel__slide {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .service-card.revealed,
    .step.revealed,
    .testimonial-card.revealed,
    .carousel__slide.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el, i) => {
  
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    observer.observe(el);
  });
})();

/* ==========================================================================
   RajMahal - Core Interactive Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modular components
  initPreloader();
  initNavbar();
  initHeroSlider();
  initBookingPanel();
  initScrollReveals();
  initLightbox();
  initRoyalAudio();
  initCustomCursor();
  initPageTransitions();
  initApiIntegration();
});

/* --- 1. Luxury Preloader System --- */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const progressBar = document.querySelector('.preloader-bar');
  
  if (!preloader) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Complete loading and transition out
      setTimeout(() => {
        preloader.classList.add('loaded');
        document.body.style.overflowY = 'auto'; // Re-enable scroll
      }, 500);
    }
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
  }, 100);
}

/* --- 2. Floating Navbar Compression & Mobile Menu --- */
function initNavbar() {
  const wrapper = document.querySelector('.navbar-wrapper');
  const toggle = document.querySelector('.navbar-toggle');
  const navMenu = document.querySelector('.navbar-nav');

  if (!wrapper) return;

  // Compress navbar on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      wrapper.classList.add('scrolled');
    } else {
      wrapper.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking links
    document.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
}

/* --- 3. Royal Background Audio Synthesizer (Web Audio API) --- */
function initRoyalAudio() {
  const toggleContainer = document.querySelector('.audio-toggle-container');
  const bars = document.querySelector('.audio-bars');
  const label = document.querySelector('.audio-label');

  if (!toggleContainer) return;

  let audioCtx = null;
  let isPlaying = false;
  let oscillators = [];
  let filter = null;
  let gainNode = null;
  let melodyInterval = null;

  // Harmonious, peaceful pentatonic notes (Raga Bhupali scale)
  // Low Tanpura drone notes and flute melodies
  const ragaScale = [164.81, 185.00, 207.65, 246.94, 277.18, 329.63, 370.00, 415.30, 493.88]; // E3, F#3, G#3, B3, C#4, E4, F#4, G#4, B4

  function startSynthesizer() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master volume
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
    // Target volume is extremely quiet (0.05) to keep it luxurious, non-disturbing ambient background drone
    gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 3);

    // Deep resonant filter to mimic high-end palace wooden acoustic dampening
    filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, audioCtx.currentTime);

    // Create 3 slow oscillator drones (Tanpura style)
    const baseFreqs = [82.41, 123.47, 164.81]; // E2, B2, E3 (Root-Fifth-Octave)
    baseFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = (idx === 0) ? 'triangle' : 'sine'; // Low soft hums
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Detune slightly for lush chorusing
      osc.detune.setValueAtTime((idx - 1) * 8, audioCtx.currentTime);
      
      oscGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      
      osc.connect(oscGain);
      oscGain.connect(filter);
      
      osc.start();
      oscillators.push(osc);
    });

    // Create slow, airy "Flute" synthesizer using sine wave with vibrato
    const fluteOsc = audioCtx.createOscillator();
    const fluteGain = audioCtx.createGain();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();

    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(ragaScale[4], audioCtx.currentTime); // C#4 default

    fluteGain.gain.setValueAtTime(0, audioCtx.currentTime); // Quiet initially

    // Vibrato setup (subtle frequency oscillation)
    vibrato.frequency.value = 5.5; // 5.5Hz vibrato
    vibratoGain.gain.value = 4; // Vibrato depth (detunes by 4Hz)

    vibrato.connect(vibratoGain);
    vibratoGain.connect(fluteOsc.detune);
    
    fluteOsc.connect(fluteGain);
    fluteGain.connect(filter);

    vibrato.start();
    fluteOsc.start();
    
    // Keep reference to stop later
    oscillators.push(vibrato);
    oscillators.push(fluteOsc);

    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Dynamic Flute Melody Generation Loop (softly playing Raga Bhupali notes)
    let melodyIndex = 0;
    melodyInterval = setInterval(() => {
      if (audioCtx.state === 'suspended') return;
      
      const nextNote = ragaScale[Math.floor(Math.random() * ragaScale.length)];
      
      // Soft glide transition
      fluteOsc.frequency.exponentialRampToValueAtTime(nextNote, audioCtx.currentTime + 1.2);
      
      // Soft attack, sustain, decay envelope
      fluteGain.gain.cancelScheduledValues(audioCtx.currentTime);
      fluteGain.gain.setValueAtTime(fluteGain.gain.value, audioCtx.currentTime);
      fluteGain.gain.linearRampToValueAtTime(0.012, audioCtx.currentTime + 0.6); // Gentle peak
      fluteGain.gain.exponentialRampToValueAtTime(0.002, audioCtx.currentTime + 3.8); // Gentle fade
    }, 4500);
  }

  function stopSynthesizer() {
    if (gainNode) {
      // Fade out master context safely
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 1);
      
      setTimeout(() => {
        if (audioCtx) {
          audioCtx.close();
          audioCtx = null;
        }
        clearInterval(melodyInterval);
        oscillators = [];
      }, 1100);
    }
  }

  toggleContainer.addEventListener('click', () => {
    if (!isPlaying) {
      isPlaying = true;
      startSynthesizer();
      bars.classList.add('playing');
      label.textContent = "Ambiance: ON";
      label.style.color = "var(--gold-primary)";
    } else {
      isPlaying = false;
      stopSynthesizer();
      bars.classList.remove('playing');
      label.textContent = "Ambiance: OFF";
      label.style.color = "var(--text-muted)";
    }
  });
}

/* --- 4. Royal Animated Hero Slider --- */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator');
  
  if (slides.length === 0) return;

  let currentSlide = 0;
  const slideInterval = 6500; // 6.5s per image transition
  let timer;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(dot => dot.classList.remove('active'));

    slides[index].classList.add('active');
    if (indicators[index]) {
      indicators[index].classList.add('active');
    }
    currentSlide = index;
  }

  function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function startTimer() {
    timer = setInterval(nextSlide, slideInterval);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  // Initialize
  showSlide(0);
  startTimer();

  // Bullet indicators click binding
  indicators.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      resetTimer();
    });
  });
}

/* --- 5. Interactive Booking Panel & Guest Selector --- */
function initBookingPanel() {
  const panel = document.querySelector('.booking-panel');
  if (!panel) return;

  // Custom Guest Selector Dropdown controls
  const guestSelector = document.querySelector('.guest-selector');
  const guestDisplay = document.querySelector('.guest-display span');
  const guestDropdown = document.querySelector('.guest-dropdown');
  
  if (guestSelector && guestDropdown) {
    guestSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      guestDropdown.classList.toggle('active');
    });

    // Close guest dropdown when clicking outside
    document.addEventListener('click', () => {
      guestDropdown.classList.remove('active');
    });

    // Stop propagation inside dropdown so click doesn't close it
    guestDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Counter inputs logic
  const counters = document.querySelectorAll('.guest-counter');
  let adultsCount = 2;
  let childrenCount = 0;

  function updateGuestDisplay() {
    if (guestDisplay) {
      guestDisplay.textContent = `${adultsCount} Adults, ${childrenCount} Child${childrenCount !== 1 ? 'ren' : ''}`;
    }
  }

  counters.forEach(counter => {
    const decBtn = counter.querySelector('.dec-btn');
    const incBtn = counter.querySelector('.inc-btn');
    const valSpan = counter.querySelector('.counter-val');
    const type = counter.dataset.type;

    decBtn.addEventListener('click', () => {
      if (type === 'adults') {
        if (adultsCount > 1) { // At least 1 adult required
          adultsCount--;
          valSpan.textContent = adultsCount;
        }
      } else {
        if (childrenCount > 0) {
          childrenCount--;
          valSpan.textContent = childrenCount;
        }
      }
      updateGuestDisplay();
    });

    incBtn.addEventListener('click', () => {
      if (type === 'adults') {
        if (adultsCount < 10) { // Limit max guests
          adultsCount++;
          valSpan.textContent = adultsCount;
        }
      } else {
        if (childrenCount < 10) {
          childrenCount++;
          valSpan.textContent = childrenCount;
        }
      }
      updateGuestDisplay();
    });
  });

  // Handle Date Input minimum limits
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');

  if (checkinInput && checkoutInput) {
    const today = new Date().toISOString().split('T')[0];
    checkinInput.min = today;
    checkinInput.value = today;

    // Default checkout is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    checkoutInput.min = tomorrowStr;
    checkoutInput.value = tomorrowStr;

    // Sychronize check-out floor with check-in
    checkinInput.addEventListener('change', () => {
      const selectedCheckIn = new Date(checkinInput.value);
      selectedCheckIn.setDate(selectedCheckIn.getDate() + 1);
      const nextDayStr = selectedCheckIn.toISOString().split('T')[0];
      
      checkoutInput.min = nextDayStr;
      if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
        checkoutInput.value = nextDayStr;
      }
    });
  }

  // Handle Reservation Submissions
  const bookingBtn = panel.querySelector('.btn-gold');
  if (bookingBtn) {
    bookingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const checkinVal = checkinInput ? checkinInput.value : '';
      const checkoutVal = checkoutInput ? checkoutInput.value : '';
      const roomTypeSelect = document.getElementById('room-type');
      const selectedType = roomTypeSelect ? roomTypeSelect.value : 'all';
      
      if (!checkinVal || !checkoutVal) {
        alert("Please select stay dates first.");
        return;
      }

      // Check if API integration is loaded
      if (typeof window.handleBookingInquiry === 'function') {
        window.handleBookingInquiry(checkinVal, checkoutVal, adultsCount, childrenCount, selectedType);
      } else {
        // Elegant cinematic alert popup custom styled modal (Fallback)
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(5, 5, 5, 0.9)';
        modal.style.backdropFilter = 'blur(10px)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '100000';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.5s ease';

        modal.innerHTML = `
          <div class="glass-card" style="padding: 4rem; max-width: 550px; text-align: center; border: 1px solid var(--gold-primary); box-shadow: var(--glow-shadow-strong);">
            <div class="preloader-mandala" style="margin: 0 auto 2rem auto; width: 80px; height: 80px;"></div>
            <h2 class="gold-text" style="font-size: 2rem; margin-bottom: 1.5rem;">Reservation Inquiry</h2>
            <p style="color: var(--text-light); margin-bottom: 1.5rem; font-family: var(--font-serif); font-style: italic;">
              "Pranam. Your request for luxury accommodations has been initiated."
            </p>
            <div style="text-align: left; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 4px; margin-bottom: 2rem; border-left: 3px solid var(--gold-primary); font-size: 0.9rem;">
              <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Check-in:</strong> ${checkinVal}</div>
              <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Check-out:</strong> ${checkoutVal}</div>
              <div><strong style="color: var(--gold-primary);">Guests:</strong> ${adultsCount} Adults, ${childrenCount} Children</div>
            </div>
            <p style="font-size: 0.8rem; margin-bottom: 2rem; color: var(--text-muted);">
              Our Royal Ambassador will verify palace availability and connect with you shortly.
            </p>
            <button class="btn-gold" id="close-modal-btn">Acknowledge</button>
          </div>
        `;

        document.body.appendChild(modal);
        
        // Animate modal open
        setTimeout(() => {
          modal.style.opacity = '1';
        }, 50);

        document.getElementById('close-modal-btn').addEventListener('click', () => {
          modal.style.opacity = '0';
          setTimeout(() => {
            modal.remove();
          }, 500);
        });
      }
    });
  }
}

/* --- 6. Scroll Reveal Engine (Intersection Observer) --- */
function initScrollReveals() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  
  if (elements.length === 0) return;

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once revealed, we don't need to track it anymore
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15, // Trigger when 15% of element is in view
    rootMargin: "0px 0px -50px 0px"
  });

  elements.forEach(el => revealObserver.observe(el));
}

/* --- 7. Fullscreen Lightbox Gallery Gallery System --- */
function initLightbox() {
  const items = document.querySelectorAll('[data-lightbox]');
  if (items.length === 0) return;

  // Dynamically inject lightbox layout to avoid markup pollution
  const lightbox = document.createElement('div');
  lightbox.classList.add('lightbox');
  lightbox.innerHTML = `
    <button class="lightbox-close">&times;</button>
    <button class="lightbox-arrow lightbox-prev">&#10094;</button>
    <div class="lightbox-content">
      <img src="" class="lightbox-img" alt="">
      <div class="lightbox-caption"></div>
    </div>
    <button class="lightbox-arrow lightbox-next">&#10095;</button>
  `;
  document.body.appendChild(lightbox);

  const lImg = lightbox.querySelector('.lightbox-img');
  const lCap = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let activeIndex = 0;
  const imageSources = Array.from(items).map(item => ({
    src: item.getAttribute('href') || item.dataset.lightboxSrc,
    title: item.dataset.title || ''
  }));

  function openLightbox(index) {
    activeIndex = index;
    lImg.src = imageSources[index].src;
    lCap.textContent = imageSources[index].title;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // stop background scroll
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // restore scroll
  }

  function showPrev() {
    activeIndex = (activeIndex - 1 + imageSources.length) % imageSources.length;
    lImg.src = imageSources[activeIndex].src;
    lCap.textContent = imageSources[activeIndex].title;
  }

  function showNext() {
    activeIndex = (activeIndex + 1) % imageSources.length;
    lImg.src = imageSources[activeIndex].src;
    lCap.textContent = imageSources[activeIndex].title;
  }

  // Bind clicks to items
  items.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index);
    });
  });

  // Core Lightbox Buttons binding
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
  lightbox.addEventListener('click', closeLightbox);
  
  // Keyboard binds
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
}

/* --- 8. Custom Luxury Dual-Ring Cursor System --- */
function initCustomCursor() {
  // Check if screen supports hover (desktop)
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return; // Completely disable on mobile/touch screens

  // Dynamically create custom cursor elements so HTML requires zero changes!
  const dot = document.createElement('div');
  dot.classList.add('custom-cursor-dot');
  
  const ring = document.createElement('div');
  ring.classList.add('custom-cursor-ring');
  
  const ringText = document.createElement('span');
  ringText.classList.add('custom-cursor-text');
  ringText.textContent = 'View';
  ring.appendChild(ringText);

  document.body.appendChild(dot);
  document.body.appendChild(ring);

  // Mark body as having custom cursor to hide default mouse pointer
  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let dotX = mouseX;
  let dotY = mouseY;

  // Track coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Use Linear Interpolation (lerp) for silky smooth lag-free movement!
  function updateCursor() {
    // Smooth outer ring (lerp with factor 0.15 for soft delay)
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    // Fast inner dot (lerp with 0.35 for quick follow)
    dotX += (mouseX - dotX) * 0.35;
    dotY += (mouseY - dotY) * 0.35;

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;

    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Hover expansion and "VIEW" text state bindings
  const hoverTargets = 'a, button, select, input, textarea, .counter-btn, .audio-toggle-container, .hero-indicator, .testimonial-dot';
  
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.matches && e.target.matches(hoverTargets)) {
      ring.classList.add('hovered');
      dot.classList.add('hovered');
    }
  }, true);

  document.body.addEventListener('mouseleave', (e) => {
    if (e.target.matches && e.target.matches(hoverTargets)) {
      ring.classList.remove('hovered');
      dot.classList.remove('hovered');
    }
  }, true);

  // Viewing Mode Bindings (Room Cards and Gallery Items)
  const viewTargets = '.room-card, .gallery-item, .editorial-row img, .rooms-hero, .dining-venue-row img, .hero-slide, .welcome-section img, .parallax-bg';
  
  document.body.addEventListener('mouseenter', (e) => {
    const card = e.target.closest(viewTargets);
    if (card) {
      ring.classList.add('viewing');
      dot.classList.add('viewing');
      if (card.matches('.room-card')) {
        ringText.textContent = 'Explore';
      } else {
        ringText.textContent = 'View';
      }
    }
  }, true);

  document.body.addEventListener('mouseleave', (e) => {
    const card = e.target.closest(viewTargets);
    if (card) {
      ring.classList.remove('viewing');
      dot.classList.remove('viewing');
    }
  }, true);
}

/* --- 9. SPA-Like Cinematic Page Transition Engine --- */
function initPageTransitions() {
  const links = document.querySelectorAll('a[href]');
  const preloader = document.getElementById('preloader');

  links.forEach(link => {
    const href = link.getAttribute('href');
    
    // Check if it's an internal html link (not an external domain, mailto, tel, or internal anchor id)
    if (
      href &&
      !href.startsWith('#') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('http') &&
      !link.getAttribute('target') &&
      (href.endsWith('.html') || href === './' || href === '/')
    ) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = href;
        
        // Use preloader iris-in closed animation to cover screen before navigation
        if (preloader) {
          preloader.classList.remove('loaded');
          
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 1250); // Wait for transition out clip-path to close (1.25s matches preloader perfect transition)
        } else {
          // Fade fallback if preloader doesn't exist on page
          document.body.style.opacity = '0';
          document.body.style.transition = 'opacity 0.6s ease';
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 600);
        }
      });
    }
  });
}


/* ==========================================================================
   RajMahal - Premium Frontend-to-Backend API Integration Layer
   ========================================================================== */

function initApiIntegration() {
  const API_BASE_URL = (window.location.hostname && window.location.hostname !== 'localhost')
    ? `http://${window.location.hostname}:5000/api`
    : 'http://127.0.0.1:5000/api';
  
  // 1. Inject Premium CSS Styles for Portals and Booking Modals dynamically
  const styleBlock = document.createElement('style');
  styleBlock.textContent = `
    /* Modal and Form Design Systems */
    .royal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 5, 5, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100005;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .royal-overlay.active {
      opacity: 1;
    }
    .royal-modal-card {
      width: 90%;
      max-width: 650px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 3rem;
      border: 1px solid rgba(212, 175, 55, 0.25);
      box-shadow: var(--glow-shadow-strong);
      transform: scale(0.95);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .royal-overlay.active .royal-modal-card {
      transform: scale(1);
    }
    .royal-modal-close {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: transparent;
      border: none;
      color: var(--gold-primary);
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
      transition: var(--transition-fast);
    }
    .royal-modal-close:hover {
      color: var(--white);
      transform: rotate(90deg);
    }
    
    /* Input and Form Groups */
    .royal-form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .royal-form-label {
      display: block;
      font-family: var(--font-royal);
      color: var(--gold-primary);
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .royal-form-input {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 2px;
      color: var(--text-light);
      font-family: var(--font-sans);
      font-size: 0.9rem;
      outline: none;
      transition: var(--transition-fast);
    }
    .royal-form-input:focus {
      border-color: var(--gold-primary);
      box-shadow: var(--glow-shadow);
      background: rgba(255, 255, 255, 0.05);
    }
    
    /* Toggle Signin Link */
    .royal-toggle-link {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 1.5rem;
      display: block;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .royal-toggle-link span {
      color: var(--gold-primary);
      text-decoration: underline;
    }
    .royal-toggle-link span:hover {
      color: var(--gold-light);
    }

    /* Available Room Cards inside Selection Dialog */
    .avail-room-row {
      display: grid;
      grid-template-columns: 120px 1fr auto;
      gap: 1.5rem;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(212, 175, 55, 0.1);
      text-align: left;
      transition: var(--transition-fast);
    }
    .avail-room-row:hover {
      background: rgba(212, 175, 55, 0.02);
    }
    .avail-room-img {
      width: 120px;
      height: 80px;
      object-fit: cover;
      border-radius: 2px;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .avail-room-name {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      color: var(--text-light);
      margin-bottom: 0.3rem;
    }
    .avail-room-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .avail-room-price {
      font-family: var(--font-royal);
      color: var(--gold-primary);
      font-weight: 600;
    }

    /* Booking history list */
    .booking-history-item {
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 1.2rem;
      background: rgba(255, 255, 255, 0.01);
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 1.5rem;
      text-align: left;
    }
    .history-meta-title {
      font-family: var(--font-serif);
      font-size: 1.2rem;
      color: var(--text-light);
      margin-bottom: 0.4rem;
    }
    .history-meta-dates {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .history-meta-price {
      font-family: var(--font-royal);
      color: var(--gold-primary);
      font-size: 0.9rem;
    }
    .history-status {
      padding: 0.3rem 0.8rem;
      font-size: 0.7rem;
      font-family: var(--font-royal);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: 2px;
    }
    .history-status.confirmed {
      background: rgba(46, 204, 113, 0.1);
      color: #2ecc71;
      border: 1px solid rgba(46, 204, 113, 0.3);
    }
    .history-status.cancelled {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }
    .history-status.completed {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border: 1px solid rgba(52, 152, 219, 0.3);
    }

    /* Scrollbar styling for modal card */
    .royal-modal-card::-webkit-scrollbar {
      width: 4px;
    }
    .royal-modal-card::-webkit-scrollbar-track {
      background: transparent;
    }
    .royal-modal-card::-webkit-scrollbar-thumb {
      background: var(--gold-primary);
      border-radius: 2px;
    }
  `;
  document.head.appendChild(styleBlock);

  // 2. Initialize the Royal Portal Navigation Widget
  setupPortalNavWidget();

  /**
   * Appends the Account/Portal trigger button into the Navbar actions bar dynamically
   */
  function setupPortalNavWidget() {
    const navActions = document.querySelector('.navbar-actions');
    if (!navActions) return;

    // Remove any existing portal trigger to avoid duplicating during hot reloads
    const existing = document.getElementById('royal-portal-btn');
    if (existing) existing.remove();

    const portalBtn = document.createElement('button');
    portalBtn.className = 'btn-outline-white';
    portalBtn.id = 'royal-portal-btn';
    portalBtn.style.padding = '0.6rem 1.2rem';
    portalBtn.style.fontSize = '0.75rem';
    portalBtn.style.marginLeft = '1rem';
    
    // Set text label based on authentication state
    const token = localStorage.getItem('rajmahal_token');
    if (token) {
      portalBtn.innerHTML = '<i class="fa-solid fa-crown" style="margin-right: 0.5rem; color: var(--gold-primary);"></i>Guest Portal';
    } else {
      portalBtn.innerHTML = '<i class="fa-solid fa-user-lock" style="margin-right: 0.5rem; color: var(--gold-primary);"></i>Login';
    }

    navActions.appendChild(portalBtn);

    portalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openGuestPortal();
    });
  }

  /**
   * Utility to render base overlay modal wrapper
   */
  function createModalContainer(title) {
    const overlay = document.createElement('div');
    overlay.className = 'royal-overlay';
    
    overlay.innerHTML = `
      <div class="royal-modal-card glass-card">
        <button class="royal-modal-close" id="close-royal-modal">&times;</button>
        <h2 class="gold-text" style="font-size: 1.8rem; margin-bottom: 2rem; text-align: center;">${title}</h2>
        <div class="modal-content-target"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fade active class transition
    setTimeout(() => overlay.classList.add('active'), 50);

    const closeBtn = overlay.querySelector('#close-royal-modal');
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 400);
    });

    return {
      overlay,
      contentTarget: overlay.querySelector('.modal-content-target'),
      closeModal: () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 400);
      }
    };
  }

  /**
   * Opens the Guest Portal, branching to login or dashboard depending on state
   */
  function openGuestPortal(onLoginSuccessCallback = null) {
    const token = localStorage.getItem('rajmahal_token');
    
    if (token) {
      // Validate token & fetch profile
      fetchUserProfile(token, onLoginSuccessCallback);
    } else {
      renderAuthFlow(onLoginSuccessCallback);
    }
  }

  /**
   * Fetch User Profile and display Dashboard
   */
  function fetchUserProfile(token, onLoginSuccessCallback) {
    const modal = createModalContainer('Royal Guest Portal');
    modal.contentTarget.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div class="preloader-mandala" style="margin: 0 auto; width: 50px; height: 50px;"></div>
        <p style="margin-top: 1.5rem; color: var(--gold-primary);">Greeting our honored resident...</p>
      </div>
    `;

    fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        renderDashboard(modal, data.data, token);
        if (onLoginSuccessCallback) onLoginSuccessCallback();
      } else {
        // Bad/expired token
        localStorage.removeItem('rajmahal_token');
        setupPortalNavWidget();
        modal.closeModal();
        renderAuthFlow(onLoginSuccessCallback);
      }
    })
    .catch(err => {
      console.error(err);
      modal.contentTarget.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: var(--text-light); margin-bottom: 1.5rem;">Could not connect to RajMahal Palace server.</p>
          <button class="btn-gold" id="retry-profile">Retry connection</button>
        </div>
      `;
      modal.overlay.querySelector('#retry-profile').addEventListener('click', () => {
        modal.closeModal();
        fetchUserProfile(token, onLoginSuccessCallback);
      });
    });
  }

  /**
   * Render Signin & Signup Interfaces
   */
  function renderAuthFlow(onLoginSuccessCallback = null, authViewMode = 'login') {
    const modal = createModalContainer(authViewMode === 'login' ? 'Palace Account Login' : 'Register Guest Account');
    
    function drawView() {
      if (authViewMode === 'login') {
        modal.contentTarget.innerHTML = `
          <form id="royal-login-form">
            <div class="royal-form-group">
              <label class="royal-form-label">Email Address</label>
              <input type="email" class="royal-form-input" placeholder="enter your email address" required id="login-email">
            </div>
            <div class="royal-form-group">
              <label class="royal-form-label">Secret Password</label>
              <input type="password" class="royal-form-input" placeholder="••••••••" required id="login-pass">
            </div>
            <div id="auth-error-msg" style="color: #e74c3c; font-size: 0.85rem; margin-bottom: 1rem; display: none; text-align: left;"></div>
            <button type="submit" class="btn-gold" style="width: 100%; margin-top: 1rem;">Authenticate</button>
            <span class="royal-toggle-link" id="goto-signup">New to RajMahal? <span>Register Account</span></span>
          </form>
        `;

        modal.overlay.querySelector('#goto-signup').addEventListener('click', () => {
          authViewMode = 'register';
          modal.overlay.querySelector('h2').textContent = 'Register Guest Account';
          drawView();
        });

        // Submit listener
        const form = modal.overlay.querySelector('#royal-login-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = modal.overlay.querySelector('#login-email').value;
          const password = modal.overlay.querySelector('#login-pass').value;
          const submitBtn = form.querySelector('.btn-gold');
          submitBtn.textContent = 'Verifying credentials...';
          submitBtn.disabled = true;

          fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              localStorage.setItem('rajmahal_token', data.data.token);
              setupPortalNavWidget();
              modal.closeModal();
              // Load profile & dashboard
              openGuestPortal(onLoginSuccessCallback);
            } else {
              showError(data.message || 'Verification failed. Please review your email and password.');
            }
          })
          .catch(err => {
            console.error(err);
            showError('Server connection timeout. Please check if your backend server is running.');
          })
          .finally(() => {
            submitBtn.textContent = 'Authenticate';
            submitBtn.disabled = false;
          });
        });
      } else {
        // Register Account view
        modal.contentTarget.innerHTML = `
          <form id="royal-signup-form">
            <div class="royal-form-group">
              <label class="royal-form-label">Full Name</label>
              <input type="text" class="royal-form-input" placeholder="e.g., Maharaja Ranjit Singh" required id="signup-name">
            </div>
            <div class="royal-form-group">
              <label class="royal-form-label">Email Address</label>
              <input type="email" class="royal-form-input" placeholder="e.g., resident@rajmahal.com" required id="signup-email">
            </div>
            <div class="royal-form-group">
              <label class="royal-form-label">Secret Password (Min 6 chars)</label>
              <input type="password" class="royal-form-input" placeholder="••••••••" required minlength="6" id="signup-pass">
            </div>
            <div id="auth-error-msg" style="color: #e74c3c; font-size: 0.85rem; margin-bottom: 1rem; display: none; text-align: left;"></div>
            <button type="submit" class="btn-gold" style="width: 100%; margin-top: 1rem;">Create Account</button>
            <span class="royal-toggle-link" id="goto-login">Have an account? <span>Login here</span></span>
          </form>
        `;

        modal.overlay.querySelector('#goto-login').addEventListener('click', () => {
          authViewMode = 'login';
          modal.overlay.querySelector('h2').textContent = 'Palace Account Login';
          drawView();
        });

        // Submit signup listener
        const form = modal.overlay.querySelector('#royal-signup-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = modal.overlay.querySelector('#signup-name').value;
          const email = modal.overlay.querySelector('#signup-email').value;
          const password = modal.overlay.querySelector('#signup-pass').value;
          const submitBtn = form.querySelector('.btn-gold');
          submitBtn.textContent = 'Enrolling resident...';
          submitBtn.disabled = true;

          fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // Registration is successful!
              // Since it sends a verification email, let's inform them beautifully.
              modal.contentTarget.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 0;">
                  <i class="fa-regular fa-circle-check" style="font-size: 4rem; color: #2ecc71; margin-bottom: 1.5rem;"></i>
                  <h3 class="gold-text" style="font-size: 1.5rem; margin-bottom: 1rem;">Pranam & Welcome</h3>
                  <p style="color: var(--text-light); margin-bottom: 1.5rem;">Your royal guest profile has been successfully enrolled.</p>
                  <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
                    A verification link was dispatched to <strong style="color: var(--gold-primary);">${email}</strong>. For your testing convenience, your account has been automatically auto-verified so you can reserve immediately!
                  </p>
                  <button class="btn-gold" id="continue-signup-login">Continue stay booking</button>
                </div>
              `;

              modal.overlay.querySelector('#continue-signup-login').addEventListener('click', () => {
                // Auto login after signup
                fetch(`${API_BASE_URL}/auth/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                })
                .then(r => r.json())
                .then(loginData => {
                  if (loginData.success) {
                    localStorage.setItem('rajmahal_token', loginData.data.token);
                    setupPortalNavWidget();
                    modal.closeModal();
                    openGuestPortal(onLoginSuccessCallback);
                  } else {
                    modal.closeModal();
                    renderAuthFlow(onLoginSuccessCallback, 'login');
                  }
                });
              });
            } else {
              showError(data.message || 'Registration failed. Email address may already be in use.');
            }
          })
          .catch(err => {
            console.error(err);
            showError('Server connection timeout. Please verify backend state.');
          })
          .finally(() => {
            submitBtn.textContent = 'Create Account';
            submitBtn.disabled = false;
          });
        });
      }
    }

    function showError(msg) {
      const errBox = modal.overlay.querySelector('#auth-error-msg');
      if (errBox) {
        errBox.textContent = msg;
        errBox.style.display = 'block';
      }
    }

    drawView();
  }

  /**
   * Render User Dashboard & Booking History
   */
  function renderDashboard(modal, user, token) {
    modal.overlay.querySelector('h2').textContent = `Pranam, ${user.name}`;
    
    modal.contentTarget.innerHTML = `
      <div style="border-bottom: 1px solid rgba(212,175,55,0.15); padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
        <div>
          <div><strong style="color: var(--gold-primary);">Email Address:</strong> ${user.email}</div>
          <div style="margin-top: 0.3rem;"><strong style="color: var(--gold-primary);">Resident Tier:</strong> Imperial Member (${user.role.toUpperCase()})</div>
        </div>
        <button class="btn-outline-white" id="logout-btn" style="padding: 0.4rem 1rem; font-size: 0.7rem;">Log Out</button>
      </div>

      <h3 style="font-size: 1.1rem; margin-bottom: 1.5rem; text-align: left; letter-spacing: 0.15em;">Your Palace Reservations</h3>
      <div id="booking-history-container" style="min-height: 150px;">
        <div style="text-align: center; padding: 2rem;">
          <div class="preloader-mandala" style="margin: 0 auto; width: 40px; height: 40px;"></div>
          <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;">Retrieving reservation chronicles...</p>
        </div>
      </div>
    `;

    // Logout click
    modal.overlay.querySelector('#logout-btn').addEventListener('click', () => {
      localStorage.removeItem('rajmahal_token');
      setupPortalNavWidget();
      modal.closeModal();
    });

    // Load booking history
    const historyContainer = modal.overlay.querySelector('#booking-history-container');
    fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.count === 0) {
          historyContainer.innerHTML = `
            <div style="text-align: center; padding: 2.5rem; border: 1px dashed rgba(212,175,55,0.15); border-radius: 4px;">
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">"No current luxury reservations are recorded under your lineage."</p>
              <button class="btn-gold" id="close-portal-go-book" style="font-size: 0.75rem; padding: 0.6rem 1.2rem;">Explore Rooms</button>
            </div>
          `;
          modal.overlay.querySelector('#close-portal-go-book').addEventListener('click', () => {
            modal.closeModal();
            const roomsSection = document.querySelector('.rooms-section');
            if (roomsSection) {
              roomsSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.href = 'rooms.html';
            }
          });
        } else {
          renderBookingItems(data.data);
        }
      } else {
        historyContainer.innerHTML = `<p style="color: #e74c3c; font-size: 0.85rem;">Failed to fetch history details.</p>`;
      }
    })
    .catch(err => {
      console.error(err);
      historyContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Backend connection offline. Could not retrieve stay chronicles.</p>`;
    });

    function renderBookingItems(bookings) {
      historyContainer.innerHTML = '';
      bookings.forEach(booking => {
        const checkin = new Date(booking.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const checkout = new Date(booking.checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const card = document.createElement('div');
        card.className = 'booking-history-item';
        card.innerHTML = `
          <div>
            <div class="history-meta-title">${booking.room.name} <span style="font-size: 0.8rem; color: var(--gold-primary); font-family: var(--font-royal); margin-left: 0.5rem;">[No. ${booking.room.roomNumber}]</span></div>
            <div class="history-meta-dates"><i class="fa-regular fa-calendar-days" style="margin-right: 0.5rem; color: var(--gold-primary);"></i>${checkin} &mdash; ${checkout}</div>
            <div class="history-meta-price"><strong style="color: var(--white);">Rate Price:</strong> ₹${booking.totalPrice.toLocaleString('en-IN')} (${booking.guests.adults} Adults, ${booking.guests.children} Children)</div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-end;">
            <span class="history-status ${booking.status}">${booking.status}</span>
            ${booking.status === 'confirmed' ? `<button class="btn-outline-white cancel-stay-btn" data-id="${booking._id}" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; color: #e74c3c; border-color: rgba(231,76,60,0.25);">Cancel Stay</button>` : ''}
          </div>
        `;

        historyContainer.appendChild(card);
      });

      // Cancellation click binding
      historyContainer.querySelectorAll('.cancel-stay-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bookingId = btn.dataset.id;
          if (confirm("Are you absolutely sure you want to cancel this royal suite booking?")) {
            btn.textContent = 'Releasing...';
            btn.disabled = true;

            fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                alert("Pranam. Your stay reservation has been cancelled, and dates have been released back into palace availability.");
                // Reload profile with refreshed list
                modal.closeModal();
                openGuestPortal();
              } else {
                alert(`Cancellation failed: ${data.message}`);
                btn.textContent = 'Cancel Stay';
                btn.disabled = false;
              }
            })
            .catch(err => {
              console.error(err);
              alert("Network error occurred. Could not transmit cancellation command.");
              btn.textContent = 'Cancel Stay';
              btn.disabled = false;
            });
          }
        });
      });
    }
  }

  /**
   * INTERCEPTOR: Handle reservation submissions from the home or room page booking form
   */
  window.handleBookingInquiry = function(checkin, checkout, adults, children, selectedSuiteClass) {
    const modal = createModalContainer('Searching Available Chambers');
    modal.contentTarget.innerHTML = `
      <div style="text-align: center; padding: 3rem 0;">
        <div class="preloader-mandala" style="margin: 0 auto; width: 60px; height: 60px;"></div>
        <p style="margin-top: 1.5rem; color: var(--gold-primary); font-family: var(--font-serif); font-style: italic;">
          "Checking vacant palace sanctuaries for stay dates..."
        </p>
      </div>
    `;

    // Query availability
    fetch(`${API_BASE_URL}/rooms/check-availability?checkIn=${checkin}&checkOut=${checkout}`, {
      method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Filter based on selected suite class from dropdown
        let rooms = data.data;
        if (selectedSuiteClass !== 'all') {
          if (selectedSuiteClass === 'maharani') {
            rooms = rooms.filter(r => r.name.toLowerCase().includes('maharani'));
          } else if (selectedSuiteClass === 'royal') {
            rooms = rooms.filter(r => r.name.toLowerCase().includes('royal') || r.name.toLowerCase().includes('maharaja'));
          } else if (selectedSuiteClass === 'palace') {
            rooms = rooms.filter(r => r.type === 'villa' || r.name.toLowerCase().includes('villa') || r.name.toLowerCase().includes('pavilion'));
          }
        }

        if (rooms.length === 0) {
          modal.contentTarget.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <p style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 1.5rem; font-family: var(--font-serif); font-style: italic;">
                "We regret to inform you that no premium chambers matching your selections are vacant for these stay dates."
              </p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2.5rem;">
                Please select different dates or customize your accommodation specifications.
              </p>
              <button class="btn-gold" id="close-no-rooms">Modify Stay Dates</button>
            </div>
          `;
          modal.overlay.querySelector('#close-no-rooms').addEventListener('click', () => modal.closeModal());
        } else {
          // Render available rooms list
          modal.overlay.querySelector('h2').textContent = 'Chambers Found Vacant';
          modal.contentTarget.innerHTML = `
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem; text-align: left;">
              The following luxury chambers are available from <strong style="color: var(--gold-primary);">${checkin}</strong> to <strong style="color: var(--gold-primary);">${checkout}</strong>:
            </p>
            <div style="max-height: 45vh; overflow-y: auto; margin-bottom: 2rem; border: 1px solid rgba(212,175,55,0.1); border-radius: 4px;">
              ${rooms.map(room => `
                <div class="avail-room-row">
                  <img src="${room.images[0]}" class="avail-room-img" alt="${room.name}">
                  <div>
                    <div class="avail-room-name">${room.name}</div>
                    <div class="avail-room-meta">${room.description.substring(0, 85)}...</div>
                    <div style="margin-top: 0.4rem; font-size: 0.75rem; color: var(--gold-primary);"><i class="fa-solid fa-expand" style="margin-right: 0.3rem;"></i>Capacity: Up to ${room.maxGuests} Guests</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="avail-room-price">₹${room.pricePerNight.toLocaleString('en-IN')}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.8rem;">/ night</div>
                    <button class="btn-gold select-suite-btn" data-room-id="${room._id}" data-room-name="${room.name}" style="padding: 0.4rem 0.8rem; font-size: 0.65rem;">Book Suite</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          // Handle "Book Suite" click
          modal.overlay.querySelectorAll('.select-suite-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const roomId = btn.dataset.roomId;
              const roomName = btn.dataset.roomName;
              
              modal.closeModal();
              proceedToReserve(roomId, roomName, checkin, checkout, adults, children);
            });
          });
        }
      } else {
        modal.contentTarget.innerHTML = `<p style="color: #e74c3c;">Failed to run search: ${data.message}</p>`;
      }
    })
    .catch(err => {
      console.error(err);
      modal.contentTarget.innerHTML = `
        <p style="color: var(--text-light); font-size: 0.9rem;">
          RajMahal Palace local server is offline. Could not complete live availability search.
        </p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem; font-style: italic;">
          Make sure to run your node backend server (<code>npm run dev</code> on port 5000) first.
        </p>
      `;
    });
  };

  /**
   * Proceeds to book stay after user selects room. Prompts for login if token is missing.
   */
  function proceedToReserve(roomId, roomName, checkin, checkout, adults, children) {
    const token = localStorage.getItem('rajmahal_token');
    
    if (!token) {
      // Prompt user to login or signup first
      alert(`To reserve the "${roomName}", please register or login to your guest account first. We will return you directly to your booking.`);
      renderAuthFlow(() => {
        // Callback on login success: call proceedToReserve again!
        proceedToReserve(roomId, roomName, checkin, checkout, adults, children);
      }, 'login');
    } else {
      // Authorized! Trigger Booking Creation
      const modal = createModalContainer('Preparing Royal Reservation');
      modal.contentTarget.innerHTML = `
        <div style="text-align: center; padding: 3rem 0;">
          <div class="preloader-mandala" style="margin: 0 auto; width: 60px; height: 60px;"></div>
          <p style="margin-top: 1.5rem; color: var(--gold-primary); font-family: var(--font-serif); font-style: italic;">
            "Recording your stay details into the resort chronicles..."
          </p>
        </div>
      `;

      fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId,
          checkIn: checkin,
          checkOut: checkout,
          guests: {
            adults: Number(adults),
            children: Number(children)
          },
          specialRequests: 'Exquisite flower petal greetings on arrival.'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const booking = data.data;
          
          modal.overlay.querySelector('h2').textContent = 'Stay Reserved Successfully';
          modal.contentTarget.innerHTML = `
            <div style="text-align: center; padding: 1rem 0;">
              <div class="preloader-mandala" style="margin: 0 auto 1.5rem auto; width: 70px; height: 70px;"></div>
              <h3 class="gold-text" style="font-size: 1.6rem; margin-bottom: 1rem;">Pranam! Stay Confirmed</h3>
              <p style="color: var(--text-light); margin-bottom: 1.5rem; font-family: var(--font-serif); font-style: italic;">
                "Your reservation has been recorded in the palace registers."
              </p>
              
              <div style="text-align: left; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 4px; border-left: 3px solid var(--gold-primary); font-size: 0.9rem; margin-bottom: 2rem;">
                <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Stay Chamber:</strong> ${booking.room.name} (No. ${booking.room.roomNumber})</div>
                <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Stay Period:</strong> ${new Date(booking.checkIn).toLocaleDateString()} to ${new Date(booking.checkOut).toLocaleDateString()}</div>
                <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Stay Guests:</strong> ${booking.guests.adults} Adults, ${booking.guests.children} Children</div>
                <div style="margin-bottom: 0.5rem;"><strong style="color: var(--gold-primary);">Total Price:</strong> <span style="color: var(--gold-light); font-weight: 600;">₹${booking.totalPrice.toLocaleString('en-IN')}</span> (Payment bypass activated)</div>
                <div><strong style="color: var(--gold-primary);">Reservation ID:</strong> <code style="background: rgba(0,0,0,0.5); padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 2px;">${booking._id}</code></div>
              </div>

              <div style="display: flex; gap: 1.5rem; justify-content: center;">
                <button class="btn-outline-white" id="go-to-history-btn" style="font-size: 0.75rem;">View Stay History</button>
                <button class="btn-gold" id="close-success-btn" style="font-size: 0.75rem; padding: 0.8rem 1.8rem;">Dismiss</button>
              </div>
            </div>
          `;

          modal.overlay.querySelector('#close-success-btn').addEventListener('click', () => modal.closeModal());
          modal.overlay.querySelector('#go-to-history-btn').addEventListener('click', () => {
            modal.closeModal();
            openGuestPortal();
          });
        } else {
          modal.contentTarget.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <p style="color: #e74c3c; font-size: 1.1rem; margin-bottom: 1.5rem;">"We encountered a reservation conflict."</p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
                Reason: ${data.message}
              </p>
              <button class="btn-gold" id="close-error-modal">Modify Stay Selection</button>
            </div>
          `;
          modal.overlay.querySelector('#close-error-modal').addEventListener('click', () => modal.closeModal());
        }
      })
      .catch(err => {
        console.error(err);
        modal.contentTarget.innerHTML = `<p style="color: #e74c3c;">Failed to contact the server to complete your booking. Please try again.</p>`;
      });
    }
  }
}



// Serve portrait-cropped video on mobile if available
(function () {
  const video = document.getElementById('video-back');
  const source = document.getElementById('video-source');
  if (!video || !source) return;
  if (window.innerWidth <= 768) {
    source.src = 'index/vid/video-back-vertical.mp4';
  }
  video.load();
})();

// Hero h1 word-by-word entrance
(function () {
  const h1 = document.querySelector('.hero__content h1');
  if (!h1) return;
  const words = h1.textContent.trim().split(/\s+/);
  h1.innerHTML = words.map((w, i) =>
    `<span class="word" style="animation-delay:${(0.3 + i * 0.06).toFixed(2)}s">${w}</span>`
  ).join(' ');
})();

const isMobile = window.innerWidth <= 768;

// WhatsApp CTA bubble - appare dopo 3s, dura 8s, riappare ogni 45s; X → pausa 3min
(function () {
  const bubble = document.getElementById('wa-bubble');
  const closeBtn = document.getElementById('wa-bubble-close');
  if (!bubble || !closeBtn) return;

  const SHOW_DELAY = 3000;
  const VISIBLE_FOR = 8000;
  const REPEAT_EVERY = 45000;
  const DISMISS_PAUSE = 180000;

  let hideTimer, cycleTimer;

  function showBubble() {
    bubble.classList.add('visible');
    hideTimer = setTimeout(hideBubble, VISIBLE_FOR);
  }

  function hideBubble() {
    bubble.classList.remove('visible');
  }

  function scheduleCycle(delay) {
    cycleTimer = setTimeout(function loop() {
      showBubble();
      cycleTimer = setTimeout(loop, REPEAT_EVERY);
    }, delay);
  }

  closeBtn.addEventListener('click', function () {
    clearTimeout(hideTimer);
    clearTimeout(cycleTimer);
    hideBubble();
    scheduleCycle(DISMISS_PAUSE);
  });

  scheduleCycle(SHOW_DELAY);
})();

// Parallax mobile per bg-cover
(function () {
  if (!isMobile) return;
  const bgCover = document.querySelector('.bg-cover');
  if (!bgCover) return;
  function tick() {
    const rect = bgCover.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
    bgCover.style.setProperty('--parallax', (center * 0.2) + 'px');
  }
  window.addEventListener('scroll', tick, { passive: true });
  tick();
})();

const revealObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    visible
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, i) => {
        setTimeout(() => {
          const el = entry.target;
          el.classList.add('visible');
          revealObserver.unobserve(el);
          el.addEventListener('transitionend', () => {
            el.style.willChange = 'auto';
          }, { once: true });
        }, i * 60);
      });
  },
  { threshold: 0.1, rootMargin: isMobile ? '0px 0px -30px 0px' : '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

import './css/styles.css';

// Mobile navigation
const navigationToggle = document.querySelector('.navigation-toggle');
const navigation = document.querySelector('.navigation');
const navigationIconMenu = navigationToggle?.querySelector('.icon-menu');
const navigationIconClose = navigationToggle?.querySelector('.icon-close');

/**
 * Syncs the mobile navigation's open/closed state across the toggle button
 * (aria attributes, icon swap) and the navigation panel itself.
 *
 * @param {boolean} isOpen
 * @returns {void}
 */
const setNavigationState = (isOpen) => {
  navigationToggle?.setAttribute('aria-expanded', String(isOpen));
  navigation?.classList.toggle('is-open', isOpen);

  if (!navigationToggle || !navigationIconMenu || !navigationIconClose) {
    return;
  }

  navigationToggle.setAttribute(
    'aria-label',
    isOpen ? 'Close navigation' : 'Open navigation',
  );

  navigationIconMenu.toggleAttribute('hidden', isOpen);
  navigationIconClose.toggleAttribute('hidden', !isOpen);
};

/**
 * @returns {void}
 */
const closeNavigation = () => {
  setNavigationState(false);
};

navigationToggle?.addEventListener('click', () => {
  const isExpanded =
    navigationToggle.getAttribute('aria-expanded') === 'true';

  setNavigationState(!isExpanded);
});

navigation?.addEventListener('click', (event) => {
  const navigationLink = event.target.closest('a');

  if (navigationLink) {
    closeNavigation();
  }
});

// Photo grid lightbox
const lightboxTriggers = [
  ...document.querySelectorAll('[data-lightbox-trigger]'),
];
const lightboxEntries = lightboxTriggers.map((trigger) => {
  const image = trigger.querySelector('img');

  return { src: image.src, alt: image.alt };
});

const lightbox = document.querySelector('#photo-lightbox');
const lightboxImage = lightbox?.querySelector('.lightbox__image');
const lightboxCloseButtons = [
  ...(lightbox?.querySelectorAll('[data-lightbox-close]') ?? []),
];
const lightboxPrevButton = lightbox?.querySelector(
  '[data-lightbox-prev]',
);
const lightboxNextButton = lightbox?.querySelector(
  '[data-lightbox-next]',
);

let lightboxIndex = 0;
let lightboxTrigger = null;

/**
 * @param {number} index
 * @returns {void}
 */
const renderLightboxImage = (index) => {
  const entry = lightboxEntries[index];

  if (!lightboxImage || !entry) {
    return;
  }

  lightboxIndex = index;
  lightboxImage.src = entry.src;
  lightboxImage.alt = entry.alt;
};

/**
 * @param {number} index
 * @returns {void}
 */
const openLightbox = (index) => {
  if (!lightbox) {
    return;
  }

  lightboxTrigger = document.activeElement;
  renderLightboxImage(index);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lightboxCloseButtons[0]?.focus();
};

/**
 * @returns {void}
 */
const closeLightbox = () => {
  if (!lightbox) {
    return;
  }

  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxTrigger?.focus();
};

/**
 * @returns {boolean}
 */
const isLightboxOpen = () => {
  return Boolean(lightbox?.classList.contains('is-open'));
};

/**
 * @param {number} delta
 * @returns {void}
 */
const showRelativeLightboxImage = (delta) => {
  const nextIndex =
    (lightboxIndex + delta + lightboxEntries.length) %
    lightboxEntries.length;

  renderLightboxImage(nextIndex);
};

lightboxTriggers.forEach((trigger, index) => {
  trigger.addEventListener('click', () => {
    openLightbox(index);
  });
});

lightboxCloseButtons.forEach((button) => {
  button.addEventListener('click', closeLightbox);
});

lightboxPrevButton?.addEventListener('click', () => {
  showRelativeLightboxImage(-1);
});

lightboxNextButton?.addEventListener('click', () => {
  showRelativeLightboxImage(1);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNavigation();

    if (isLightboxOpen()) {
      closeLightbox();
    }
  }

  if (isLightboxOpen() && event.key === 'ArrowLeft') {
    showRelativeLightboxImage(-1);
  }

  if (isLightboxOpen() && event.key === 'ArrowRight') {
    showRelativeLightboxImage(1);
  }
});

// Video filtering and pagination
const filterButtons = [...document.querySelectorAll('.filter-button')];
const videoCards = [...document.querySelectorAll('.video-card')];
const loadMoreButton = document.querySelector('[data-load-more-videos]');

const desktopMediaQuery = window.matchMedia('(min-width: 901px)');

const INITIAL_VISIBLE_DESKTOP = 8;
const INITIAL_VISIBLE_TABLET_MOBILE = 4;

const VIDEOS_PER_LOAD_DESKTOP = 4;
const VIDEOS_PER_LOAD_TABLET_MOBILE = 2;

let activeCategory = 'all';

/**
 * @returns {number} How many matching video cards should be visible before
 *   any "Load More" clicks, based on the current viewport.
 */
const getInitialVisibleCount = () => {
  return desktopMediaQuery.matches
    ? INITIAL_VISIBLE_DESKTOP
    : INITIAL_VISIBLE_TABLET_MOBILE;
};

/**
 * @returns {number} How many additional video cards each "Load More" click
 *   reveals, based on the current viewport.
 */
const getVideosPerLoad = () => {
  return desktopMediaQuery.matches
    ? VIDEOS_PER_LOAD_DESKTOP
    : VIDEOS_PER_LOAD_TABLET_MOBILE;
};

let visibleVideoCount = getInitialVisibleCount();

/**
 * @returns {HTMLElement[]} Video cards matching the active category filter.
 */
const getMatchingVideoCards = () => {
  return videoCards.filter((card) => {
    return (
      activeCategory === 'all' ||
      card.dataset.category === activeCategory
    );
  });
};

/**
 * Upgrades a video card's `<video>` from `preload="none"` to
 * `preload="metadata"` and applies its poster, so it's ready to autoplay
 * once scrolled into view. No-ops if already preloaded.
 *
 * @param {HTMLElement} card
 * @returns {void}
 */
const preloadVideo = (card) => {
  const video = card.querySelector('.portfolio-video');

  if (!video || video.preload !== 'none') {
    return;
  }

  const posterUrl = video.dataset.poster;

  if (posterUrl) {
    video.poster = posterUrl;
  }

  video.preload = 'metadata';
  video.load();
};

/**
 * Shows/hides video cards based on the active category and current
 * pagination limit, and updates the "Load More" button's label/disabled
 * state. Newly-shown cards are picked up by `preloadObserver` once they're
 * actually near the viewport.
 *
 * @returns {void}
 */
const updateVideoGrid = () => {
  const matchingCards = getMatchingVideoCards();

  videoCards.forEach((card) => {
    const matchingIndex = matchingCards.indexOf(card);
    const matchesCategory = matchingIndex !== -1;
    const isWithinVisibleLimit = matchingIndex < visibleVideoCount;
    const shouldShow = matchesCategory && isWithinVisibleLimit;

    card.hidden = !shouldShow;

    if (!shouldShow) {
      card.querySelector('.portfolio-video')?.pause();
    }
  });

  if (!loadMoreButton) {
    return;
  }

  const hasMoreVideos = visibleVideoCount < matchingCards.length;

  loadMoreButton.disabled = !hasMoreVideos;
  loadMoreButton.classList.toggle('is-disabled', !hasMoreVideos);

  if (hasMoreVideos) {
    const remainingVideos = matchingCards.length - visibleVideoCount;
    const nextVideoCount = Math.min(
      getVideosPerLoad(),
      remainingVideos,
    );

    loadMoreButton.textContent = `Load ${nextVideoCount} More`;
  } else {
    loadMoreButton.textContent = 'All Videos Loaded';
  }
};

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter ?? 'all';
    visibleVideoCount = getInitialVisibleCount();

    filterButtons.forEach((currentButton) => {
      const isActive = currentButton === button;

      currentButton.classList.toggle('is-active', isActive);
      currentButton.setAttribute(
        'aria-pressed',
        String(isActive),
      );
    });

    updateVideoGrid();
  });
});

loadMoreButton?.addEventListener('click', () => {
  visibleVideoCount += getVideosPerLoad();
  updateVideoGrid();
});

/**
 * Resets pagination to the viewport's initial visible count when crossing
 * the desktop breakpoint, so the grid doesn't get stuck showing a
 * tablet/mobile-sized page on desktop (or vice versa).
 *
 * @returns {void}
 */
const handleViewportChange = () => {
  visibleVideoCount = getInitialVisibleCount();
  updateVideoGrid();
};

desktopMediaQuery.addEventListener(
  'change',
  handleViewportChange,
);

// Video loading and viewport playback
const portfolioVideos = document.querySelectorAll(
  '.portfolio-video',
);

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      const card = video.closest('.video-card');
      const isVisibleCard = card && !card.hidden;

      if (entry.isIntersecting && isVisibleCard) {
        video.play().catch(() => {
          // Muted autoplay can still be blocked by browser settings.
        });
      } else {
        video.pause();
      }
    });
  },
  {
    threshold: 0.5,
  },
);

/**
 * Preloads a video once it scrolls near the viewport, instead of every
 * currently-paginated card preloading at page load regardless of position.
 */
const preloadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      const card = video.closest('.video-card');

      if (!entry.isIntersecting || card?.hidden) {
        return;
      }

      preloadVideo(card);
      preloadObserver.unobserve(video);
    });
  },
  {
    rootMargin: '800px 0px',
    threshold: 0,
  },
);

portfolioVideos.forEach((video) => {
  videoObserver.observe(video);
  preloadObserver.observe(video);
});

updateVideoGrid();

// Footer year
const currentYear = document.querySelector(
  '[data-current-year]',
);

if (currentYear) {
  currentYear.textContent = String(
    new Date().getFullYear(),
  );
}

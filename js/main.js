/**
 * main.js
 * Handles custom cursor, lazy loading, and interactive elements.
 */

window.isYouTubeAPIReady = false;
window.onYouTubeIframeAPIReady = () => {
    window.isYouTubeAPIReady = true;
    if (window.portfolioApp) {
        window.portfolioApp.initYouTubePlayers();
    }
};

// Dynamically load the YouTube Iframe API to avoid async execution race conditions
const ytScript = document.createElement('script');
ytScript.src = "https://www.youtube.com/iframe_api";
const firstScript = document.getElementsByTagName('script')[0];
if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(ytScript, firstScript);
} else {
    document.head.appendChild(ytScript);
}

class App {
    constructor() {
        this.cursorDot = document.querySelector('.cursor-dot');
        this.cursorOutline = document.querySelector('.cursor-outline');

        // YouTube API Players
        this.ytPlayers = [];

        // Check if YT API already loaded
        if (window.isYouTubeAPIReady) {
            this.initYouTubePlayers();
        }

        this.init();
    }

    init() {
        this.initRandomLayout();
        this.initCursor();
        this.initLazyLoading();
        this.initLightbox();
        this.initScrollEffects();
        this.initHeroReveal();
        this.initPageSwitch();

        // Rebind hover effects on resize if needed
        window.addEventListener('resize', () => {
            this.rebindHoverEffects();
        });

        // Remove loading state on load
        window.addEventListener('load', () => {
            document.body.classList.remove('is-loading');
        });
    }

    // Navigation functionality removed for single-page architecture

    initPageSwitch() {
        const pageSwitch = document.querySelector('.page-switch');
        if (!pageSwitch) return;

        pageSwitch.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('is-active')) return;

                const href = link.getAttribute('href');
                if (!href) return;

                e.preventDefault();
                const switchingToArchives = href.includes('archives');
                pageSwitch.classList.toggle('is-switching-to-archives', switchingToArchives);
                pageSwitch.classList.toggle('is-switching-to-selected', !switchingToArchives);

                window.setTimeout(() => {
                    window.location.href = href;
                }, 260);
            });
        });
    }

    initYouTubePlayers() {
        const playerElements = document.querySelectorAll('.youtube-player');

        playerElements.forEach(el => {
            const videoId = el.dataset.videoId;
            const wrapper = el.closest('.media-container');
            const iframeWrapper = el.closest('.iframe-wrapper');

            if (iframeWrapper) {
                iframeWrapper.dataset.videoId = videoId;
            }

            const player = new YT.Player(el, {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'loop': 1,
                    'modestbranding': 1,
                    'playsinline': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'mute': 1,
                    'playlist': videoId // Required for loop to work
                },
                events: {
                    'onReady': (readyEvent) => {
                        const playerInstance = readyEvent.target;
                        // Ensure it plays and is muted
                        playerInstance.mute();
                        playerInstance.playVideo();
                        if (wrapper) {
                            wrapper.classList.add('is-loaded');
                        }

                    },
                    'onStateChange': (event) => {
                        // Fallback to force loop if playlist param acts up
                        if (event.data === YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }
                    }
                }
            });
            this.ytPlayers.push(player);
        });
    }

    initRandomLayout() {
        const gridContainer = document.querySelector('.avant-garde-grid, .archive-grid');
        if (!gridContainer) return;

        if (gridContainer.classList.contains('archive-grid')) {
            this.markGridLayoutReady(gridContainer);
            return;
        }

        const itemSelector = gridContainer.classList.contains('archive-grid') ? '.archive-item' : '.grid-item';
        const items = Array.from(gridContainer.querySelectorAll(itemSelector));
        if (items.length < 2) {
            this.markGridLayoutReady(gridContainer);
            return;
        }

        // Fisher-Yates Shuffle Algorithm
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        items.forEach(item => {
            gridContainer.appendChild(item);
        });

        this.markGridLayoutReady(gridContainer);
    }

    markGridLayoutReady(gridContainer) {
        window.requestAnimationFrame(() => {
            gridContainer.classList.add('is-layout-ready');
        });
    }

    initCursor() {
        if (!this.cursorDot || !this.cursorOutline) return;

        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows exactly
            this.cursorDot.style.left = `${posX}px`;
            this.cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay
            this.cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 150, fill: "forwards" });
        });

        this.rebindHoverEffects();
    }

    rebindHoverEffects() {
        const interactables = document.querySelectorAll('a, button, .media-container');
        const videoInteractables = document.querySelectorAll('.iframe-wrapper');

        interactables.forEach(el => {
            if (el.dataset.cursorBound === 'true') return;
            el.dataset.cursorBound = 'true';

            el.addEventListener('mouseenter', () => {
                if (this.cursorOutline) this.cursorOutline.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                if (this.cursorOutline) this.cursorOutline.classList.remove('hovering');
            });
        });

        videoInteractables.forEach(el => {
            if (el.dataset.videoCursorBound === 'true') return;
            el.dataset.videoCursorBound = 'true';

            el.addEventListener('mouseenter', () => {
                if (this.cursorDot) this.cursorDot.classList.add('video-hovering');
                if (this.cursorOutline) this.cursorOutline.classList.add('video-hovering');
            });
            el.addEventListener('mouseleave', () => {
                if (this.cursorDot) this.cursorDot.classList.remove('video-hovering');
                if (this.cursorOutline) this.cursorOutline.classList.remove('video-hovering');
            });
        });
    }

    initLazyLoading() {
        const mediaContainers = document.querySelectorAll('.media-container');

        if (!mediaContainers.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const mediaObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    this.revealMediaContainer(container);
                    observer.unobserve(container);
                }
            });
        }, observerOptions);

        mediaContainers.forEach(container => {
            mediaObserver.observe(container);
        });
    }

    revealMediaContainer(container) {
        const image = container.querySelector('img');

        if (!image) {
            window.setTimeout(() => {
                container.classList.add('is-loaded');
            }, 200);
            return;
        }

        const reveal = () => container.classList.add('is-loaded');

        if (image.complete && image.naturalWidth > 0) {
            if (typeof image.decode === 'function') {
                image.decode().then(reveal).catch(reveal);
            } else {
                reveal();
            }
            return;
        }

        image.addEventListener('load', reveal, { once: true });
        image.addEventListener('error', reveal, { once: true });
    }

    initScrollEffects() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        const fadeStart = 40;
        const fadeDistance = 440;
        let scrollFrame = null;

        const updateHeroProgress = () => {
            const progress = Math.min(Math.max((window.scrollY - fadeStart) / fadeDistance, 0), 1);
            heroContent.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
        };

        updateHeroProgress();

        window.addEventListener('scroll', () => {
            if (scrollFrame !== null) return;

            scrollFrame = window.requestAnimationFrame(() => {
                updateHeroProgress();
                scrollFrame = null;
            });
        }, { passive: true });
    }

    initHeroReveal() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        window.requestAnimationFrame(() => {
            heroContent.classList.add('is-hero-revealed');
        });
    }

    initLightbox() {
        this.lightbox = document.getElementById('imageLightbox');
        if (!this.lightbox) return;

        this.lightboxMode = 'image';
        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxContent = this.lightbox.querySelector('.lightbox-content');
        this.lightboxVideoWrapper = document.getElementById('lightboxVideoWrapper');
        this.lightboxVideo = document.getElementById('lightboxVideo');
        this.lightboxClose = document.querySelector('.lightbox-close');
        this.lightboxPrev = document.querySelector('.lightbox-prev');
        this.lightboxNext = document.querySelector('.lightbox-next');

        // Select all images inside media-containers (ignores videos/iframes)
        // Store as array for easy indexing
        this.galleryImages = Array.from(document.querySelectorAll('.media-container img'));
        this.galleryVideos = Array.from(document.querySelectorAll('.iframe-wrapper'));
        this.currentImageIndex = 0;
        this.currentVideoIndex = 0;

        this.galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.openLightbox(img.src, img.alt);
            });
        });

        this.galleryVideos.forEach((videoWrapper, index) => {
            const playerPlaceholder = videoWrapper.querySelector('.youtube-player');
            if (playerPlaceholder && playerPlaceholder.dataset.videoId) {
                videoWrapper.dataset.videoId = playerPlaceholder.dataset.videoId;
            }

            videoWrapper.addEventListener('click', () => {
                const videoId = videoWrapper.dataset.videoId;
                if (!videoId) return;

                this.currentVideoIndex = index;
                this.openVideoLightbox(videoId);
            });
        });

        // Close on button click
        this.lightboxClose.addEventListener('click', () => {
            this.closeLightbox();
        });

        // Close on clicking the dark background (but not the image itself)
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // Navigation Buttons
        if (this.lightboxPrev) {
            this.lightboxPrev.addEventListener('click', () => {
                if (this.lightboxMode === 'video') {
                    this.prevVideo();
                } else {
                    this.prevImage();
                }
            });
        }
        if (this.lightboxNext) {
            this.lightboxNext.addEventListener('click', () => {
                if (this.lightboxMode === 'video') {
                    this.nextVideo();
                } else {
                    this.nextImage();
                }
            });
        }

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('is-active')) return;

            if (e.key === 'Escape') {
                this.closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                if (this.lightboxMode === 'video') {
                    this.prevVideo();
                } else {
                    this.prevImage();
                }
            } else if (e.key === 'ArrowRight') {
                if (this.lightboxMode === 'video') {
                    this.nextVideo();
                } else {
                    this.nextImage();
                }
            }
        });

    }

    openLightbox(src, alt) {
        if (!this.lightbox || !this.lightboxImage) return;

        this.lightboxMode = 'image';
        if (this.lightboxContent) this.lightboxContent.classList.remove('is-video');
        if (this.lightboxVideo) this.lightboxVideo.src = '';

        // Set source early so it begins rendering
        this.lightboxImage.src = src;
        this.lightboxImage.alt = alt || "Fullscreen Image";

        // Show lightbox
        this.lightbox.classList.add('is-active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    openVideoLightbox(videoId) {
        if (!this.lightbox || !this.lightboxVideo) return;

        this.lightboxMode = 'video';
        if (this.lightboxContent) this.lightboxContent.classList.add('is-video');
        if (this.lightboxImage) this.lightboxImage.src = '';

        this.ytPlayers.forEach(player => {
            if (player && typeof player.pauseVideo === 'function') {
                player.pauseVideo();
            }
        });

        this.lightboxVideo.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
        this.lightbox.classList.add('is-active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    prevImage() {
        if (!this.galleryImages.length) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        const prevImg = this.galleryImages[this.currentImageIndex];
        this.lightboxImage.src = prevImg.src;
        this.lightboxImage.alt = prevImg.alt;
    }

    nextImage() {
        if (!this.galleryImages.length) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
        const nextImg = this.galleryImages[this.currentImageIndex];
        this.lightboxImage.src = nextImg.src;
        this.lightboxImage.alt = nextImg.alt;
    }

    prevVideo() {
        if (!this.galleryVideos.length) return;
        this.currentVideoIndex = (this.currentVideoIndex - 1 + this.galleryVideos.length) % this.galleryVideos.length;
        const prevVideoId = this.galleryVideos[this.currentVideoIndex].dataset.videoId;
        if (prevVideoId) this.openVideoLightbox(prevVideoId);
    }

    nextVideo() {
        if (!this.galleryVideos.length) return;
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.galleryVideos.length;
        const nextVideoId = this.galleryVideos[this.currentVideoIndex].dataset.videoId;
        if (nextVideoId) this.openVideoLightbox(nextVideoId);
    }

    closeLightbox() {
        if (!this.lightbox) return;

        this.lightbox.classList.remove('is-active');
        document.body.style.overflow = ''; // Restore scrolling
        if (this.lightboxContent) this.lightboxContent.classList.remove('is-video');
        if (this.lightboxVideo) this.lightboxVideo.src = '';
        this.resumePreviewVideos();

        // Clear src after transition so it doesn't ghost on next open
        setTimeout(() => {
            if (!this.lightbox.classList.contains('is-active')) {
                this.lightboxImage.src = '';
            }
        }, 600); // Matches var(--transition-smooth)
    }

    resumePreviewVideos() {
        this.ytPlayers.forEach(player => {
            if (!player) return;

            if (typeof player.mute === 'function') {
                player.mute();
            }

            if (typeof player.playVideo === 'function') {
                player.playVideo();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new App();
});

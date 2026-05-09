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

    initYouTubePlayers() {
        const playerElements = document.querySelectorAll('.youtube-player');

        playerElements.forEach(el => {
            const videoId = el.dataset.videoId;
            const wrapper = el.closest('.media-container');

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

                        // Create custom control bar overlay
                        const controlsOverlay = document.createElement('div');
                        controlsOverlay.className = 'yt-custom-controls';

                        // Play/Pause Button
                        const playBtn = document.createElement('button');
                        playBtn.className = 'yt-btn play-btn';
                        playBtn.textContent = 'pause'; // Starts playing

                        playBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const state = playerInstance.getPlayerState();
                            if (state === YT.PlayerState.PLAYING) {
                                playerInstance.pauseVideo();
                                playBtn.textContent = 'play';
                            } else {
                                playerInstance.playVideo();
                                playBtn.textContent = 'pause';
                            }
                        });

                        // Mute/Unmute Button
                        const muteBtn = document.createElement('button');
                        muteBtn.className = 'yt-btn mute-btn';
                        muteBtn.textContent = 'unmute'; // Starts muted

                        muteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (playerInstance.isMuted()) {
                                playerInstance.unMute();
                                muteBtn.textContent = 'mute';
                            } else {
                                playerInstance.mute();
                                muteBtn.textContent = 'unmute';
                            }
                        });

                        // External YouTube Link
                        const ytLink = document.createElement('a');
                        ytLink.className = 'yt-btn yt-link';
                        ytLink.textContent = 'youtube ↗';
                        ytLink.href = `https://www.youtube.com/watch?v=${videoId}`;
                        ytLink.target = '_blank';
                        ytLink.rel = 'noopener noreferrer';

                        // Prevent link click from affecting the iframe wrapper
                        ytLink.addEventListener('click', (e) => e.stopPropagation());

                        controlsOverlay.appendChild(playBtn);
                        controlsOverlay.appendChild(muteBtn);
                        controlsOverlay.appendChild(ytLink);

                        // Use the new iframe element to find the wrapper, because the 
                        // original 'el' div was destroyed by the YouTube API
                        const playerIframe = playerInstance.getIframe();
                        const iframeWrapper = playerIframe ? playerIframe.closest('.iframe-wrapper') : null;

                        if (iframeWrapper) {
                            iframeWrapper.appendChild(controlsOverlay);
                        }
                    },
                    'onStateChange': (event) => {
                        // Fallback to force loop if playlist param acts up
                        if (event.data === YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }

                        // Sync play button state if video pauses/plays externally or buffering
                        const wrapper = event.target.getIframe().closest('.iframe-wrapper');
                        if (wrapper) {
                            const playBtn = wrapper.querySelector('.play-btn');
                            if (playBtn) {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    playBtn.textContent = 'pause';
                                } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                                    playBtn.textContent = 'play';
                                }
                            }
                        }
                    }
                }
            });
            this.ytPlayers.push(player);
        });
    }

    initRandomLayout() {
        // Find the main portfolio grid container
        const gridContainer = document.querySelector('.avant-garde-grid');
        if (!gridContainer) return;

        // Get all items as an array
        const items = Array.from(gridContainer.querySelectorAll('.grid-item'));

        // Fisher-Yates Shuffle Algorithm
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap in array
            [items[i], items[j]] = [items[j], items[i]];
        }

        // Re-append to DOM in the new random order
        // Note: appendChild physically moves existing elements rather than cloning them
        items.forEach(item => {
            gridContainer.appendChild(item);
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
            el.addEventListener('mouseenter', () => {
                if (this.cursorOutline) this.cursorOutline.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                if (this.cursorOutline) this.cursorOutline.classList.remove('hovering');
            });
        });

        videoInteractables.forEach(el => {
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
                    // Simulate loading delay for effect, or wait for img complete
                    setTimeout(() => {
                        container.classList.add('is-loaded');
                    }, 200);
                    observer.unobserve(container);
                }
            });
        }, observerOptions);

        mediaContainers.forEach(container => {
            mediaObserver.observe(container);
        });
    }

    initScrollEffects() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        window.addEventListener('scroll', () => {
            // Trigger the fade, blur and color inversion when scrolled down past 50px
            if (window.scrollY > 50) {
                heroContent.classList.add('is-scrolled');
            } else {
                heroContent.classList.remove('is-scrolled');
            }
        });
    }

    initLightbox() {
        this.lightbox = document.getElementById('imageLightbox');
        if (!this.lightbox) return;

        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxClose = document.querySelector('.lightbox-close');
        this.lightboxPrev = document.querySelector('.lightbox-prev');
        this.lightboxNext = document.querySelector('.lightbox-next');

        // Select all images inside media-containers (ignores videos/iframes)
        // Store as array for easy indexing
        this.galleryImages = Array.from(document.querySelectorAll('.media-container img'));
        this.currentImageIndex = 0;

        this.galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.openLightbox(img.src, img.alt);
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
            this.lightboxPrev.addEventListener('click', () => this.prevImage());
        }
        if (this.lightboxNext) {
            this.lightboxNext.addEventListener('click', () => this.nextImage());
        }

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('is-active')) return;

            if (e.key === 'Escape') {
                this.closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                this.prevImage();
            } else if (e.key === 'ArrowRight') {
                this.nextImage();
            }
        });
    }

    openLightbox(src, alt) {
        if (!this.lightbox || !this.lightboxImage) return;

        // Set source early so it begins rendering
        this.lightboxImage.src = src;
        this.lightboxImage.alt = alt || "Fullscreen Image";

        // Show lightbox
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

    closeLightbox() {
        if (!this.lightbox) return;

        this.lightbox.classList.remove('is-active');
        document.body.style.overflow = ''; // Restore scrolling

        // Clear src after transition so it doesn't ghost on next open
        setTimeout(() => {
            if (!this.lightbox.classList.contains('is-active')) {
                this.lightboxImage.src = '';
            }
        }, 600); // Matches var(--transition-smooth)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new App();
});

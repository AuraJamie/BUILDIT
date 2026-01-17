const video = document.getElementById('v0');
const spacer = document.getElementById('content-spacer');

/**
 * Premium Unified Smooth Scroll Engine (V6 - Mobile Optimized)
 * Synchronizes page scroll momentum with video scrubbing.
 */

const MAX_DURATION = 5;
const EASE_FACTOR = 0.035;

let targetY = 0;
let currentY = 0;
let maxScroll = 0;
let isInternalScroll = false; // Flag to stop feedback loops

function updateDimensions() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

// Handle Wheel for Momentum (Desktop)
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetY += e.deltaY;
    targetY = Math.max(0, Math.min(targetY, maxScroll));
}, { passive: false });

// Handle Touch for Mobile Momentum
let lastTouchY = 0;
window.addEventListener('touchstart', (e) => {
    lastTouchY = e.touches[0].pageY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].pageY;
    const deltaY = lastTouchY - touchY;

    // Prevent default to stop native mobile bouncing
    if (e.cancelable) e.preventDefault();

    targetY += deltaY * 2; // Sensitivity boost for mobile
    targetY = Math.max(0, Math.min(targetY, maxScroll));

    lastTouchY = touchY;
}, { passive: false });

// Handle Scrollbar/External Interaction
window.addEventListener('scroll', () => {
    if (isInternalScroll) return;

    // If the scroll was external (dragged scrollbar or mobile native scroll)
    const delta = Math.abs(window.scrollY - currentY);
    if (delta > 10) {
        targetY = window.scrollY;
        currentY = window.scrollY;
    }
});

// Handle Anchor Navigation
document.querySelectorAll('nav a, .logo').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            if (targetId === '#home') {
                targetY = 0;
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetY = targetElement.offsetTop;
                }
            }
        }
    });
});

function tick() {
    const diff = targetY - currentY;

    if (Math.abs(diff) > 0.1) {
        currentY += diff * EASE_FACTOR;

        isInternalScroll = true;
        window.scrollTo(0, currentY);

        // Sync Video Frame
        if (video.readyState >= 2) {
            const progress = currentY / maxScroll;
            const targetTime = progress * Math.min(video.duration || 5, MAX_DURATION);

            // Limit frequent seeks on mobile
            if (Math.abs(video.currentTime - targetTime) > 0.01) {
                video.currentTime = targetTime;
            }
        }

        // Use a timeout to ensure the scroll event caused by scrollTo is ignored
        setTimeout(() => { isInternalScroll = false; }, 10);
    } else {
        isInternalScroll = false;
    }

    requestAnimationFrame(tick);
}

// Disable browser's native scroll memory
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

// Reveal Logic
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

function init() {
    updateDimensions();
    window.scrollTo(0, 0);
    targetY = 0;
    currentY = 0;

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    if (video.readyState >= 2) {
        video.currentTime = 0;
    } else {
        video.addEventListener('loadedmetadata', () => {
            video.currentTime = 0;
        }, { once: true });
    }
}

window.addEventListener('load', init);
window.addEventListener('resize', () => {
    updateDimensions();
    targetY = Math.max(0, Math.min(targetY, maxScroll));
});

video.pause();
video.muted = true;
video.playsInline = true;

requestAnimationFrame(tick);

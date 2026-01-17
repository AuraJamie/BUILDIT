const video = document.getElementById('v0');
const spacer = document.getElementById('content-spacer');

/**
 * Premium Unified Smooth Scroll Engine (V5)
 * Synchronizes page scroll momentum with video scrubbing.
 */

const MAX_DURATION = 5;
const EASE_FACTOR = 0.035; // Reduced from 0.05 for more 'glide' and less resistance

let targetY = 0;
let currentY = 0;
let maxScroll = 0;

function updateDimensions() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
}

// Handle Wheel for Momentum
window.addEventListener('wheel', (e) => {
    e.preventDefault(); // Intercept native scroll to apply our own momentum

    // Add delta to target
    targetY += e.deltaY;

    // Clamp target
    targetY = Math.max(0, Math.min(targetY, maxScroll));
}, { passive: false });

// Handle Scrollbar Interaction (Drag)
window.addEventListener('scroll', () => {
    // If the user drags the scrollbar, we update our target to match
    // We only do this if the scroll was NOT triggered by our own engine
    const delta = Math.abs(window.scrollY - currentY);
    if (delta > 2) {
        targetY = window.scrollY;
    }
});

// Handle Anchor Navigation (Smooth Scroll to Section)
document.querySelectorAll('nav a, .logo').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');

        // Handle ID links
        if (targetId.startsWith('#')) {
            e.preventDefault();

            if (targetId === '#home') {
                targetY = 0;
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Update targetY to the element's position
                    targetY = targetElement.offsetTop;
                }
            }
        }
    });
});

function tick() {
    // Physics: Linear Interpolation (Lerp)
    // current = current + (target - current) * ease
    const diff = targetY - currentY;

    if (Math.abs(diff) > 0.1) {
        currentY += diff * EASE_FACTOR;

        // Update Window Scroll (Moves the scrollbar)
        window.scrollTo(0, currentY);

        // Sync Video Frame
        if (video.readyState >= 2) {
            const progress = currentY / maxScroll;
            const targetTime = progress * Math.min(video.duration || 5, MAX_DURATION);
            video.currentTime = targetTime;
        }
    }

    requestAnimationFrame(tick);
}

// Disable browser's native scroll memory
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

// Intersection Observer for Reveal Animations
const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Once animated, no need to observe anymore
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

// Initialization
function init() {
    updateDimensions();

    // Force reset to top
    window.scrollTo(0, 0);
    targetY = 0;
    currentY = 0;

    // Observe all reveal elements
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

// Ensure init runs after DOM and layout are ready
window.addEventListener('load', init);
window.addEventListener('resize', () => {
    updateDimensions();
    // Re-clamp targetY on resize
    targetY = Math.max(0, Math.min(targetY, maxScroll));
});

// Mobile optimization: Ensure video doesn't try to auto-play if low power mode or similar
video.pause();
video.preload = "auto";
video.muted = true;
video.playsInline = true;

// Kick off engine
requestAnimationFrame(tick);

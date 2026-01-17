const video = document.getElementById('v0');
const wrapper = document.getElementById('smooth-wrapper');
const heightProvider = document.getElementById('height-provider');

/**
 * Premium "Fixed Wrapper" Smooth Scroll Engine (V7)
 * The industry standard for robust, high-performance smooth scrolling.
 * Uses native scrolling for input (mobile friendly) but eases the visual output.
 */

const MAX_VIDEO_SCRUB = 5;
const EASE = 0.08; // Higher = more responsive, Lower = more glide

let targetY = 0;
let currentY = 0;
let maxScroll = 0;

function updateDimensions() {
    // 1. Calculate the total height of our content (main + footer)
    const mainHeight = wrapper.querySelector('main').offsetHeight;
    const footerHeight = document.getElementById('main-footer').offsetHeight;
    const contentHeight = mainHeight + footerHeight;

    // 2. Make the spacer the same height so the scrollbar exists
    heightProvider.style.height = `${contentHeight}px`;

    // 3. Define the maximum we can scroll
    maxScroll = Math.max(0, contentHeight - window.innerHeight);
}

// Native scrolling is our source of truth
window.addEventListener('scroll', () => {
    targetY = window.scrollY;
});

function tick() {
    // 1. Eased LERP calculation
    const diff = targetY - currentY;

    // Always call if there's movement, or to keep it pinned accurately
    if (Math.abs(diff) > 0.01) {
        currentY += diff * EASE;
    } else {
        currentY = targetY;
    }

    // 2. Move the VISUAL content
    wrapper.style.transform = `translate3d(0, -${currentY}px, 0)`;

    // 3. Manual Sticky Hero Effect (Pause)
    // The hero section is 150vh tall. We want the content to stay centered for the first 50vh.
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const pauseDistance = window.innerHeight * 0.5; // 50vh
        if (currentY < pauseDistance) {
            // Counter-scroll the hero content to keep it centered
            heroContent.style.transform = `translate3d(0, ${currentY}px, 0)`;
        } else {
            // Keep it at the limit
            heroContent.style.transform = `translate3d(0, ${pauseDistance}px, 0)`;
        }
    }

    // 4. Sync the Video Frame
    if (video.readyState >= 2 && maxScroll > 0) {
        const progress = currentY / maxScroll;
        const targetTime = progress * Math.min(video.duration || 5, MAX_VIDEO_SCRUB);

        // Only update if change is significant to improve performance
        if (Math.abs(video.currentTime - targetTime) > 0.01) {
            video.currentTime = targetTime;
        }
    }

    requestAnimationFrame(tick);
}

// Initial state and Resizing
window.addEventListener('load', () => {
    updateDimensions();
    // Force top
    window.scrollTo(0, 0);
    targetY = 0;
    currentY = 0;

    // Start animations
    initReveal();
});

window.addEventListener('resize', updateDimensions);

// --- Content Reveal Logic (Intersection Observer) ---
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.05, // More sensitive for mobile/scrolling
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- Video Optimization ---
video.pause();
video.muted = true;
video.playsInline = true;

// Kick off the visual loop
requestAnimationFrame(tick);

// Native anchor scrolling fix (since we use a fixed wrapper)
document.querySelectorAll('nav a, .logo').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            if (targetId === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
                }
            }
        }
    });
});

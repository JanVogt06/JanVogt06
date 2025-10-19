// Horizontal Stack Slider für Project Cards
class StackSlider {
    constructor() {
        this.cards = [];
        this.currentIndex = 0;
        this.threshold = 80; // Swipe threshold
        this.container = null;
        this.isAnimating = false;

        if (window.innerWidth <= 768) {
            this.init();
        }

        // Re-initialize on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && this.cards.length === 0) {
                this.init();
            } else if (window.innerWidth > 768) {
                this.cleanup();
            }
        });
    }

    init() {
        this.container = document.querySelector('.projects__grid');
        if (!this.container) return;

        // Transform grid into stack
        this.container.classList.add('projects__grid--stack');

        this.cards = Array.from(document.querySelectorAll('.project-card'));
        if (this.cards.length === 0) return;

        // Setup cards
        this.cards.forEach((card, index) => {
            card.classList.add('stack-card');
            this.updateCardPosition(card, index);
            this.attachSwipeListeners(card);
        });

        // Set first card as active
        this.cards[0].classList.add('stack-card--active');

        // Create indicators
        this.createIndicators();

        // Create navigation buttons
        this.createNavButtons();
    }

    updateCardPosition(card, index) {
        const offset = index - this.currentIndex;

        card.style.zIndex = this.cards.length - Math.abs(offset);

        if (offset === 0) {
            // Current card - front and center
            card.style.transform = 'translateY(-50%) translateX(0) scale(1)';
            card.style.opacity = '1';
            card.classList.add('stack-card--active');
        } else if (offset > 0) {
            // Cards to the right (next cards)
            card.style.transform = `translateY(-50%) translateX(${30 * offset}px) scale(${1 - offset * 0.05})`;
            card.style.opacity = '0.6';
            card.classList.remove('stack-card--active');
        } else {
            // Cards to the left (previous cards)
            card.style.transform = `translateY(-50%) translateX(${30 * offset}px) scale(${1 + offset * 0.05})`;
            card.style.opacity = '0.6';
            card.classList.remove('stack-card--active');
        }
    }

    attachSwipeListeners(card) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;

        const onTouchStart = (e) => {
            if (this.isAnimating) return;

            isDragging = true;
            startX = e.touches[0].clientX;
            startTime = Date.now();

            card.style.transition = 'none';
            this.cards.forEach(c => c.style.transition = 'none');
        };

        const onTouchMove = (e) => {
            if (!isDragging || this.isAnimating) return;

            currentX = e.touches[0].clientX - startX;

            // Update all cards during drag
            this.cards.forEach((c, index) => {
                const offset = index - this.currentIndex;
                const dragOffset = -currentX * 0.5; // Invert and dampen movement

                if (offset === 0) {
                    c.style.transform = `translateY(-50%) translateX(${currentX}px) scale(1)`;
                } else {
                    c.style.transform = `translateY(-50%) translateX(${30 * offset + dragOffset}px) scale(${1 - Math.abs(offset) * 0.05})`;
                }
            });
        };

        const onTouchEnd = () => {
            if (!isDragging || this.isAnimating) return;

            isDragging = false;
            const swipeTime = Date.now() - startTime;
            const velocity = Math.abs(currentX) / swipeTime; // px per ms

            // Apply transitions
            this.cards.forEach(c => {
                c.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
            });

            // Determine if swipe threshold is met
            const isSwipe = Math.abs(currentX) > this.threshold || velocity > 0.5;

            if (isSwipe) {
                if (currentX < 0) {
                    // Swiped left - next card
                    this.next();
                } else {
                    // Swiped right - previous card
                    this.previous();
                }
            } else {
                // Return to current position
                this.updateAllCards();
            }

            currentX = 0;
        };

        card.addEventListener('touchstart', onTouchStart, { passive: true });
        card.addEventListener('touchmove', onTouchMove, { passive: true });
        card.addEventListener('touchend', onTouchEnd);
    }

    next() {
        if (this.isAnimating || this.currentIndex >= this.cards.length - 1) {
            this.updateAllCards();
            return;
        }

        this.isAnimating = true;
        this.currentIndex++;
        this.updateAllCards();

        setTimeout(() => {
            this.isAnimating = false;
        }, 400);

        this.updateIndicators();
    }

    previous() {
        if (this.isAnimating || this.currentIndex <= 0) {
            this.updateAllCards();
            return;
        }

        this.isAnimating = true;
        this.currentIndex--;
        this.updateAllCards();

        setTimeout(() => {
            this.isAnimating = false;
        }, 400);

        this.updateIndicators();
    }

    updateAllCards() {
        this.cards.forEach((card, index) => {
            this.updateCardPosition(card, index);
        });
    }

    createIndicators() {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'stack-indicators';

        this.cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'stack-indicator';
            if (index === 0) dot.classList.add('stack-indicator--active');

            // Make dots clickable
            dot.addEventListener('click', () => {
                if (!this.isAnimating && index !== this.currentIndex) {
                    this.goToIndex(index);
                }
            });

            indicatorContainer.appendChild(dot);
        });

        this.container.parentElement.appendChild(indicatorContainer);
        this.indicatorContainer = indicatorContainer;
    }

    goToIndex(targetIndex) {
        if (this.isAnimating || targetIndex === this.currentIndex) return;

        this.isAnimating = true;
        this.currentIndex = targetIndex;

        this.cards.forEach(c => {
            c.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
        });

        this.updateAllCards();
        this.updateIndicators();

        setTimeout(() => {
            this.isAnimating = false;
        }, 400);
    }

    createNavButtons() {
        const navContainer = document.createElement('div');
        navContainer.className = 'stack-nav';
        navContainer.innerHTML = `
            <button class="stack-nav__btn stack-nav__btn--prev" aria-label="Vorherige">
                <i data-lucide="chevron-left"></i>
            </button>
            <span class="stack-nav__counter">
                <span class="stack-nav__current">1</span> / ${this.cards.length}
            </span>
            <button class="stack-nav__btn stack-nav__btn--next" aria-label="Nächste">
                <i data-lucide="chevron-right"></i>
            </button>
        `;

        this.container.parentElement.appendChild(navContainer);

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // Add event listeners
        const prevBtn = navContainer.querySelector('.stack-nav__btn--prev');
        const nextBtn = navContainer.querySelector('.stack-nav__btn--next');
        this.counterElement = navContainer.querySelector('.stack-nav__current');

        prevBtn.addEventListener('click', () => this.previous());
        nextBtn.addEventListener('click', () => this.next());

        this.navContainer = navContainer;
        this.updateCounter();
    }

    updateCounter() {
        if (this.counterElement) {
            this.counterElement.textContent = this.currentIndex + 1;
        }

        // Update button states
        const prevBtn = this.navContainer.querySelector('.stack-nav__btn--prev');
        const nextBtn = this.navContainer.querySelector('.stack-nav__btn--next');

        if (this.currentIndex === 0) {
            prevBtn.classList.add('stack-nav__btn--disabled');
        } else {
            prevBtn.classList.remove('stack-nav__btn--disabled');
        }

        if (this.currentIndex === this.cards.length - 1) {
            nextBtn.classList.add('stack-nav__btn--disabled');
        } else {
            nextBtn.classList.remove('stack-nav__btn--disabled');
        }
    }

    updateIndicators() {
        const indicators = this.indicatorContainer.querySelectorAll('.stack-indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('stack-indicator--active');
            } else {
                indicator.classList.remove('stack-indicator--active');
            }
        });

        this.updateCounter();
    }

    cleanup() {
        if (this.container) {
            this.container.classList.remove('projects__grid--stack');
        }

        this.cards.forEach(card => {
            card.classList.remove('stack-card', 'stack-card--active');
            card.style.transform = '';
            card.style.opacity = '';
            card.style.zIndex = '';
            card.style.transition = '';
        });

        this.indicatorContainer?.remove();
        this.navContainer?.remove();

        this.cards = [];
        this.currentIndex = 0;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new StackSlider();
});
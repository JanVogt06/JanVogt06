// Terminal System
class Terminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.hint = document.querySelector('.terminal-hint');

        this.init();
    }

    init() {
        // Terminal mit Ctrl+K öffnen/schließen
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // ESC zum Schließen
            if (e.key === 'Escape' && this.isActive()) {
                this.close();
            }
        });

        // macOS Close Button (rot)
        const closeBtn = document.querySelector('.terminal__btn--close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Click außerhalb des Fensters schließt Terminal
        this.terminal.addEventListener('click', (e) => {
            if (e.target === this.terminal) {
                this.close();
            }
        });

        // Hint klickbar machen
        if (this.hint) {
            this.hint.addEventListener('click', () => {
                this.open();
            });
        }
    }

    toggle() {
        if (this.isActive()) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.terminal.classList.remove('terminal--closing');
        this.terminal.classList.add('terminal--active');
        this.input.focus();

        // Hint verstecken
        if (this.hint) {
            this.hint.classList.add('terminal-hint--hidden');
        }
    }

    close() {
        this.terminal.classList.add('terminal--closing');

        setTimeout(() => {
            this.terminal.classList.remove('terminal--active');
            this.terminal.classList.remove('terminal--closing');

            // Hint wieder zeigen
            if (this.hint) {
                this.hint.classList.remove('terminal-hint--hidden');
            }
        }, 200);
    }

    isActive() {
        return this.terminal.classList.contains('terminal--active');
    }
}

// Terminal initialisieren
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});
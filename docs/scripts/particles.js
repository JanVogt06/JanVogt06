// Partikel-System für Home Section
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.particleCount = window.innerWidth > 768 ? 125 : 0; // Entferne Partikel auf Mobile

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    setupEventListeners() {
        // Maus-Tracking
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Touch-Support für Mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        });

        // Resize Handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createParticles(); // Partikel neu erstellen bei Resize
        });
    }

    connectParticles() {
        const maxDistance = window.innerWidth > 768 ? 150 : 100; // Kleinere Verbindungsdistanz auf Mobile

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = 0.15 * (1 - distance / maxDistance);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update(this.mouseX, this.mouseY);
            particle.draw(this.ctx);
        });

        this.connectParticles();
        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.originalSpeedX = this.speedX;
        this.originalSpeedY = this.speedY;
    }

    update(mouseX, mouseY) {
        // Basis-Bewegung
        this.x += this.speedX;
        this.y += this.speedY;

        // Maus-Interaktion mit sanftem Übergang
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const forceX = (dx / distance) * force * 3;
            const forceY = (dy / distance) * force * 3;

            // Sanfte Abstoßung
            this.speedX -= forceX * 0.02;
            this.speedY -= forceY * 0.02;
        } else {
            // Zurück zur Original-Geschwindigkeit
            this.speedX += (this.originalSpeedX - this.speedX) * 0.05;
            this.speedY += (this.originalSpeedY - this.speedY) * 0.05;
        }

        // Geschwindigkeitsbegrenzung
        const maxSpeed = 2;
        const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (currentSpeed > maxSpeed) {
            this.speedX = (this.speedX / currentSpeed) * maxSpeed;
            this.speedY = (this.speedY / currentSpeed) * maxSpeed;
        }

        // Wrap around screen edges
        if (this.x < -50) this.x = this.canvas.width + 50;
        if (this.x > this.canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = this.canvas.height + 50;
        if (this.y > this.canvas.height + 50) this.y = -50;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    // Nur initialisieren wenn Canvas existiert
    if (document.getElementById('particles-canvas')) {
        new ParticleSystem('particles-canvas');
    }
});
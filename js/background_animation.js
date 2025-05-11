// Site/portfolio/js/background_animation.js
const bgCanvas = document.getElementById('backgroundCanvas');
const bgCtx = bgCanvas.getContext('2d');
let bgWidth = bgCanvas.width = window.innerWidth;
let bgHeight = bgCanvas.height = window.innerHeight;

// Define colors for the single dark theme
const particleColor = 'rgba(180, 210, 240, 0.25)';
const constellationLineColor = 'rgba(180, 210, 240, 0.08)';

const numParticles = 100; // Reduced for subtlety
let particles = [];
let constellations = [];
const constellationChance = 0.0015; // Reduced chance
const constellationDuration = 180; // Slightly longer life
const constellationMaxParticles = 4; // Fewer particles per constellation
const constellationConnectDistance = 120;


// Removed updateThemeColorsForBackground function as it's no longer needed

function Particle() {
    this.x = Math.random() * bgWidth;
    this.y = Math.random() * bgHeight;
    this.vx = (Math.random() - 0.5) * 0.10; // Even slower drift
    this.vy = (Math.random() - 0.5) * 0.10;
    this.radius = Math.random() * 0.8 + 0.4; // Even tinier particles

    this.draw = function() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = particleColor;
        bgCtx.fill();
    }

    this.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.radius) this.x = bgWidth + this.radius;
        if (this.x > bgWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = bgHeight + this.radius;
        if (this.y > bgHeight + this.radius) this.y = -this.radius;
    }
}

function Constellation() {
    this.particles = [];
    this.life = constellationDuration;
    this.maxLife = constellationDuration;

    let availableParticles = [...particles];
    for(let i=0; i < Math.min(constellationMaxParticles, availableParticles.length); i++) {
        if (availableParticles.length === 0) break;
        const pIndex = Math.floor(Math.random() * availableParticles.length);
        this.particles.push(availableParticles[pIndex]);
        availableParticles.splice(pIndex, 1); 
    }

    this.draw = function() {
        if (this.particles.length < 2) return;
        
        const alphaFactor = Math.sin(( (this.maxLife - this.life) / this.maxLife) * Math.PI); // Fade in and out

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                
                if (dist < constellationConnectDistance) { 
                    bgCtx.beginPath();
                    bgCtx.moveTo(p1.x, p1.y);
                    bgCtx.lineTo(p2.x, p2.y);
                    // Manually construct rgba string to include dynamic alphaFactor
                    const colorParts = constellationLineColor.match(/[\d.]+/g); // Extract numbers
                    if (colorParts && colorParts.length >= 3) {
                         bgCtx.strokeStyle = `rgba(${colorParts[0]}, ${colorParts[1]}, ${colorParts[2]}, ${parseFloat(colorParts[3] || 0.08) * alphaFactor})`; // Use default alpha if not present
                    } else {
                         bgCtx.strokeStyle = constellationLineColor; // Fallback
                    }
                    bgCtx.lineWidth = 0.3; // Thinner lines
                    bgCtx.stroke();
                }
            }
        }
    }

    this.update = function() {
        this.life--;
    }
}

function initBgAnimation() {
    bgWidth = bgCanvas.width = window.innerWidth;
    bgHeight = bgCanvas.height = window.innerHeight;
    // updateThemeColorsForBackground(); // No longer needed
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
    constellations = []; 
}

function animateBg() {
    bgCtx.clearRect(0, 0, bgWidth, bgHeight);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    if (Math.random() < constellationChance && constellations.length < 2) {
        constellations.push(new Constellation());
    }

    for (let i = constellations.length - 1; i >= 0; i--) {
        const c = constellations[i];
        c.update();
        if (c.life <= 0) {
            constellations.splice(i, 1);
        } else {
            c.draw();
        }
    }
    requestAnimationFrame(animateBg);
}

window.addEventListener('resize', initBgAnimation);

// Initial setup
if (bgCanvas) { // Ensure canvas exists
    initBgAnimation();
    animateBg();

    // Removed event listener for themeChanged
} else {
    console.error("Background canvas not found for animation.");
}
// ============================================
// THREE.JS 3D Coin Setup
// ============================================

let scene, camera, renderer, coin;
let mouseX = 0, mouseY = 0;
let targetRotationX = 1.35, targetRotationY = 0.06;
let isDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyTextureMode(theme) {
    const mode = theme === 'dark' ? 'deep' : 'soft';
    document.body.setAttribute('data-texture', mode);
}

function setupBrandFlow() {
    const track = document.getElementById('brandFlowTrack');
    if (!track) return;

    const items = Array.from(track.querySelectorAll('.brand-flow-item'));
    if (items.length < 2) return;

    let activeIndex = items.findIndex(item => item.classList.contains('is-active'));
    if (activeIndex < 0) activeIndex = 0;

    window.setInterval(() => {
        const prev = items[activeIndex];
        activeIndex = (activeIndex + 1) % items.length;
        const next = items[activeIndex];

        prev.classList.remove('is-active');
        next.classList.add('is-active');
        track.classList.add('is-advancing');

        // Sync the 3D hero coin with brand flow changes for a cinematic handoff.
        targetRotationY = Math.max(-0.95, Math.min(0.95, targetRotationY + 0.18));

        window.setTimeout(() => {
            track.classList.remove('is-advancing');
        }, 700);
    }, prefersReducedMotion ? 5600 : 3800);
}

function setupProductTheater() {
    const cards = Array.from(document.querySelectorAll('.service-item'));
    if (!cards.length) return;

    const closeAll = (exceptCard = null) => {
        cards.forEach(card => {
            if (exceptCard && card === exceptCard) return;
            card.classList.remove('is-theater-open');
            const panel = card.querySelector('.product-theater');
            const button = card.querySelector('.theater-toggle');
            if (panel) panel.setAttribute('aria-hidden', 'true');
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    };

    cards.forEach(card => {
        const panel = card.querySelector('.product-theater');
        const button = card.querySelector('.theater-toggle');
        if (!panel || !button) return;

        button.addEventListener('click', () => {
            const willOpen = !card.classList.contains('is-theater-open');
            closeAll(willOpen ? card : null);
            card.classList.toggle('is-theater-open', willOpen);
            panel.setAttribute('aria-hidden', String(!willOpen));
            button.setAttribute('aria-expanded', String(willOpen));
        });

        if (!isCoarsePointer) {
            card.addEventListener('mouseenter', () => {
                closeAll(card);
                card.classList.add('is-theater-open');
                panel.setAttribute('aria-hidden', 'false');
                button.setAttribute('aria-expanded', 'true');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('is-theater-open');
                panel.setAttribute('aria-hidden', 'true');
                button.setAttribute('aria-expanded', 'false');
            });
        }
    });
}

function setupSectionTitleStory() {
    const titles = Array.from(document.querySelectorAll('.section-title'));
    if (!titles.length) return;

    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
            }
        });
    }, { threshold: 0.25 });

    titles.forEach(title => titleObserver.observe(title));

    const updateTitleFocus = () => {
        const viewportMid = window.innerHeight * 0.42;
        titles.forEach(title => {
            const rect = title.getBoundingClientRect();
            const titleMid = rect.top + (rect.height / 2);
            const distance = Math.abs(titleMid - viewportMid);
            const normalized = 1 - Math.min(distance / (window.innerHeight * 0.7), 1);
            title.style.setProperty('--title-focus', normalized.toFixed(3));
        });
    };

    updateTitleFocus();
    window.addEventListener('scroll', updateTitleFocus, { passive: true });
    window.addEventListener('resize', updateTitleFocus);
}

function updateGlobalPointerEffects(x, y) {
    if (prefersReducedMotion) return;

    const px = ((x / window.innerWidth) * 100).toFixed(2) + '%';
    const py = ((y / window.innerHeight) * 100).toFixed(2) + '%';
    document.documentElement.style.setProperty('--mouse-x', px);
    document.documentElement.style.setProperty('--mouse-y', py);
}

function updateScrollProgress() {
    const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScrollable > 0 ? window.scrollY / maxScrollable : 0;
    document.documentElement.style.setProperty('--scroll-progress', String(Math.min(Math.max(progress, 0), 1)));
}

function setupCardTilt() {
    if (isCoarsePointer || prefersReducedMotion) return;

    const cards = document.querySelectorAll('.product-card, .service-item, .studio-card');

    cards.forEach(card => {
        card.classList.add('tilt-card');

        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const relX = (event.clientX - rect.left) / rect.width;
            const relY = (event.clientY - rect.top) / rect.height;

            const rotateY = (relX - 0.5) * 8;
            const rotateX = (0.5 - relY) * 7;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
        });
    });
}

function initThreejs() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene setup
    scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.05;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    const targetPixelRatio = isCoarsePointer ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(targetPixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Load logo texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('logotransparent.png', function(faceTexture) {
        faceTexture.encoding = THREE.sRGBEncoding;
        faceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        faceTexture.center.set(0.5, 0.5);
        faceTexture.rotation = Math.PI / 2;

        // Cylinder material order: side, top, bottom.
        const sideMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x7f7045,
            metalness: 0.96,
            roughness: 0.18,
            clearcoat: 0.35,
            clearcoatRoughness: 0.16
        });
        const faceMaterial = new THREE.MeshPhysicalMaterial({
            map: faceTexture,
            transparent: true,
            alphaTest: 0.03,
            metalness: 0.4,
            roughness: 0.36,
            clearcoat: 0.22,
            clearcoatRoughness: 0.28
        });

        const radialSegments = isCoarsePointer ? 72 : 96;
        const geometry = new THREE.CylinderGeometry(1.13, 1.13, 0.16, radialSegments, 1);
        coin = new THREE.Mesh(geometry, [sideMaterial, faceMaterial, faceMaterial]);
        coin.rotation.x = 1.35;
        coin.rotation.y = 0.06;
        scene.add(coin);
    }, undefined, function(error) {
        console.error('Transparent logo yuklenemedi:', error);
    });

    // Lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 1.45);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xd6c39a, 0.95);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xffe8c2, 0.7);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.55, 10);
    pointLight.position.set(0.8, 1.2, 2.4);
    scene.add(pointLight);

    // Mouse tracking
    if (!isCoarsePointer) {
        document.addEventListener('mousemove', (event) => {
            onMouseMove(event);
            updateGlobalPointerEffects(event.clientX, event.clientY);
        });
    } else {
        updateGlobalPointerEffects(window.innerWidth * 0.5, window.innerHeight * 0.25);
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    animate();
}

function onMouseMove(event) {
    if (isDragging) return;

    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    targetRotationY = mouseX * 0.55;
    targetRotationX = 1.35 + (mouseY * 0.22);
    targetRotationX = Math.max(1.02, Math.min(1.72, targetRotationX));
}

function onPointerDown(event) {
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
}

function onPointerUp() {
    isDragging = false;
}

function onPointerMove(event) {
    if (!isDragging || !coin) return;

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;

    targetRotationY += deltaX * 0.006;
    targetRotationX += deltaY * 0.0045;
    targetRotationY = Math.max(-0.95, Math.min(0.95, targetRotationY));
    targetRotationX = Math.max(0.95, Math.min(1.9, targetRotationX));

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const targetPixelRatio = isCoarsePointer ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);
}

function animate() {
    requestAnimationFrame(animate);

    if (coin) {
        // Smooth rotation with mouse tracking
        coin.rotation.x += (targetRotationX - coin.rotation.x) * 0.05;
        coin.rotation.y += (targetRotationY - coin.rotation.y) * 0.05;
        
        // Continuous slow rotation when not moving
        coin.rotation.y += isCoarsePointer ? 0.00035 : 0.00055;
    }

    renderer.render(scene, camera);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!prefersReducedMotion) {
        document.body.classList.add('intro-play');
        window.setTimeout(() => {
            document.body.classList.remove('intro-play');
        }, 2200);
    }

    initThreejs();
    setupCardTilt();
    setupBrandFlow();
    setupProductTheater();
    setupSectionTitleStory();
    updateScrollProgress();
});

// ============================================
// Theme Toggle Functionality
// ============================================

const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const htmlElement = document.documentElement;

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);
updateCoinColor(currentTheme);
applyTextureMode(currentTheme);

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        const isOpen = menuToggle.classList.toggle('is-open');
        mobileMenu.classList.toggle('is-open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('is-open');
            mobileMenu.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
    const theme = htmlElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    updateCoinColor(newTheme);
    applyTextureMode(newTheme);
});

function updateThemeIcon(theme) {
    const sunIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2V4.5M12 19.5V22M4.9 4.9L6.7 6.7M17.3 17.3L19.1 19.1M2 12H4.5M19.5 12H22M4.9 19.1L6.7 17.3M17.3 6.7L19.1 4.9"/></svg>';
    const moonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14.4A8.8 8.8 0 1 1 9.6 3A7 7 0 1 0 21 14.4Z"/></svg>';
    const iconTarget = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
    if (iconTarget) {
        iconTarget.innerHTML = theme === 'light' ? moonIcon : sunIcon;
    }
}

function updateCoinColor(theme) {
    if (!coin || !Array.isArray(coin.material)) return;

    const sideMaterial = coin.material[0];
    if (!sideMaterial) return;

    if (theme === 'dark') {
        sideMaterial.color.setHex(0x9d8b5c);
    } else {
        sideMaterial.color.setHex(0x7f7045);
    }
}

// ============================================
// Navigation & Scroll
// ============================================

// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const inputs = contactForm.querySelectorAll('input, textarea');
        const formData = {};
        
        inputs.forEach(input => {
            formData[input.placeholder] = input.value;
        });
        
        // Here you would typically send this to a server
        console.log('Form Data:', formData);
        
        // Show success message
        alert('Mesajınız başarıyla gönderildi! Biz en kısa sürede sizinle iletişime geçeceğiz.');
        contactForm.reset();
    });
}

// ============================================
// Intersection Observer for animations
// ============================================

const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -8% 0px'
};

const revealNodes = document.querySelectorAll('.reveal, .stat');
revealNodes.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 80}ms`);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

revealNodes.forEach(element => {
    observer.observe(element);
});

// ============================================
// Navbar scroll effect
// ============================================

const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    updateScrollProgress();
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = 'var(--shadow)';
    } else {
        navbar.style.boxShadow = 'var(--shadow-sm)';
    }
});

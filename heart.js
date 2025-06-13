document.addEventListener('DOMContentLoaded', () => {
    let scene, camera, renderer, heart, particles, controls;
    let mouseX = 0, mouseY = 0;
    let isPulsating = true;
    let heartColors = [
        { main: 0xff2277, emissive: 0x660022, specular: 0xff6699 },
        { main: 0x22aaff, emissive: 0x002266, specular: 0x66ccff },
        { main: 0xffaa22, emissive: 0x664400, specular: 0xffcc66 },
        { main: 0x22ff88, emissive: 0x006633, specular: 0x66ffaa }
    ];
    let currentColorIndex = 0;
    
    // Initialize the scene
    function init() {
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('container').appendChild(renderer.domElement);
        
        // Add orbit controls for better navigation
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 3;
        controls.maxDistance = 10;
        
        // Create lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xff5555, 1, 100);
        pointLight.position.set(0, 0, 5);
        scene.add(pointLight);
        
        const pointLight2 = new THREE.PointLight(0xff8866, 0.8, 100);
        pointLight2.position.set(5, 3, 2);
        scene.add(pointLight2);
        
        // Create heart geometry with improved shape
        createHeart();
        
        // Add heart-shaped particles
        createHeartParticles();
        
        // Event listeners
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        
        // Add button event listeners
        document.getElementById('colorToggle').addEventListener('click', changeHeartColor);
        document.getElementById('pulsateToggle').addEventListener('click', togglePulsation);
        
        // Start animation loop
        animate();
    }
    
    function createHeart() {
        // Improved heart shape with better curves
        const heartShape = new THREE.Shape();
        
        function heartCurve(t, scale = 0.04) {
            // Enhanced heart curve equation for more defined shape
            const x = 16 * Math.pow(Math.sin(t), 3);
            // Modified y-function for a more defined heart shape
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            return { x: x * scale, y: y * -scale };
        }
        
        // Sample points with higher detail
        const detail = 180;
        const firstPoint = heartCurve(0);
        heartShape.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i <= detail; i++) {
            const t = (i / detail) * Math.PI * 2;
            const pt = heartCurve(t);
            heartShape.lineTo(pt.x, pt.y);
        }
        
        const extrudeSettings = {
            steps: 4,
            depth: 0.8,
            bevelEnabled: true,
            bevelThickness: 0.12,
            bevelSize: 0.12,
            bevelSegments: 8,
            curveSegments: 32
        };
        
        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        geometry.computeVertexNormals();
        
        // Materials for the heart with better lighting properties
        const material = new THREE.MeshPhongMaterial({
            color: heartColors[currentColorIndex].main,
            emissive: heartColors[currentColorIndex].emissive,
            shininess: 100,
            specular: heartColors[currentColorIndex].specular
        });
        
        heart = new THREE.Mesh(geometry, material);
        heart.scale.set(0.8, 0.8, 0.8);
        heart.rotation.x = Math.PI;
        scene.add(heart);
    }
    
    function createMiniHeartGeometry(scale = 0.01) {
        // Create a small heart for particles
        const heartShape = new THREE.Shape();
        
        function heartCurve(t, s = scale) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            return { x: x * s, y: y * -s };
        }
        
        const detail = 20; // Lower detail for mini hearts
        const firstPoint = heartCurve(0);
        heartShape.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i <= detail; i++) {
            const t = (i / detail) * Math.PI * 2;
            const pt = heartCurve(t);
            heartShape.lineTo(pt.x, pt.y);
        }
        
        const extrudeSettings = {
            depth: 0.005,
            bevelEnabled: false
        };
        
        return new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    }
    
    function createHeartParticles() {
        const miniHeartGeometry = createMiniHeartGeometry();
        const particleCount = 200;
        particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            // Position hearts in a spherical volume around the main heart
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * 3 + 2.5;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            // Random color for mini heart
            const hue = Math.random() * 0.1 + 0.85; // Pink to red hues
            const color = new THREE.Color().setHSL(hue, 0.8, 0.7);
            
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color.clone().multiplyScalar(0.2),
                shininess: 50,
                transparent: true,
                opacity: Math.random() * 0.5 + 0.5
            });
            
            const miniHeart = new THREE.Mesh(miniHeartGeometry, material);
            miniHeart.position.set(x, y, z);
            
            // Random orientation
            miniHeart.rotation.x = Math.random() * Math.PI * 2;
            miniHeart.rotation.y = Math.random() * Math.PI * 2;
            miniHeart.rotation.z = Math.random() * Math.PI * 2;
            
            // Store original position and random animation parameters
            miniHeart.userData = {
                originalPosition: new THREE.Vector3(x, y, z),
                speed: Math.random() * 0.01 + 0.005,
                amplitude: Math.random() * 0.2 + 0.1,
                phase: Math.random() * Math.PI * 2
            };
            
            particles.add(miniHeart);
        }
        
        scene.add(particles);
    }
    
    function changeHeartColor() {
        currentColorIndex = (currentColorIndex + 1) % heartColors.length;
        
        // Update main heart color
        heart.material.color.setHex(heartColors[currentColorIndex].main);
        heart.material.emissive.setHex(heartColors[currentColorIndex].emissive);
        heart.material.specular.setHex(heartColors[currentColorIndex].specular);
    }
    
    function togglePulsation() {
        isPulsating = !isPulsating;
    }
    
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function onMouseMove(event) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Heart animation - soft rotation even with orbit controls
        heart.rotation.y += 0.003;
        
        // Heart pulsation - if enabled
        if (isPulsating) {
            const pulseFactor = 1 + Math.sin(Date.now() * 0.002) * 0.05;
            heart.scale.set(0.8 * pulseFactor, 0.8 * pulseFactor, 0.8 * pulseFactor);
        }
        
        // Heart particles animation - make them float around in a wave pattern
        const time = Date.now() * 0.001;
        particles.children.forEach((miniHeart, i) => {
            const { originalPosition, speed, amplitude, phase } = miniHeart.userData;
            
            // Circular movement around original position
            miniHeart.position.x = originalPosition.x + Math.sin(time * speed + phase) * amplitude;
            miniHeart.position.y = originalPosition.y + Math.cos(time * speed * 0.8 + phase) * amplitude * 0.5;
            miniHeart.position.z = originalPosition.z + Math.sin(time * speed * 1.2 + phase) * amplitude * 0.3;
            
            // Rotate mini hearts
            miniHeart.rotation.x += 0.01;
            miniHeart.rotation.y += 0.007;
        });
        
        // Subtle response to mouse even with orbit controls
        if (!controls.enabled) {
            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
        }
        
        renderer.render(scene, camera);
    }
    
    // Start the 3D scene
    init();
});

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

    // Animation intro variables
    let introAnimationActive = true;
    let introProgress = 0;
    let cameraStartPosition = new THREE.Vector3(0, 0, 15);
    let cameraEndPosition = new THREE.Vector3(0, 0, 5);
    let cameraStartRotation = new THREE.Vector3(-Math.PI / 6, 0, 0);
    let textMesh;

    // Initialize the scene
    function init() {
        // Create scene
        scene = new THREE.Scene();

        // Create camera with starting position for intro
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.copy(cameraStartPosition);
        camera.rotation.x = cameraStartRotation.x;

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('container').appendChild(renderer.domElement);

        // Add orbit controls but disable them during intro
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 3;
        controls.maxDistance = 10;
        controls.enabled = false; // Disabled during intro animation

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

        // Add strawberry text
        // createStrawberryText();

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

    function createStrawberryText() {
        const loader = new THREE.FontLoader();

        // Load a font (using Three.js built-in font)
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
            const textGeometry = new THREE.TextGeometry('Strawberry', {
                font: font,
                size: 0.3,
                height: 0.05,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });

            // Center the text
            textGeometry.computeBoundingBox();
            const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
            const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);

            const textMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0x333333,
                shininess: 100,
                transparent: true,
                opacity: 0.9
            });

            textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(centerOffsetX, centerOffsetY, 0.5);
            // No separate rotation - let it rotate with the heart

            scene.add(textMesh);
        });
    }

    function updateIntroAnimation() {
        if (!introAnimationActive) return;

        // Increment progress
        introProgress += 0.005;

        if (introProgress >= 1) {
            // End of intro animation
            introAnimationActive = false;
            controls.enabled = true;
            return;
        }

        // Easing function for smoother animation
        const eased = 1 - Math.pow(1 - introProgress, 3); // Cubic ease out

        // Interpolate camera position
        camera.position.lerpVectors(cameraStartPosition, cameraEndPosition, eased);

        // Rotate camera around the heart during intro
        const angle = eased * Math.PI * 2;
        camera.position.x = Math.sin(angle) * (cameraStartPosition.z - (cameraStartPosition.z - cameraEndPosition.z) * eased);
        camera.position.z = Math.cos(angle) * (cameraStartPosition.z - (cameraStartPosition.z - cameraEndPosition.z) * eased);

        // Gradually level the camera rotation
        camera.rotation.x = cameraStartRotation.x * (1 - eased);

        // Always look at the center
        camera.lookAt(scene.position);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Update intro animation if active
        updateIntroAnimation();

        // Update controls only if intro is complete
        if (!introAnimationActive) {
            controls.update();
        }

        // Heart animation - soft rotation even with orbit controls
        heart.rotation.y += 0.003;

        // Remove separate text rotation - it will rotate with the heart naturally

        // Heart pulsation - if enabled
        if (isPulsating) {
            const pulseFactor = 1 + Math.sin(Date.now() * 0.002) * 0.05;
            heart.scale.set(0.8 * pulseFactor, 0.8 * pulseFactor, 0.8 * pulseFactor);

            // Make text pulse with heart
            if (textMesh) {
                textMesh.scale.set(pulseFactor, pulseFactor, pulseFactor);
            }
        }

        // Heart particles animation
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

        // Subtle response to mouse only if intro complete and controls not active
        if (!introAnimationActive && !controls.enabled) {
            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
        }

        renderer.render(scene, camera);
    }

    // Start the 3D scene
    init();
});

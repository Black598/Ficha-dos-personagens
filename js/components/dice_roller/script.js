document.addEventListener('DOMContentLoaded', () => {
    const diceButtons = document.querySelectorAll('.dice-btn');
    const diceLabel = document.getElementById('diceLabel');
    const historyContainer = document.getElementById('history');

    const modifierInput = document.getElementById('modifier');
    const addModBtn = document.getElementById('addMod');
    const subModBtn = document.getElementById('subMod');

    let isRolling = false;
    const history = [];

    // Modifier controls
    addModBtn.addEventListener('click', () => {
        modifierInput.value = parseInt(modifierInput.value || 0) + 1;
    });

    subModBtn.addEventListener('click', () => {
        modifierInput.value = parseInt(modifierInput.value || 0) - 1;
    });

    // Audio Setup using user provided local file
    const diceSound = new Audio('Rolling Dice - Sound effect.mp3');
    diceSound.volume = 0.8;

    // Critical Sound Effects Context
    let sfxCtx;
    function initSfx() {
        if (!sfxCtx) {
            sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sfxCtx.state === 'suspended') sfxCtx.resume();
    }

    function playCritSuccess() {
        if (!sfxCtx) return;
        const timeObj = sfxCtx.currentTime;
        const osc1 = sfxCtx.createOscillator();
        const osc2 = sfxCtx.createOscillator();
        const gain = sfxCtx.createGain();

        // Bright major chord chime
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, timeObj); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, timeObj + 0.1); // Up to C6

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, timeObj); // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, timeObj + 0.1); // Up to E6

        gain.gain.setValueAtTime(0, timeObj);
        gain.gain.linearRampToValueAtTime(0.5, timeObj + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, timeObj + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(sfxCtx.destination);

        osc1.start(timeObj);
        osc1.stop(timeObj + 0.7);
        osc2.start(timeObj);
        osc2.stop(timeObj + 0.7);
    }

    function playCritFail() {
        if (!sfxCtx) return;
        const timeObj = sfxCtx.currentTime;
        const osc = sfxCtx.createOscillator();
        const gain = sfxCtx.createGain();

        // Low dissonant buzz dropping
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, timeObj);
        osc.frequency.exponentialRampToValueAtTime(50, timeObj + 0.4);

        gain.gain.setValueAtTime(0, timeObj);
        gain.gain.linearRampToValueAtTime(0.4, timeObj + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, timeObj + 0.5);

        osc.connect(gain);
        gain.connect(sfxCtx.destination);

        osc.start(timeObj);
        osc.stop(timeObj + 0.6);
    }

    // Play real dice sound
    function playDiceSound() {
        // Reset playback position so it can be played repeatedly
        diceSound.currentTime = 0;

        // Optional: Very slight pitch variation by changing playbackRate
        diceSound.playbackRate = 0.9 + Math.random() * 0.2;

        diceSound.play().catch(e => console.log('Audio playback prevented:', e));
    }

    diceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRolling) return;
            initSfx(); // Initialize synthetic context on interaction IMMEDIATELY upon clicking
            playDiceSound();
            const sides = parseInt(btn.getAttribute('data-dice'));
            rollDice(sides);
        });
    });
    // --- THREE.JS SETUP ---
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xb166ff, 0.8);
    dirLight1.position.set(5, 5, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffb703, 0.5);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    let activeDice = [];

    // Animation flags
    let rollStartTime = 0;
    const rollDuration = 1200; // ms

    function animate(time) {
        requestAnimationFrame(animate);

        if (isRolling && activeDice.length > 0) {
            let elapsed = time - rollStartTime;
            let t = Math.min(elapsed / rollDuration, 1.0);

            activeDice.forEach(die => {
                let group = die.group;
                if (t < 0.7) {
                    // Phase 1: Spin wildly based on velocity
                    let spinSpeed = 1.0 - (t / 0.7); // slow down as we approach phase 2
                    group.rotation.x += die.velocity.x * spinSpeed;
                    group.rotation.y += die.velocity.y * spinSpeed;
                    group.rotation.z += die.velocity.z * spinSpeed;
                } else {
                    // Phase 2: Snap to target face
                    if (!group.transitionQ) {
                        group.transitionQ = group.quaternion.clone();

                        // The camera looks down -Z. We want the targetNormal to point to +Z (towards camera)
                        // We also add a random twist on the Z axis so the die looks natural when it lands
                        const lookQ = new THREE.Quaternion().setFromUnitVectors(die.targetNormal, new THREE.Vector3(0, 0, 1));
                        const randomTwist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2);
                        die.targetQuaternion.multiplyQuaternions(randomTwist, lookQ);
                    }

                    let snapT = (t - 0.7) / 0.3; // 0 to 1
                    // Easing function for smooth snap
                    snapT = 1 - Math.pow(1 - snapT, 3);

                    group.quaternion.slerpQuaternions(group.transitionQ, die.targetQuaternion, snapT);
                }
            });

            if (t === 1.0) {
                isRolling = false;
                onRollComplete();
            }
        } else if (activeDice.length > 0 && !isRolling) {
            // Idle float animation
            activeDice.forEach(die => {
                die.group.position.y = Math.sin(time / 500 + die.id) * 0.2;
            });
        }

        renderer.render(scene, camera);
    }
    animate(performance.now());

    // Responsive canvas
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // --- DICE LOGIC ---

    function createDiceTexture(text, altStyle = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        if (altStyle) {
            // Moeda style
            ctx.fillStyle = text === '1' ? '#ffb703' : '#b166ff';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 6;
            ctx.stroke();
            text = text === '1' ? 'Cara' : 'Coroa';
            ctx.font = 'bold 36px "Cinzel", serif';
        } else {
            // New logic: Transparent background so it maps cleanly onto the colored material
            ctx.clearRect(0, 0, 128, 128);
            ctx.font = 'bold 50px "Cinzel", serif';
        }

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (!altStyle) {
            // Add a subtle drop shadow to text for readability
            ctx.shadowColor = "rgba(138, 43, 226, 0.8)";
            ctx.shadowBlur = 4;
        }
        ctx.fillText(text, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
    }

    function getFacesData(geometry, sides) {
        const nonIndexedGeo = geometry.isBufferGeometry && geometry.index ? geometry.toNonIndexed() : geometry;
        nonIndexedGeo.computeVertexNormals();

        const pos = nonIndexedGeo.attributes.position;
        const faces = [];

        for (let i = 0; i < pos.count; i += 3) {
            const vA = new THREE.Vector3().fromBufferAttribute(pos, i);
            const vB = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
            const vC = new THREE.Vector3().fromBufferAttribute(pos, i + 2);

            const cb = new THREE.Vector3().subVectors(vC, vB);
            const ab = new THREE.Vector3().subVectors(vA, vB);
            const faceNormal = cb.cross(ab).normalize();

            const centroid = new THREE.Vector3().addVectors(vA, vB).add(vC).divideScalar(3);

            let found = false;
            let tolerance = 0.1; // Restore rigid tolerance to prevent mega-face merging
            for (let f of faces) {
                if (f.normal.angleTo(faceNormal) < tolerance) {
                    f.centroids.push(centroid);
                    found = true;
                    break;
                }
            }
            if (!found) {
                faces.push({ normal: faceNormal, centroids: [centroid] });
            }
        }

        return faces.map(f => {
            const center = new THREE.Vector3();
            f.centroids.forEach(c => center.add(c));
            center.divideScalar(f.centroids.length);
            return { normal: f.normal, center: center };
        });
    }

    let currentRollData = {};

    function rollDice(sides) {
        isRolling = true;
        const modifier = parseInt(modifierInput.value || 0);

        const modeInput = document.querySelector('input[name="rollMode"]:checked');
        const mode = modeInput ? modeInput.value : 'normal';
        const numDice = (mode !== 'normal') ? 2 : 1;

        diceLabel.className = 'dice-label';
        diceLabel.textContent = `Rolando D${sides}...`;

        if (activeDice && activeDice.length > 0) {
            activeDice.forEach(d => scene.remove(d.group));
        }
        activeDice = [];

        const radius = (numDice === 2) ? 2.8 : 3.5;
        let geometry;
        switch (sides) {
            case 2: geometry = new THREE.CylinderGeometry(radius, radius, 0.4, 32); break;
            case 4: geometry = new THREE.TetrahedronGeometry(radius, 0); break;
            case 6: geometry = new THREE.BoxGeometry(radius * 1.2, radius * 1.2, radius * 1.2); break;
            case 8: geometry = new THREE.OctahedronGeometry(radius, 0); break;
            case 10: geometry = createD10Geometry(radius); break;
            case 12: geometry = new THREE.DodecahedronGeometry(radius, 0); break;
            case 20:
            case 100: geometry = new THREE.IcosahedronGeometry(radius, 0); break;
            default: geometry = new THREE.BoxGeometry(radius, radius, radius); break;
        }

        const baseMatParams = {
            color: sides === 2 ? 0xaaaaaa : 0xaa1111,
            roughness: 0.2,
            metalness: sides === 2 ? 1.0 : 0.5,
            envMapIntensity: 1.0,
            flatShading: true
        };

        let facesData = getFacesData(geometry, sides);
        if (sides === 2) {
            facesData = facesData.filter(f => Math.abs(f.normal.y) > 0.9);
        }

        currentRollData = { sides, modifier, mode, rolls: [] };

        for (let d = 0; d < numDice; d++) {
            let dieGroup = new THREE.Group();
            scene.add(dieGroup);

            const dieMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(baseMatParams));
            dieGroup.add(dieMesh);

            const rawRoll = Math.floor(Math.random() * sides) + 1;
            let values = [];
            if (sides <= 20) {
                for (let i = 1; i <= sides; i++) values.push(i);
            } else if (sides === 100) {
                values.push(rawRoll);
                while (values.length < facesData.length) {
                    let v = Math.floor(Math.random() * 100) + 1;
                    if (!values.includes(v)) values.push(v);
                }
            }
            values = values.sort(() => Math.random() - 0.5);

            let targetNormal = new THREE.Vector3();

            facesData.forEach((f, idx) => {
                if (idx >= values.length) return;
                const val = values[idx];

                const tex = createDiceTexture(val.toString(), sides === 2);
                const planeMat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    opacity: 0.95,
                    depthWrite: false
                });

                let size = sides === 2 ? radius * 1.8 : radius * 0.9;
                if (sides === 4) size = radius * 1.0;
                if (sides === 12) size = radius * 0.7;
                if (sides === 20 || sides === 100) size = radius * 0.6;

                const planeGeo = new THREE.PlaneGeometry(size, size);
                const plane = new THREE.Mesh(planeGeo, planeMat);

                plane.position.copy(f.center).multiplyScalar(1.01);
                plane.lookAt(f.center.clone().add(f.normal));
                dieGroup.add(plane);

                if (val === rawRoll) {
                    targetNormal.copy(f.normal);
                    if (d === 0) createParticles();
                }
            });

            currentRollData.rolls.push(rawRoll);

            let velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            if (Math.abs(velocity.x) < 0.1) velocity.x += 0.2;
            if (Math.abs(velocity.y) < 0.1) velocity.y += 0.2;

            if (numDice === 2) {
                dieGroup.position.x = d === 0 ? -3 : 3;
                velocity.x += d === 0 ? -0.1 : 0.1;
                velocity.y += d === 0 ? 0.05 : -0.05;
            }

            activeDice.push({
                group: dieGroup,
                targetNormal: targetNormal,
                targetQuaternion: new THREE.Quaternion(),
                velocity: velocity,
                id: d,
                rawRoll: rawRoll
            });
        }

        rollStartTime = performance.now();
    }

    function onRollComplete() {
        const { sides, modifier, mode, rolls } = currentRollData;
        
        let finalRaw;
        let rollTextExtra = '';

        if (mode === 'vantagem') {
            finalRaw = Math.max(...rolls);
            rollTextExtra = ` [Vantagem: ${rolls[0]} e ${rolls[1]}]`;
        } else if (mode === 'desvantagem') {
            finalRaw = Math.min(...rolls);
            rollTextExtra = ` [Desv: ${rolls[0]} e ${rolls[1]}]`;
        } else {
            finalRaw = rolls[0];
        }

        const finalResult = finalRaw + modifier;

        let modStr = '';
        if (modifier > 0) modStr = ` + ${modifier}`;
        if (modifier < 0) modStr = ` - ${Math.abs(modifier)}`;

        let labelText = sides === 2
            ? `Moeda (D2)${modStr} = ${finalRaw === 1 ? 'Cara' : 'Coroa'}${rollTextExtra}`
            : `D${sides}${modStr} = ${finalResult}${rollTextExtra}`;

        let isCritSuccess = finalRaw === sides && sides > 2;
        let isCritFail = finalRaw === 1 && sides > 2;

        if (isCritSuccess) {
            playCritSuccess();
            diceLabel.classList.add('critical-success-text');
            labelText += ' (Sucesso Crítico!)';
            createParticles('#ffb703', 30);
        } else if (isCritFail) {
            playCritFail();
            diceLabel.classList.add('critical-failure-text');
            labelText += ' (Falha Crítica!)';
            createParticles('#ef233c', 30);
        }

        activeDice.forEach(die => {
            let isPicked = (die.rawRoll === finalRaw);
            
            if (isCritSuccess) {
                die.group.scale.set(1.4, 1.4, 1.4);
            } else if (isCritFail) {
                die.group.scale.set(0.8, 0.8, 0.8);
            } else {
                if (isPicked || mode === 'normal') die.group.scale.set(1.2, 1.2, 1.2);
                else die.group.scale.set(1.0, 1.0, 1.0); // Non-picked die doesn't pop as much
            }

            setTimeout(() => {
                if (die.group && !isRolling) die.group.scale.set(1, 1, 1);
            }, 300);
        });

        if (isCritFail) {
            let shakeTicks = 0;
            let shakeInterval = setInterval(() => {
                if (activeDice.length === 0 || shakeTicks > 10) {
                    clearInterval(shakeInterval);
                    activeDice.forEach(d => {
                        let baseX = (mode !== 'normal') ? (d.id === 0 ? -3 : 3) : 0;
                        if (d.group) d.group.position.set(baseX, 0, 0);
                    });
                    return;
                }
                activeDice.forEach(d => {
                    let baseX = (mode !== 'normal') ? (d.id === 0 ? -3 : 3) : 0;
                    if (d.group) d.group.position.x = baseX + (Math.random() - 0.5) * 0.5;
                    if (d.group) d.group.position.y = (Math.random() - 0.5) * 0.5;
                });
                shakeTicks++;
            }, 30);
        }

        diceLabel.textContent = labelText;
        addToHistory(sides, finalRaw, modifier, finalResult, mode, rolls);
    }

    function addToHistory(sides, raw, mod, total, mode, rolls) {
        const item = document.createElement('div');
        item.className = 'history-item';

        let modStr = mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : '';
        let modeStr = '';
        if (mode === 'vantagem') modeStr = ' (Vantagem)';
        if (mode === 'desvantagem') modeStr = ' (Desv)';
        
        item.textContent = sides === 2 
            ? `Moeda${modeStr}: ${raw === 1 ? 'Cara' : 'Coroa'}` 
            : `D${sides}${modStr}${modeStr}: ${total}`;

        if (raw === sides && sides >= 20) item.style.color = 'var(--accent)';
        if (raw === 1 && sides >= 20) item.style.color = '#ef233c';

        historyContainer.prepend(item);

        if (historyContainer.children.length > 5) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    function createParticles(color = 'var(--primary-light)', count = 10) {
        const section = document.querySelector('.dice-display');
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = color;
            particle.style.borderRadius = '50%';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.opacity = '1';
            particle.style.pointerEvents = 'none';
            particle.style.boxShadow = `0 0 10px ${color}`;

            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 80;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.zIndex = '100';

            section.appendChild(particle);

            void particle.offsetWidth; // trigger reflow

            particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
            particle.style.opacity = '0';

            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    }

    function createD10Geometry(radius) {
        // Pentagonal Trapezohedron geometry
        const vertices = [];
        const indices = [];

        // Top vertex
        vertices.push(0, radius, 0); // index 0

        // Bottom vertex
        vertices.push(0, -radius, 0); // index 1

        const r = radius * 0.95;
        const h = radius * 0.10557; // Exact ratio for perfect Kite Coplanarity in a Pentagonal Trapezohedron

        // 5 Top vertices (odd indices)
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5;
            vertices.push(Math.cos(a) * r, h, Math.sin(a) * r);
        } // indices 2-6

        // 5 Bottom vertices (even indices) offset by half a step
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 + Math.PI / 5;
            vertices.push(Math.cos(a) * r, -h, Math.sin(a) * r);
        } // indices 7-11

        // Top faces (CCW)
        indices.push(0, 3, 2);
        indices.push(0, 4, 3);
        indices.push(0, 5, 4);
        indices.push(0, 6, 5);
        indices.push(0, 2, 6);

        // Bottom faces (CCW)
        indices.push(1, 7, 8);
        indices.push(1, 8, 9);
        indices.push(1, 9, 10);
        indices.push(1, 10, 11);
        indices.push(1, 11, 7);

        // Define the zig-zag middle equator (CCW)
        indices.push(2, 3, 7);
        indices.push(7, 3, 8);

        indices.push(3, 4, 8);
        indices.push(8, 4, 9);

        indices.push(4, 5, 9);
        indices.push(9, 5, 10);

        indices.push(5, 6, 10);
        indices.push(10, 6, 11);

        indices.push(6, 2, 11);
        indices.push(11, 2, 7);

        const geo = new THREE.BufferGeometry();
        // Flatten the typed array
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        // A trapezohedron inherently has kite-shaped faces, but BufferGeometry uses triangles.
        // For text mapping, getFacesData groups triangles with similar normals, 
        // effectively merging the zig-zag 20 triangles into 10 clean kite centroids.
        return geo;
    }
});



export function DiceRoller({ rollDice, recentRolls, characterName, view, isRollingModalOpen, setRollingModalOpen }) {
    const el = React.createElement;
    const [visibleRolls, setVisibleRolls] = React.useState([]);

    React.useEffect(() => {
        if (recentRolls && recentRolls.length > 0) {
            const latestRoll = recentRolls[0];
            setVisibleRolls(prev => {
                if (prev.find(r => r.id === latestRoll.id)) return prev;
                return [latestRoll, ...prev].slice(0, 4);
            });
            const timer = setTimeout(() => {
                setVisibleRolls(prev => prev.filter(r => r.id !== latestRoll.id));
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [recentRolls]);

    React.useEffect(() => {
        if (!isRollingModalOpen || typeof THREE === "undefined") return;
        
        let animationFrameId = null;
        let sfxCtx = null;
        
        const init3D = () => {
            const container = document.getElementById('canvas-container');
            if(container) container.innerHTML = '';
            
            const diceButtons = document.querySelectorAll('.dice-btn');
            const diceLabel = document.getElementById('diceLabel');
            const modifierInput = document.getElementById('modifier');
            const addModBtn = document.getElementById('addMod');
            const subModBtn = document.getElementById('subMod');
            
            let isRolling = false;
            let activeDice = [];
            let rollStartTime = 0;
            const rollDuration = 1200;

            if(addModBtn && subModBtn && modifierInput) {
                addModBtn.onclick = () => { modifierInput.value = parseInt(modifierInput.value || 0) + 1; };
                subModBtn.onclick = () => { modifierInput.value = parseInt(modifierInput.value || 0) - 1; };
            }

            const diceSound = new Audio('js/components/dice_roller/Rolling Dice - Sound effect.mp3');
            diceSound.volume = 0.8;

            function initSfx() {
                if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (sfxCtx.state === 'suspended') sfxCtx.resume();
            }

            function playCritSuccess() {
                if (!sfxCtx) return;
                const timeObj = sfxCtx.currentTime;
                const osc1 = sfxCtx.createOscillator();
                const osc2 = sfxCtx.createOscillator();
                const gain = sfxCtx.createGain();
                osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, timeObj); osc1.frequency.exponentialRampToValueAtTime(1046.50, timeObj + 0.1);
                osc2.type = 'sine'; osc2.frequency.setValueAtTime(659.25, timeObj); osc2.frequency.exponentialRampToValueAtTime(1318.51, timeObj + 0.1);
                gain.gain.setValueAtTime(0, timeObj); gain.gain.linearRampToValueAtTime(0.5, timeObj + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, timeObj + 0.6);
                osc1.connect(gain); osc2.connect(gain); gain.connect(sfxCtx.destination);
                osc1.start(timeObj); osc1.stop(timeObj + 0.7); osc2.start(timeObj); osc2.stop(timeObj + 0.7);
            }

            function playCritFail() {
                if (!sfxCtx) return;
                const timeObj = sfxCtx.currentTime;
                const osc = sfxCtx.createOscillator();
                const gain = sfxCtx.createGain();
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, timeObj); osc.frequency.exponentialRampToValueAtTime(50, timeObj + 0.4);
                gain.gain.setValueAtTime(0, timeObj); gain.gain.linearRampToValueAtTime(0.4, timeObj + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, timeObj + 0.5);
                osc.connect(gain); gain.connect(sfxCtx.destination);
                osc.start(timeObj); osc.stop(timeObj + 0.6);
            }

            function playDiceSound() {
                diceSound.currentTime = 0;
                diceSound.playbackRate = 0.9 + Math.random() * 0.2;
                diceSound.play().catch(e => console.log('Audio playback prevented:', e));
            }

            diceButtons.forEach(btn => {
                btn.onclick = () => {
                    if (isRolling) return;
                    initSfx();
                    playDiceSound();
                    const sides = parseInt(btn.getAttribute('data-dice'));
                    rollActiveDice(sides);
                };
            });

            // THREE.JS SETUP
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

            function animate(time) {
                animationFrameId = requestAnimationFrame(animate);

                if (isRolling && activeDice.length > 0) {
                    let elapsed = time - rollStartTime;
                    let t = Math.min(elapsed / rollDuration, 1.0);

                    activeDice.forEach(die => {
                        let group = die.group;
                        if (t < 0.7) {
                            let spinSpeed = 1.0 - (t / 0.7);
                            group.rotation.x += die.velocity.x * spinSpeed;
                            group.rotation.y += die.velocity.y * spinSpeed;
                            group.rotation.z += die.velocity.z * spinSpeed;
                        } else {
                            if (!group.transitionQ) {
                                group.transitionQ = group.quaternion.clone();
                                const lookQ = new THREE.Quaternion().setFromUnitVectors(die.targetNormal, new THREE.Vector3(0, 0, 1));
                                const randomTwist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2);
                                die.targetQuaternion.multiplyQuaternions(randomTwist, lookQ);
                            }
                            let snapT = (t - 0.7) / 0.3;
                            snapT = 1 - Math.pow(1 - snapT, 3);
                            group.quaternion.slerpQuaternions(group.transitionQ, die.targetQuaternion, snapT);
                        }
                    });

                    if (t === 1.0) {
                        isRolling = false;
                        onRollComplete();
                    }
                } else if (activeDice.length > 0 && !isRolling) {
                    activeDice.forEach(die => {
                        die.group.position.y = Math.sin(time / 500 + die.id) * 0.2;
                    });
                }
                renderer.render(scene, camera);
            }
            animate(performance.now());

            // DICE GENERATION LOGIC
            function createDiceTexture(text, altStyle = false) {
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                if (altStyle) {
                    ctx.fillStyle = text === '1' ? '#ffb703' : '#b166ff';
                    ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
                    text = text === '1' ? 'Cara' : 'Coroa';
                    ctx.font = 'bold 36px "Cinzel", serif';
                } else {
                    ctx.clearRect(0, 0, 128, 128);
                    ctx.font = 'bold 50px "Cinzel", serif';
                }
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (!altStyle) {
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
                    for (let f of faces) {
                        if (f.normal.angleTo(faceNormal) < 0.1) {
                            f.centroids.push(centroid);
                            found = true; break;
                        }
                    }
                    if (!found) faces.push({ normal: faceNormal, centroids: [centroid] });
                }
                return faces.map(f => {
                    const center = new THREE.Vector3();
                    f.centroids.forEach(c => center.add(c));
                    center.divideScalar(f.centroids.length);
                    return { normal: f.normal, center: center };
                });
            }

            function createD10Geometry(radius) {
                const vertices = []; const indices = [];
                vertices.push(0, radius, 0); vertices.push(0, -radius, 0);
                const r = radius * 0.95; const h = radius * 0.10557;
                for (let i = 0; i < 5; i++) {
                    const a = (i * Math.PI * 2) / 5;
                    vertices.push(Math.cos(a) * r, h, Math.sin(a) * r);
                }
                for (let i = 0; i < 5; i++) {
                    const a = (i * Math.PI * 2) / 5 + Math.PI / 5;
                    vertices.push(Math.cos(a) * r, -h, Math.sin(a) * r);
                }
                indices.push(0, 3, 2); indices.push(0, 4, 3); indices.push(0, 5, 4); indices.push(0, 6, 5); indices.push(0, 2, 6);
                indices.push(1, 7, 8); indices.push(1, 8, 9); indices.push(1, 9, 10); indices.push(1, 10, 11); indices.push(1, 11, 7);
                indices.push(2, 3, 7); indices.push(7, 3, 8); indices.push(3, 4, 8); indices.push(8, 4, 9);
                indices.push(4, 5, 9); indices.push(9, 5, 10); indices.push(5, 6, 10); indices.push(10, 6, 11);
                indices.push(6, 2, 11); indices.push(11, 2, 7);
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geo.setIndex(indices); geo.computeVertexNormals();
                return geo;
            }

            let currentRollData = {};

            function rollActiveDice(sides) {
                isRolling = true;
                const modifier = parseInt(modifierInput.value || 0);
                const modeInput = document.querySelector('input[name="rollMode"]:checked');
                const mode = modeInput ? modeInput.value : 'normal';
                const numDice = (mode !== 'normal') ? 2 : 1;

                diceLabel.className = 'dice-label';
                diceLabel.textContent = `Rolando D${sides}...`;

                activeDice.forEach(d => scene.remove(d.group));
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
                    case 20: case 100: geometry = new THREE.IcosahedronGeometry(radius, 0); break;
                    default: geometry = new THREE.BoxGeometry(radius, radius, radius); break;
                }

                const baseMatParams = {
                    color: sides === 2 ? 0xaaaaaa : 0xaa1111,
                    roughness: 0.2, metalness: sides === 2 ? 1.0 : 0.5,
                    envMapIntensity: 1.0, flatShading: true
                };

                let facesData = getFacesData(geometry, sides);
                if (sides === 2) facesData = facesData.filter(f => Math.abs(f.normal.y) > 0.9);

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
                        const planeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false });
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
                    let velocity = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
                    if (Math.abs(velocity.x) < 0.1) velocity.x += 0.2;
                    if (Math.abs(velocity.y) < 0.1) velocity.y += 0.2;
                    if (numDice === 2) {
                        dieGroup.position.x = d === 0 ? -3 : 3;
                        velocity.x += d === 0 ? -0.1 : 0.1;
                        velocity.y += d === 0 ? 0.05 : -0.05;
                    }
                    activeDice.push({ group: dieGroup, targetNormal, targetQuaternion: new THREE.Quaternion(), velocity, id: d, rawRoll });
                }
                rollStartTime = performance.now();
            }

            function onRollComplete() {
                const { sides, modifier, mode, rolls } = currentRollData;
                let finalRaw;
                let rollTextExtra = '';
                if (mode === 'vantagem') {
                    finalRaw = Math.max(...rolls); rollTextExtra = ` [Vant: ${rolls[0]}, ${rolls[1]}]`;
                } else if (mode === 'desvantagem') {
                    finalRaw = Math.min(...rolls); rollTextExtra = ` [Desv: ${rolls[0]}, ${rolls[1]}]`;
                } else {
                    finalRaw = rolls[0];
                }

                const finalResult = finalRaw + modifier;
                let modStr = '';
                if (modifier > 0) modStr = ` + ${modifier}`;
                if (modifier < 0) modStr = ` - ${Math.abs(modifier)}`;

                let labelText = sides === 2 ? `Moeda (D2)${modStr} = ${finalRaw === 1 ? 'Cara' : 'Coroa'}${rollTextExtra}` : `D${sides}${modStr} = ${finalResult}${rollTextExtra}`;
                let isCritSuccess = finalRaw === sides && sides > 2;
                let isCritFail = finalRaw === 1 && sides > 2;

                if (isCritSuccess) { playCritSuccess(); diceLabel.classList.add('critical-success-text'); labelText += ' (Sucesso Crítico!)'; createParticles('#ffb703', 30); } 
                else if (isCritFail) { playCritFail(); diceLabel.classList.add('critical-failure-text'); labelText += ' (Falha Crítica!)'; createParticles('#ef233c', 30); }

                activeDice.forEach(die => {
                    let isPicked = (die.rawRoll === finalRaw);
                    if (isCritSuccess) die.group.scale.set(1.4, 1.4, 1.4);
                    else if (isCritFail) die.group.scale.set(0.8, 0.8, 0.8);
                    else { if (isPicked || mode === 'normal') die.group.scale.set(1.2, 1.2, 1.2); else die.group.scale.set(1.0, 1.0, 1.0); }
                    setTimeout(() => { if (die.group && !isRolling) die.group.scale.set(1, 1, 1); }, 300);
                });

                if (isCritFail) {
                    let shakeTicks = 0;
                    let shakeInterval = setInterval(() => {
                        if (activeDice.length === 0 || shakeTicks > 10) {
                            clearInterval(shakeInterval);
                            activeDice.forEach(d => { let baseX = (mode !== 'normal') ? (d.id === 0 ? -3 : 3) : 0; if (d.group) d.group.position.set(baseX, 0, 0); });
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
                
                // CALL REACT HOOK TO EXPORT TO FIREBASE
                let labelStr = '';
                if(modifier !== 0) labelStr += (modifier > 0 ? '+'+modifier : modifier);
                if(mode !== 'normal') labelStr += (mode === 'vantagem' ? ' (Vant)' : ' (Desv)');
                rollDice(sides, finalResult, labelStr.trim());
            }

            function createParticles(color = 'var(--primary-light)', count = 10) {
                const section = document.querySelector('.dice-display');
                if(!section) return;
                for (let i = 0; i < count; i++) {
                    const particle = document.createElement('div');
                    particle.style.position = 'absolute'; particle.style.width = '6px'; particle.style.height = '6px';
                    particle.style.background = color || '#b166ff'; particle.style.borderRadius = '50%';
                    particle.style.left = '50%'; particle.style.top = '50%'; particle.style.pointerEvents = 'none';
                    particle.style.boxShadow = `0 0 10px ${color || '#b166ff'}`;
                    const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 80;
                    const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity;
                    particle.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    particle.style.transform = 'translate(-50%, -50%)'; particle.style.zIndex = '100';
                    section.appendChild(particle);
                    void particle.offsetWidth;
                    particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
                    particle.style.opacity = '0';
                    setTimeout(() => { particle.remove(); }, 600);
                }
            }
        };

        const timeout = setTimeout(init3D, 200);
        return () => {
            clearTimeout(timeout);
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
            if(sfxCtx && sfxCtx.state !== 'closed') sfxCtx.close();
        };
    }, [isRollingModalOpen]);

    const uiHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm pointer-events-auto">
        <button id="closeModalBtn" class="absolute top-6 right-6 text-white text-3xl font-black hover:text-red-500 z-[110] cursor-pointer">&times; Fechar</button>
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-[-1]">
            <div class="absolute w-[600px] h-[600px] bg-purple-600/30 blur-[100px] rounded-full top-[-200px] left-[-100px] animate-pulse"></div>
            <div class="absolute w-[600px] h-[600px] bg-cyan-600/30 blur-[100px] rounded-full bottom-[-200px] right-[-100px] animate-pulse delay-1000"></div>
        </div>

        <main class="pointer-events-auto bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 scale-90 sm:scale-100 items-center">
            <header class="text-center">
                <h1 class="text-4xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent uppercase tracking-widest">Rolador de Dados</h1>
                <p class="text-slate-400 mt-2 tracking-wide text-sm">O destino aguarda</p>
            </header>

            <section class="display-section flex flex-col items-center">
                <div class="dice-display relative" id="diceDisplay" style="height: 250px; width: 320px; perspective: 1000px;">
                    <div id="canvas-container" class="absolute inset-0 z-10"></div>
                </div>
                <div class="dice-label mt-4 text-purple-400 font-bold tracking-widest text-lg uppercase h-8" id="diceLabel">Escolha o dado</div>
            </section>

            <section class="controls relative z-[120] flex flex-col items-center gap-6 mt-4">
                <div class="grid grid-cols-4 sm:grid-cols-4 gap-3 w-full">
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="2"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>2</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="4"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>4</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="6"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>6</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="8"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>8</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="10"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>10</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="12"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>12</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="20"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>20</button>
                    <button class="dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center group" data-dice="100"><span class="text-[10px] text-slate-500 group-hover:text-amber-200">D</span>100</button>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-6 w-full items-center justify-center">
                    <div class="roll-modes flex gap-4 bg-slate-950/50 p-2 px-4 rounded-2xl border border-slate-800" id="rollModes">
                        <label class="mode-label flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors group">
                            <input type="radio" name="rollMode" value="normal" checked class="accent-purple-500 w-4 h-4 cursor-pointer">
                            <span class="text-sm font-bold uppercase tracking-wider">Normal</span>
                        </label>
                        <label class="mode-label flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors group">
                            <input type="radio" name="rollMode" value="vantagem" class="accent-purple-500 w-4 h-4 cursor-pointer">
                            <span class="text-sm font-bold uppercase tracking-wider">Vantagem</span>
                        </label>
                        <label class="mode-label flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors group">
                            <input type="radio" name="rollMode" value="desvantagem" class="accent-purple-500 w-4 h-4 cursor-pointer">
                            <span class="text-sm font-bold uppercase tracking-wider">Desvantagem</span>
                        </label>
                    </div>
                    
                    <div class="modifiers flex items-center gap-3 bg-slate-950/50 p-2 px-4 rounded-2xl border border-slate-800">
                        <label for="modifier" class="text-slate-400 text-sm font-bold uppercase tracking-wider">Modificador:</label>
                        <div class="mod-input-wrapper flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                            <button id="subMod" class="px-3 py-1 hover:bg-slate-700 text-white font-black outline-none border-r border-slate-700">-</button>
                            <input type="number" id="modifier" value="0" step="1" class="w-10 bg-transparent text-center text-white font-black hover:outline-none focus:outline-none outline-none appearance-none" style="-moz-appearance: textfield;">
                            <button id="addMod" class="px-3 py-1 hover:bg-slate-700 text-white font-black outline-none border-l border-slate-700">+</button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>`;

    React.useEffect(() => {
        if (!isRollingModalOpen) return;
        const closeBtn = document.getElementById('closeModalBtn');
        if(closeBtn) {
            closeBtn.onclick = () => setRollingModalOpen(false);
        }
    }, [isRollingModalOpen]);

    return el(React.Fragment, null, 
        // 1. DANGEROUS NATIVE 3D OVERLAY
        isRollingModalOpen ? el('div', { key: 'modal-overlay', dangerouslySetInnerHTML: { __html: uiHtml } }) : null,

        // 2. BALÕES FLUTUANTES (History)
        el('div', { key: 'floating-balloons', className: "fixed bottom-24 right-6 z-50 flex flex-col-reverse gap-3 pointer-events-none" },
            visibleRolls.map((roll) =>
                el('div', {
                    key: roll.id || Math.random(),
                    className: "bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 p-5 rounded-2xl shadow-2xl animate-bounce-in min-w-[140px]"
                }, [
                    el('div', { key: 'header', className: "flex items-center justify-between mb-1 border-b border-slate-800 pb-2" }, [
                        el('span', { key: 'player', className: "text-[10px] font-black text-amber-500 uppercase flex flex-col items-start gap-1" }, [
                            el('span', { key: 'name' }, roll.playerName === characterName ? "Você" : roll.playerName),
                            roll.label ? el('span', { key: 'lbl', className: "bg-amber-500/10 text-amber-300 font-bold px-1 py-0.5 rounded-md" }, roll.label) : null
                        ]),
                        el('span', { key: 'sides', className: "text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded-md" }, `D${roll.sides}`)
                    ]),
                    el('p', { key: 'res', className: "text-4xl mt-2 font-black text-center text-white text-shadow-glow" }, roll.result)
                ])
            )
        )
    );
}
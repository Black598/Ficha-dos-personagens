export function DiceRoller({ rollDice, recentRolls, characterName, view, isRollingModalOpen, setRollingModalOpen, tabletopMode = false, externalRoll = null }) {
    const el = React.createElement;
    const [visibleRolls, setVisibleRolls] = React.useState([]);
    const [isFirstLoad, setIsFirstLoad] = React.useState(true);
    
    // Refs for 3D elements
    const canvasContainerRef = React.useRef(null);
    const diceLabelRef = React.useRef(null);
    const modifierRef = React.useRef(null);
    const rollModeRef = React.useRef('normal');
    const secretModeRef = React.useRef(false);

    // State for local controls
    const [localModifier, setLocalModifier] = React.useState(0);
    const [localRollMode, setLocalRollMode] = React.useState('normal');
    const [localSecret, setLocalSecret] = React.useState(false);
    const [tabletopActive, setTabletopActive] = React.useState(false);
    const hiderTimeoutRef = React.useRef(null);

    // Sync refs with state for the 3D engine to read
    React.useEffect(() => {
        rollModeRef.current = localRollMode;
        secretModeRef.current = localSecret;
    }, [localRollMode, localSecret]);

    // --- HANDLE HISTORY BALLOONS ---
    React.useEffect(() => {
        if (recentRolls && recentRolls.length > 0) {
            if (isFirstLoad) {
                setIsFirstLoad(false);
                return;
            }
            const latestRoll = recentRolls[0];
            if (latestRoll.secret && characterName.toLowerCase() !== 'mestre') return;

            setVisibleRolls(prev => {
                if (prev.find(r => r.id === latestRoll.id)) return prev;
                return [latestRoll, ...prev].slice(0, 4);
            });
            const timer = setTimeout(() => {
                setVisibleRolls(prev => prev.filter(r => r.id !== latestRoll.id));
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [recentRolls, characterName]);

    // --- 3D ENGINE ---
    React.useEffect(() => {
        if ((!isRollingModalOpen && !tabletopMode) || typeof THREE === "undefined") {
            if (typeof THREE === "undefined") console.warn("🎲 [DiceRoller] THREE not found!");
            return;
        }
        
        console.log("🎲 [DiceRoller] Initializing 3D Engine...", { isRollingModalOpen, tabletopMode });

        let animationFrameId = null;
        let isRolling = false;
        let activeDice = [];
        let rollStartTime = 0;
        const rollDuration = 1200;
        let currentRollData = {};

        const container = canvasContainerRef.current;
        if (!container) {
            console.warn("🎲 [DiceRoller] Container not ready!");
            return;
        }

        // Safety: ensure container has size
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 15);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Dice texture creation and faces logic...
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
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (!altStyle) { ctx.shadowColor = "rgba(138, 43, 226, 0.8)"; ctx.shadowBlur = 4; }
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

        function animate(time) {
            animationFrameId = requestAnimationFrame(animate);
            if (isRolling) {
                let t = Math.min((time - rollStartTime) / rollDuration, 1.0);
                activeDice.forEach(die => {
                    const { group, velocity } = die;
                    group.rotation.x += velocity.x * (1 - t) * 10;
                    group.rotation.y += velocity.y * (1 - t) * 10;
                    group.rotation.z += velocity.z * (1 - t) * 10;
                    if (t > 0.7) {
                        const snapT = (t - 0.7) / 0.3;
                        if (!die.transitionQ) die.transitionQ = group.quaternion.clone();
                        group.quaternion.slerpQuaternions(die.transitionQ, die.targetQuaternion, snapT);
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

        function rollActiveDice(sides, forcedSecret = null, forcedModifier = null, forcedMode = null) {
            if (!sides || isRolling) return;
            isRolling = true;
            if (tabletopMode) setTabletopActive(true);
            if (hiderTimeoutRef.current) clearTimeout(hiderTimeoutRef.current);
            
            // Read from refs/state
            const modifier = forcedModifier !== null ? forcedModifier : parseInt(modifierRef.current?.value || 0);
            const mode = forcedMode !== null ? forcedMode : (rollModeRef.current || 'normal');
            const isSecret = forcedSecret !== null ? forcedSecret : secretModeRef.current;
            
            const numDice = (mode !== 'normal') ? 2 : 1;

            if(diceLabelRef.current) {
                diceLabelRef.current.className = 'dice-label text-purple-400 font-bold tracking-widest text-lg uppercase h-8 mt-4';
                diceLabelRef.current.textContent = `Rolando D${sides}...`;
            }

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
                case 20: geometry = new THREE.IcosahedronGeometry(radius, 0); break;
                case 100: geometry = new THREE.IcosahedronGeometry(radius, 2); break; // Zocchihedron style
                default: geometry = new THREE.BoxGeometry(radius, radius, radius); break;
            }

            const isD100 = sides === 100;
            const baseMatParams = {
                color: sides === 2 ? 0xaaaaaa : 0xaa1111,
                roughness: 0.2, 
                metalness: sides === 2 ? 1.0 : 0.5,
                envMapIntensity: 1.0, flatShading: true
            };

            let facesData = getFacesData(geometry, sides);
            if (sides === 2) facesData = facesData.filter(f => Math.abs(f.normal.y) > 0.9);

            currentRollData = { sides, modifier, mode, rolls: [], isSecret };

            for (let d = 0; d < numDice; d++) {
                let dieGroup = new THREE.Group(); scene.add(dieGroup);
                const dieMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(baseMatParams));
                dieGroup.add(dieMesh);

                const textureCache = {};
                function getCachedTexture(val, alt) {
                    const key = `${val}-${alt}`;
                    if (!textureCache[key]) textureCache[key] = createDiceTexture(val.toString(), alt);
                    return textureCache[key];
                }

                const rawRoll = Math.floor(Math.random() * sides) + 1;
                let values = [];
                if (sides <= 20) { 
                    for (let i = 1; i <= sides; i++) values.push(i); 
                } else if (sides === 100) { 
                    // Fill at least 1-100
                    for (let i = 1; i <= 100; i++) values.push(i);
                    // Fill remaining faces with random numbers
                    while (values.length < facesData.length) {
                        values.push(Math.floor(Math.random() * 100) + 1);
                    }
                }
                values = values.sort(() => Math.random() - 0.5);

                let targetNormal = new THREE.Vector3();
                facesData.forEach((f, idx) => {
                    if (idx >= values.length) return;
                    const val = values[idx];
                    const tex = getCachedTexture(val, sides === 2);
                    const planeMat = new THREE.MeshBasicMaterial({ 
                        map: tex, 
                        transparent: true, 
                        opacity: 0.95, 
                        depthWrite: false,
                        color: 0xffffff
                    });
                    let size = sides === 2 ? radius * 1.8 : radius * 0.9;
                    if (sides === 4) size = radius * 1.0;
                    if (sides === 12) size = radius * 0.7;
                    if (sides === 20) size = radius * 0.6;
                    if (isD100) size = radius * 0.35; // Smaller numbers for many faces
                    const planeGeo = new THREE.PlaneGeometry(size, size);
                    const plane = new THREE.Mesh(planeGeo, planeMat);
                    plane.position.copy(f.center).multiplyScalar(1.01);
                    plane.lookAt(f.center.clone().add(f.normal));
                    dieGroup.add(plane);
                    if (val === rawRoll) targetNormal.copy(f.normal);
                });

                currentRollData.rolls.push(rawRoll);
                let velocity = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
                if (numDice === 2) {
                    dieGroup.position.x = d === 0 ? -3 : 3;
                    velocity.x += d === 0 ? -0.1 : 0.1;
                }

                // Calculate target rotation to make the rolled face point to the camera (Z axis)
                const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
                    targetNormal.clone().normalize(),
                    new THREE.Vector3(0, 0, 1)
                );
                // Add a bit of random spin around the target axis for variety
                const randomSpin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2);
                targetQuaternion.premultiply(randomSpin);

                activeDice.push({ group: dieGroup, targetNormal, targetQuaternion, velocity, id: d, rawRoll });
            }
            rollStartTime = performance.now();
            const audio = new Audio('js/components/dice_roller/Rolling Dice - Sound effect.mp3');
            audio.volume = 0.5; audio.play().catch(()=>{});
        }

        function onRollComplete() {
            const { sides, modifier, mode, rolls, isSecret } = currentRollData;
            let finalRaw; let rollTextExtra = '';
            if (mode === 'vantagem') { finalRaw = Math.max(...rolls); rollTextExtra = ` (Vant: ${rolls[0]}, ${rolls[1]})`; }
            else if (mode === 'desvantagem') { finalRaw = Math.min(...rolls); rollTextExtra = ` (Desv: ${rolls[0]}, ${rolls[1]})`; }
            else { finalRaw = rolls[0]; }

            const finalResult = finalRaw + modifier;
            let modStr = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : '';
            if(diceLabelRef.current) diceLabelRef.current.textContent = `D${sides}${modStr} = ${finalResult}${rollTextExtra}`;
            
            rollDice(sides, finalResult, (modStr + rollTextExtra).trim(), isSecret);

            if (tabletopMode) {
                hiderTimeoutRef.current = setTimeout(() => {
                    setTabletopActive(false);
                    activeDice.forEach(d => scene.remove(d.group));
                    activeDice = [];
                }, 4000);
            }
        }

        window._dmRollTrigger = rollActiveDice;

        return () => {
            console.log("🎲 [DiceRoller] Cleaning up 3D Engine...");
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
            window._dmRollTrigger = null;
            if (container && renderer.domElement) container.removeChild(renderer.domElement);
        };
    }, [isRollingModalOpen, tabletopMode]);

    // Handle external triggers
    React.useEffect(() => {
        if (externalRoll && window._dmRollTrigger) {
            console.log("🎲 [DiceRoller] Handling External Roll:", externalRoll);
            window._dmRollTrigger(externalRoll.sides, externalRoll.secret, externalRoll.modifier, externalRoll.mode);
        }
    }, [externalRoll]);

    return el(React.Fragment, null, [
        // 1. MODAL VERSION
        isRollingModalOpen && el('div', { 
            key: 'modal-overlay',
            className: "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm pointer-events-auto"
        }, [
            el('button', { 
                key: 'close',
                onClick: () => setRollingModalOpen(false),
                className: "absolute top-6 right-6 text-white text-3xl font-black hover:text-red-500 z-[110] cursor-pointer"
            }, "× Fechar"),
            el('main', { 
                key: 'main',
                className: "bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl items-center flex flex-col gap-6"
            }, [
                el('header', { key: 'header', className: "text-center" }, [
                    el('h1', { className: "text-4xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent uppercase tracking-widest" }, "Rolador de Dados")
                ]),
                el('section', { key: 'display', className: "display-section flex flex-col items-center" }, [
                    el('div', { key: 'display-box', className: "dice-display relative", style: { height: '250px', width: '320px' } }, [
                        el('div', { key: 'canvas', ref: canvasContainerRef, className: "absolute inset-0 z-10" })
                    ]),
                    el('div', { key: 'label', ref: diceLabelRef, className: "dice-label mt-4 text-purple-400 font-bold tracking-widest text-lg uppercase h-8" }, "Escolha o dado")
                ]),
                el('section', { key: 'controls', className: "controls relative z-[120] flex flex-col items-center gap-6 mt-4" }, [
                    el('div', { key: 'dice-grid', className: "grid grid-cols-4 gap-3 w-full" }, 
                        [2,4,6,8,10,12,20,100].map(s => el('button', {
                            key: s,
                            onClick: () => {
                                if (window._dmRollTrigger) window._dmRollTrigger(s, localSecret);
                            },
                            className: "dice-btn bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-400 text-white font-black py-4 rounded-xl flex flex-col items-center justify-center"
                        }, [el('span', { key: 'd' }, "D"), s]))
                    ),
                    el('div', { key: 'options', className: "flex flex-col sm:flex-row gap-6 w-full items-center justify-center" }, [
                        el('div', { key: 'modes', className: "flex gap-4 bg-slate-950/50 p-2 px-4 rounded-2xl border border-slate-800" }, [
                            el('label', { key: 'norm', className: "flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white" }, [
                                el('input', { type: 'radio', name: 'rollMode', value: 'normal', checked: localRollMode === 'normal', onChange: () => setLocalRollMode('normal'), className: "accent-purple-500" }),
                                el('span', null, "Normal")
                            ]),
                            el('label', { key: 'vant', className: "flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white" }, [
                                el('input', { type: 'radio', name: 'rollMode', value: 'vantagem', checked: localRollMode === 'vantagem', onChange: () => setLocalRollMode('vantagem'), className: "accent-purple-500" }),
                                el('span', null, "Vantagem")
                            ]),
                            el('label', { key: 'desv', className: "flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white" }, [
                                el('input', { type: 'radio', name: 'rollMode', value: 'desvantagem', checked: localRollMode === 'desvantagem', onChange: () => setLocalRollMode('desvantagem'), className: "accent-purple-500" }),
                                el('span', null, "Desvantagem")
                            ]),
                            (characterName || "").toLowerCase() === 'mestre' && el('label', { key: 'secret', className: "flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-400 ml-4 border-l border-slate-700 pl-4" }, [
                                el('input', { type: 'checkbox', checked: localSecret, onChange: (e) => setLocalSecret(e.target.checked), className: "accent-red-500" }),
                                el('span', null, "Oculto 👁️")
                            ])
                        ]),
                        el('div', { key: 'mod-box', className: "modifiers flex items-center gap-3 bg-slate-950/50 p-2 px-4 rounded-2xl border border-slate-800" }, [
                            el('label', { key: 'lbl', className: "text-slate-400 text-sm font-bold uppercase tracking-wider" }, "Mod:"),
                            el('div', { key: 'inp', className: "flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700" }, [
                                el('button', { key: 'sub', onClick: () => setLocalModifier(m => m - 1), className: "px-3 py-1 hover:bg-slate-700 text-white font-black" }, "-"),
                                el('input', { key: 'val', ref: modifierRef, type: 'number', value: localModifier, readOnly: true, className: "w-10 bg-transparent text-center text-white font-black outline-none" }),
                                el('button', { key: 'add', onClick: () => setLocalModifier(m => m + 1), className: "px-3 py-1 hover:bg-slate-700 text-white font-black" }, "+")
                            ])
                        ])
                    ])
                ])
            ])
        ]),

        // 2. TABLETOP VERSION
        (tabletopMode && !isRollingModalOpen) && el('div', { 
            key: 'tabletop', 
            className: `fixed inset-0 z-[250] pointer-events-none flex flex-col items-center justify-center -translate-y-20 transition-all duration-1000 ${tabletopActive ? 'opacity-100' : 'opacity-0'}` 
        }, [
            el('div', { key: 'canvas', ref: canvasContainerRef, className: "w-[600px] h-[400px] relative z-10" }),
            el('div', { key: 'label', ref: diceLabelRef, className: "dice-label text-purple-400 font-bold tracking-widest text-lg uppercase h-8 mt-4" })
        ]),

        // 3. BALLOONS
        el('div', { key: 'balloons', className: "fixed bottom-24 right-6 z-50 flex flex-col-reverse gap-3 pointer-events-none" },
            visibleRolls.map((roll) =>
                el('div', { key: roll.id, className: "bg-slate-900/95 border-2 border-amber-500 p-5 rounded-2xl shadow-2xl animate-bounce-in min-w-[140px]" }, [
                    el('div', { key: 'h', className: "flex justify-between mb-1 border-b border-slate-800 pb-2" }, [
                        el('span', { key: 'p', className: "text-[10px] font-black text-amber-500 uppercase flex flex-col" }, [
                            el('span', null, roll.playerName === characterName ? "Você" : roll.playerName),
                            roll.label ? el('span', { className: "bg-amber-500/10 text-amber-300 px-1 rounded-md" }, roll.label) : null
                        ]),
                        el('span', { key: 's', className: "text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded-md" }, `D${roll.sides}`)
                    ]),
                    el('p', { key: 'r', className: "text-4xl mt-2 font-black text-center text-white" }, roll.result)
                ])
            )
        )
    ]);
}
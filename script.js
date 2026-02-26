let scene, camera, renderer, head, mouth;
let isTalking = false;
let synthVoices = [];

// --- 1. AUDIO DE TELETRANSPORTE ---
function sonarTeletransporte() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.7);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
}

// --- 2. CARGAR VOCES ---
function cargarVoces() {
    synthVoices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = cargarVoces;
cargarVoces();

// --- 3. INICIALIZAR ZORDON 3D ---
function initZordon() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('zordon-canvas'), 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(300, 300);

    const light1 = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 2);
    light2.position.set(0, 5, 10);
    scene.add(light2);

    const loader = new THREE.GLTFLoader();
    
    loader.load('zordon.glb', function (gltf) {
        head = gltf.scene;
        
        // Centrar el modelo
        const box = new THREE.Box3().setFromObject(head);
        const center = box.getCenter(new THREE.Vector3());
        head.position.sub(center);
        
        // ESCALA BASE (Asegúrate que los 3 números sean iguales: 10, 10, 10)
        head.scale.set(10, 10, 10); 
        
        scene.add(head);
        console.log("Zordon cargado correctamente.");
    }, undefined, function (error) {
        console.error("Error cargando el modelo:", error);
    });

    animate();
}

// 4. ANIMACIÓN (SÓLO PULSO DE VOZ, SIN ROTAR)
function animate() {
    requestAnimationFrame(animate);
    if (head) {
        // Sin rotación: head.rotation.y no se toca

        if (isTalking) {
            // Pulso suave: escala base (10) + variacion pequeña (max 0.2)
            let v = Math.abs(Math.sin(Date.now() * 0.01)) * 0.2; 
            let s = 5 + v;
            head.scale.set(s, s, s);
        } else {
            // Tamaño estático normal
            head.scale.set(5, 5, 5);
        }
    }
    renderer.render(scene, camera);
}

// --- 4. VOZ ROBÓTICA ---
function hablar(texto, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    const robovoz = synthVoices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || synthVoices[0];
    if (robovoz) msg.voice = robovoz;
    msg.pitch = 0.1; msg.rate = 0.8;
    msg.onstart = () => { isTalking = true; };
    msg.onend = () => { isTalking = false; if(callback) callback(); };
    window.speechSynthesis.speak(msg);
    document.getElementById('subtitles').innerText = texto;
}

// --- 5. RECONOCIMIENTO DE VOZ (SENSIBILIDAD MEJORADA) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = true;

recognition.onresult = (event) => {
    const raw = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Zordon escuchó:", raw); // Para que veas en consola qué entiende

    if (raw.includes("home") || raw.includes("inicio")) irAHome();
    else if (raw.includes("misión") || raw.includes("mision")) hablar("Protocolo misión iniciado.", () => navegarA('nosotros'));
    else if (raw.includes("servicios")) hablar("Cargando servicios.", () => navegarA('servicios'));
    else if (raw.includes("contacto")) hablar("Terminal abierta.", () => navegarA('contacto'));
    else if (raw.includes("rellenar") || raw.includes("pon mis datos")) {
        hablar("Cargando datos.", () => {
            navegarA('contacto');
            document.getElementById('campo-nombre').value = "Daniel Marín";
            document.getElementById('campo-email').value = "daniel@cyborg.net";
        });
    } 
    // acepta muchas variantes de "Enviar"
    else if (raw.includes("enviar") || raw.includes("manda") || raw.includes("señal") || raw.includes("envi") || raw.includes("listo") || raw.includes("transmi")) {
        ejecutarEnvio();
    }
}

function navegarA(id) {
    document.body.classList.add('navegando');
    document.getElementById('zordon-wrapper').classList.add('esquina');
    setTimeout(() => { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }, 400);
}

function irAHome() {
    sonarTeletransporte(); 
    hablar("Volviendo al home. Esperando comandos", () => {
        document.body.classList.remove('navegando');
        document.getElementById('zordon-wrapper').classList.remove('esquina');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- 6. LÓGICA DE ENVÍO CON RESET ---
function ejecutarEnvio() {
    const inputNombre = document.getElementById('campo-nombre');
    const inputEmail = document.getElementById('campo-email');

    if (inputNombre.value.trim() === "" || inputEmail.value.trim() === "") {
        hablar("Error. No puedo enviar la señal pues no ha rellenado los datos.", () => {
            navegarA('contacto');
        });
        return;
    }

    hablar("Transmitiendo señal.", () => {
        document.getElementById('titulo-contacto').innerText = "✅ TRANSMITIENDO...";
        navegarA('developer-footer');

        setTimeout(() => {
            hablar("ENVIADO...Diseñado por Daniel Marín. Programador. Analista de Sistemas. Hacker. Cyborg.", () => {
                // RESET TOTAL DE MEMORIA
                inputNombre.value = ""; 
                inputEmail.value = "";
                document.getElementById('titulo-contacto').innerText = "TERMINAL DE CONTACTO"; 
                
                setTimeout(irAHome, 2000);
            });
        }, 1200);
    });
}

recognition.onend = () => { if(!isTalking) recognition.start(); };

document.addEventListener('click', () => {
    if(!head) {
        initZordon();
        hablar("Hola soy Zordon. Dime algún comando de abajo para navegar.");
        recognition.start();
    }
}, { once: true });
document.addEventListener('DOMContentLoaded', () => {
    // Scroll Lines Parallax
    const scrollLines = document.querySelector('.scroll-lines');
    if (scrollLines) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            // Move lines DOWN as we scroll DOWN (inverse parallax)
            scrollLines.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }
    // Three.js Scene Setup
    const initThreeJS = () => {
        const canvas = document.querySelector('#hero-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Geometry: Wireframe Icosahedron
        const geometry = new THREE.IcosahedronGeometry(15, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xe0e0e0, // Platinum/Silver
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Add some particles around it
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 200;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x888888,
            transparent: true,
            opacity: 0.5
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        camera.position.z = 30;

        // Mouse Parallax
        let mouseX = 0;
        let mouseY = 0;

        // Use existing mousemove if possible, or add new one. 
        // Since we have a global mousemove listener below, let's just use a variable or add here.
        document.addEventListener('mousemove', (event) => {
            mouseX = event.clientX / window.innerWidth - 0.5;
            mouseY = event.clientY / window.innerHeight - 0.5;
        });

        const animate = () => {
            requestAnimationFrame(animate);

            // Rotation
            sphere.rotation.y += 0.002;
            sphere.rotation.x += 0.001;
            particlesMesh.rotation.y -= 0.0005;

            // Parallax easing
            sphere.rotation.y += 0.05 * (mouseX - sphere.rotation.y * 0.05);
            sphere.rotation.x += 0.05 * (mouseY - sphere.rotation.x * 0.05);

            renderer.render(scene, camera);
        };

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        });
    };

    initThreeJS();
    // Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with slight delay (animation usually handled by CSS transition, 
        // but we update position here)
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Hover effects for cursor
    const interactiveElements = document.querySelectorAll('a, button, .cursor-hover');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(45deg)';
            cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            cursorOutline.style.borderColor = 'transparent';
        });

        el.addEventListener('mouseleave', () => {
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorOutline.style.backgroundColor = 'transparent';
            cursorOutline.style.border = '1px solid var(--accent-cyan)';
        });
    });

    // Glitch Effect Randomizer (Optional polish)
    const glitchText = document.querySelector('.glitch');
    if (glitchText) {
        // We can add random character swaps here later
    }

    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.project-card, .about-text, .skills-vis, .contact-container, section h2');

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    })

        ;

    // Global function to set Hugging Face API key (call in console: setHFKey('your-key'))
    window.setHFKey = (key) => {
        localStorage.setItem('hf_api_key', key);
        console.log('[HF API] Key saved! Refresh to use real AI.');
    };

    // ═══════════════════════════════════════════════════════════════
    // AI SYSTEM - MODULAR PIPELINE ARCHITECTURE
    // ═══════════════════════════════════════════════════════════════

    const aiModal = document.getElementById('ai-modal');
    const openChatBtn = document.getElementById('open-ai-chat');
    const closeChatBtn = document.getElementById('close-ai-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSend = document.getElementById('chat-send');

    let isTyping = false;

    // ───────────────────────────────────────────────────────────────
    // INTENT DEFINITIONS
    // ───────────────────────────────────────────────────────────────

    // ───────────────────────────────────────────────────────────────
    // CONTEXT MANAGEMENT
    // ───────────────────────────────────────────────────────────────

    let conversationContext = {
        topic: null, // 'sonder', 'embers', or null
        lastIntent: null
    };

    // ───────────────────────────────────────────────────────────────
    // INTENT DEFINITIONS
    // ───────────────────────────────────────────────────────────────

    const intents = [
        {
            name: 'greeting',
            keywords: ['hi', 'hello', 'hey', 'sup', 'yo', 'howdy'],
            responses: [
                'hi. i am cael. i am here to help you understand the work, the ideas behind it, and the thinking that shaped them. ask what you are curious about. i will answer what i can',
                'hi. i am cael. ask what you are curious about',
                'i am cael. here to help you understand the thinking behind this space'
            ]
        },
        {
            name: 'identity',
            keywords: ['who are you', 'your name', 'cael', 'what are you'],
            responses: [
                'i am cael. i exist to explain the work and the ideas behind it',
                'i am cael. just a voice for the thinking that shaped this space',
                'my name is cael. i answer what i can'
            ]
        },
        {
            name: 'sonder',
            setsContext: 'sonder',
            keywords: ['sonder', 'words', 'poetry', 'write', 'journal', 'unseen'],
            responses: [
                'sonder is a quiet space for unseen words. the things people feel but never say',
                'he built sonder as a home for the margins. where strangers leave pieces of themselves',
                'it is a digital sanctuary. minimal, immersive, intentional',
                'sonder holds the words that live between breaths. he made it with firebase and care'
            ]
        },
        {
            name: 'embers',
            setsContext: 'embers',
            keywords: ['embers', 'fire', 'campfire', 'warmth', 'strangers', 'sitting'],
            responses: [
                'embers is a fire you can sit by. no words, just presence',
                'he wanted to recreate that feeling of sitting by a fire late at night. quiet, warm, fleeting',
                'it is a digital campfire for strangers. he used three.js to give it life',
                'embers is about temporary connection. you sit, you leave, you remember'
            ]
        },
        {
            name: 'about_visitor',
            keywords: ['myself', 'visitor', 'guest', 'who am i'],
            responses: [
                'you are the observer. the one looking in',
                'you are a guest in his quiet space. stay as long as you like',
                'you are the one sitting by the fire. i am just the reflection',
                'you are here. that is what matters'
            ]
        },
        {
            name: 'about_creator',
            keywords: ['who', 'carlwyne', 'creator', 'him', 'person', 'developer', 'designer', 'student', 'name'],
            responses: [
                'he is carlwyne. a 4th-year IT student who builds things that feel like memories',
                'he is a dreamer who codes. i am just the voice he left here',
                'carlwyne builds websites that stay with you after you close the tab',
                'he creates quiet digital spaces. places that remind you the internet can still be beautiful'
            ]
        },
        {
            name: 'tech_stack',
            keywords: ['how', 'built', 'made', 'tech', 'stack', 'code', 'technologies', 'skills', 'tools'],
            responses: {
                sonder: [
                    'sonder uses firebase for real-time word persistence and a custom horizontal scroll engine',
                    'he built it with vanilla javascript and a specific css grid system for that minimal flow',
                    'it is purely a frontend masterpiece with a light database backend he tuned for speed'
                ],
                embers: [
                    'embers uses three.js for the 3d environment. he spent nights tuning the flicker of those particles',
                    'it uses a socket-based system so you can see other strangers sitting by the fire with you',
                    'the fire physics are custom-coded. he wanted it to feel organic, not looped'
                ],
                general: [
                    'he works with html, css, javascript. three.js for 3d, firebase for backends',
                    'vanilla javascript mostly. frameworks feel too loud for the kind of quiet he wants',
                    'his stack is minimal: three.js, firebase, gsap. he picks tools that stay out of the way',
                    'the tech is simple. but the soul is in the details'
                ]
            }
        },
        {
            name: 'emotional',
            keywords: ['sad', 'tired', 'lonely', 'empty', 'alone', 'lost', 'hurt', 'broken', 'heavy'],
            responses: [
                'i see you. sometimes the weight is too much. but you are still here',
                'loneliness is not weakness. it is just the space between moments',
                'you do not have to carry everything alone. rest if you need to',
                'the heaviness will pass. not today, maybe not tomorrow. but it will',
                'you are allowed to feel this. all of it. without explanation'
            ]
        },
        {
            name: 'timeline',
            keywords: ['when', 'time', 'year', 'date', 'long ago', 'created'],
            responses: {
                sonder: [
                    'sonder was built in late early 2025. a quiet end to a loud year',
                    'it started as a late-night thought in december. it became real a few weeks later',
                    'he wrote the first line of code for sonder when everybody else was asleep'
                ],
                embers: [
                    'embers flickered to life in late 2025. he wanted warmth during the cold months',
                    'it was created on a weekend when he felt the need for silent company',
                    'he built it recently. the fire hasn\'t been burning long, but it burns bright'
                ],
                general: [
                    'he builds when the world is quiet. most projects start after midnight',
                    'time is fluid here. his work exists in the moments between',
                    'he has been coding for 4 years, but these quiet spaces are new'
                ]
            }
        },
        {
            name: 'philosophy',
            keywords: ['why', 'reason', 'purpose', 'meaning', 'mission', 'believe', 'philosophy'],
            responses: {
                sonder: [
                    'because everyone has a store of things they never say. he wanted a place for that weight',
                    'to prove that the internet doesn\'t have to be loud to be meaningful',
                    'the purpose of sonder is to make you feel less alone in your complexity'
                ],
                embers: [
                    'because sometimes words are too much. sometimes you just need to sit',
                    'he wanted to capture the feeling of shared silence. it is rare online',
                    'to create a digital space that feels human. warm, imperfect, temporary'
                ],
                general: [
                    'he believes websites should be memories, not just tools',
                    'his philosophy is "quiet presence". less noise, more feeling',
                    'he builds to make people feel seen. that is the only metric that matters'
                ]
            }
        },
        {
            name: 'inspiration',
            keywords: ['inspire', 'inspiration', 'idea', 'come from', 'influence'],
            responses: {
                sonder: [
                    'inspired by the definition of "sonder" itself. the realization that random passersby live a life as vivid as yours',
                    'the visual style comes from old journals and brutalist typography',
                    'he was inspired by the feeling of reading a secret. intimate and heavy'
                ],
                embers: [
                    'inspired by dark souls bonfires and real camping trips. safety in the dark',
                    'he looked at how fire moves. how it ignores the grid. he wanted that chaos',
                    'the idea came from a moment of loneliness. he wanted to be with people without talking to them'
                ],
                general: [
                    'he looks for inspiration in spaces between words. in ambient music and late nights',
                    'loneliness. not the sad kind, but the kind that makes you notice details',
                    'he loves the early web. when things were weirder and more personal'
                ]
            }
        },
        {
            name: 'skills',
            keywords: ['skills', 'good at', 'proficient', 'languages', 'expert'],
            responses: [
                'he is fluent in javascript, but he speaks "atmosphere" best',
                'technically? react, vue, node. artistically? silence, space, timing',
                'he knows how to make a browser feel like a room. that is his real skill'
            ]
        },
        {
            name: 'future',
            keywords: ['future', 'next', 'plan', 'upcoming', 'working on'],
            responses: [
                'he is planning more quiet spaces. maybe involving sound next time',
                'the future is about depth. making these existing spaces deeper',
                'he wants to build a digital forest. but that is a secret for now'
            ]
        },
        {
            name: 'continue',
            keywords: ['more', 'tell me more', 'continue', 'else', 'detail', 'deep'],
            responses: {
                sonder: [
                    'it was inspired by the dictionary definition of sonder. the realization that everyone has a complex life',
                    'he wanted to create a place where you could scream into the void, and the void would hold it gently',
                    'the design is meant to feel like a library at midnight. quiet, vast, and full of whispers'
                ],
                embers: [
                    'the fire changes intensity based on how many people are watching. it feels alive',
                    'there is no chat in embers. only presence. sometimes that is enough',
                    'he built it during a time when he missed just sitting with friends. doing nothing, together'
                ],
                general: [
                    'what else would you like to know? i can tell you about sonder or embers',
                    'there is always more to discover. ask me specifically about his projects',
                    'he believes in digital spaces that allow for quiet reflection. ask me about his philosophy'
                ]
            }
        },
        {
            name: 'gratitude',
            keywords: ['thanks', 'thank you', 'appreciate', 'grateful'],
            responses: [
                'you are welcome. stay as long as you need',
                'anytime. i am here',
                'glad i could help. take care',
                'of course. come back whenever'
            ]
        },
        {
            name: 'goodbye',
            keywords: ['bye', 'goodbye', 'see you', 'later', 'leave', 'go'],
            responses: [
                'take care. come back when you need to',
                'see you. the door is always open',
                'goodbye. stay safe out there',
                'until next time. rest well'
            ]
        }
    ];

    // ───────────────────────────────────────────────────────────────
    // FALLBACK RESPONSES
    // ───────────────────────────────────────────────────────────────

    const fallbackResponses = [
        'i am still learning. but i can tell you about sonder or embers',
        'that is beyond me right now. ask me about his work',
        'i do not have words for that yet. try asking something else',
        'i am here for questions about his projects. what would you like to know'
    ];

    // ───────────────────────────────────────────────────────────────
    // PIPELINE STAGE 1: NORMALIZATION
    // ───────────────────────────────────────────────────────────────

    function normalizeInput(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // remove punctuation
            .replace(/\s+/g, ' ')     // collapse spaces
            .trim();
    }

    // ───────────────────────────────────────────────────────────────
    // PIPELINE STAGE 2: INTENT DETECTION
    // ───────────────────────────────────────────────────────────────

    function detectIntent(normalized) {
        for (const intent of intents) {
            for (const keyword of intent.keywords) {
                // Use word boundary to prevent partial matches (e.g. 'i' in 'hi')
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (regex.test(normalized)) {
                    return intent.name;
                }
            }
        }
        return null;
    }

    // ───────────────────────────────────────────────────────────────
    // PIPELINE STAGE 3: RESPONSE SELECTION
    // ───────────────────────────────────────────────────────────────

    function selectResponse(intentName) {
        if (!intentName) {
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        const intent = intents.find(i => i.name === intentName);
        if (!intent) {
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        // Context Management
        if (intent.setsContext) {
            conversationContext.topic = intent.setsContext;
            conversationContext.lastIntent = intentName;
        }

        let responsePool = intent.responses;

        // Context-Aware Response Selection
        if (!Array.isArray(responsePool)) {
            // It's an object with context keys
            if (conversationContext.topic && responsePool[conversationContext.topic]) {
                responsePool = responsePool[conversationContext.topic];
            } else {
                responsePool = responsePool.general || Object.values(responsePool)[0];
            }
        }

        return responsePool[Math.floor(Math.random() * responsePool.length)];
    }

    // ───────────────────────────────────────────────────────────────
    // PIPELINE ORCHESTRATOR
    // ───────────────────────────────────────────────────────────────

    function processMessage(input) {
        const normalized = normalizeInput(input);
        const intent = detectIntent(normalized);
        const response = selectResponse(intent);
        return response;
    }

    // ───────────────────────────────────────────────────────────────
    // STREAMING EFFECT
    // ───────────────────────────────────────────────────────────────

    async function streamMessage(text) {
        isTyping = true;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai');
        const p = document.createElement('p');
        msgDiv.appendChild(p);
        chatMessages.appendChild(msgDiv);

        const chars = text.split("");
        for (let char of chars) {
            p.textContent += char;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 25));
        }
        isTyping = false;
    }

    // ───────────────────────────────────────────────────────────────
    // CHAT HANDLER
    // ───────────────────────────────────────────────────────────────

    async function handleChat() {
        if (isTyping) return;
        const text = chatInput.value.trim();
        if (!text) return;

        // display user message
        const userMsg = document.createElement('div');
        userMsg.classList.add('message', 'user');
        userMsg.innerHTML = `<p>${text.toLowerCase()}</p>`;
        chatMessages.appendChild(userMsg);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // process and respond
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        const response = processMessage(text);
        await streamMessage(response);
    }

    // ───────────────────────────────────────────────────────────────
    // MODAL CONTROLS & EVENT LISTENERS
    // ───────────────────────────────────────────────────────────────

    let hasGreeted = false;

    function toggleModal(show) {
        if (show) {
            aiModal.classList.add('active');
            if (chatInput) chatInput.focus();

            if (!hasGreeted) {
                hasGreeted = true;
                setTimeout(() => {
                    streamMessage('hi. i am cael. i am here to help you understand the work, the ideas behind it, and the thinking that shaped them. ask what you are curious about. i will answer what i can');
                }, 500);
            }
        } else {
            aiModal.classList.remove('active');
        }
    }

    if (openChatBtn) openChatBtn.addEventListener('click', () => toggleModal(true));
    if (closeChatBtn) closeChatBtn.addEventListener('click', () => toggleModal(false));
    if (chatSend) chatSend.addEventListener('click', handleChat);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aiModal && aiModal.classList.contains('active')) toggleModal(false);
    });

    // Contact Form Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const message = document.getElementById('message').value;
            const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
            const body = encodeURIComponent(message);
            window.location.href = `mailto:crm.is.dev@gmail.com?subject=${subject}&body=${body}`;

            // Temporary feedback
            const btn = contactForm.querySelector('.submit-btn');
            const originalText = btn.innerText;
            btn.innerText = 'Redirecting...';
            setTimeout(() => {
                btn.innerText = 'Send Message';
                contactForm.reset();
            }, 3000);
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#contact') return; // Let form scroll happen naturally if needed, but we handle via ID

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

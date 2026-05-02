// EchoAisle voice navigation - plain JavaScript, runs in the browser.
// Uses Web Speech API (built into Chrome / Edge / Safari) for speech recognition + text-to-speech.

(function () {
  // --- DOM ---
  const micBtn = document.getElementById('micBtn');
  const micIcon = document.getElementById('micIcon');
  const micStatus = document.getElementById('micStatus');
  const heardCard = document.getElementById('heardCard');
  const heardText = document.getElementById('heardText');
  const queueCard = document.getElementById('queueCard');
  const queueList = document.getElementById('queueList');
  const stepCard = document.getElementById('stepCard');
  const stepProductName = document.getElementById('stepProductName');
  const stepProgress = document.getElementById('stepProgress');
  const stepText = document.getElementById('stepText');
  const stepLandmark = document.getElementById('stepLandmark');
  const controls = document.getElementById('controls');
  const repeatBtn = document.getElementById('repeatBtn');
  const nextBtn = document.getElementById('nextBtn');
  const stopBtn = document.getElementById('stopBtn');
  const whereAmIBtn = document.getElementById('whereAmIBtn');
  const doneCard = document.getElementById('doneCard');

  // --- Voice keyword sets ---
  const NEXT_WORDS = ['next', 'done', 'finish', 'finished', 'reach', 'reached', 'ok', 'okay', 'continue', 'got it', 'completed'];
  const REPEAT_WORDS = ['repeat', 'again', 'what', 'pardon', 'say again'];
  const STOP_WORDS = ['stop', 'cancel', 'exit', 'quit', 'end'];
  const WHERE_WORDS = ['where am i', 'where are we', 'location', 'help', 'lost', 'where', 'position'];

  // --- State ---
  let products = [];
  let queue = [];
  let queueIndex = 0;
  let stepIndex = 0;
  let recognition = null;
  let isListening = false;
  let mode = 'idle'; // idle | searching | navigating

  // --- Step helpers ---
  // Each step may be a plain string (old format) or { instruction, landmark }
  function getInstruction(step) {
    return typeof step === 'string' ? step : (step.instruction || '');
  }
  function getLandmark(step) {
    return typeof step === 'string' ? '' : (step.landmark || '');
  }
  function speakStep(step) {
    const instr = getInstruction(step);
    const lm = getLandmark(step);
    return lm ? `${instr}, ${lm}.` : `${instr}.`;
  }

  // --- Load products from server ---
  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      products = await res.json();
    } catch (e) {
      products = [];
      micStatus.textContent = 'Could not reach the server.';
    }
  }

  // --- Text to speech ---
  function speak(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    micBtn.classList.add('speaking');
    micBtn.classList.remove('listening');
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    u.onend = () => {
      micBtn.classList.remove('speaking');
      if (onEnd) onEnd();
    };
    u.onerror = () => {
      micBtn.classList.remove('speaking');
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(u);
  }

  // --- Speech recognition ---
  function getRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (recognition) return recognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      micStatus.textContent = 'Listening...';
    };
    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      if (mode === 'navigating') {
        setTimeout(() => startListening(), 400);
      } else {
        micStatus.textContent = 'Tap the microphone to begin';
      }
    };
    recognition.onerror = (ev) => {
      micStatus.textContent = 'Mic error: ' + ev.error;
    };
    recognition.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript.toLowerCase().trim();
      handleTranscript(transcript);
    };
    return recognition;
  }

  function startListening() {
    const r = getRecognition();
    if (!r) {
      micStatus.textContent = 'Voice not supported. Use Chrome/Edge/Safari.';
      return;
    }
    if (isListening) return;
    try { r.start(); } catch (e) {}
  }

  function stopListening() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch (e) {}
    }
  }

  // --- Handle voice input ---
  function handleTranscript(text) {
    heardCard.classList.remove('d-none');
    heardText.textContent = text;

    if (mode === 'navigating') {
      if (containsAny(text, STOP_WORDS)) return cancelNavigation();
      if (containsAny(text, WHERE_WORDS)) return whereAmI();
      if (containsAny(text, REPEAT_WORDS)) return repeatStep();
      if (containsAny(text, NEXT_WORDS)) return advanceStep();
      return;
    }

    if (containsAny(text, STOP_WORDS)) return resetAll();
    findProductsInText(text);
  }

  // --- Parse spoken text and build the queue ---
  function findProductsInText(text) {
    const found = [];
    const seen = new Set();
    for (const p of products) {
      for (const kw of p.keywords) {
        if (text.includes(kw.toLowerCase()) && !seen.has(p.id)) {
          found.push(p);
          seen.add(p.id);
          break;
        }
      }
    }
    if (found.length === 0) {
      speak("Sorry, I couldn't find any of those items. Please try again.");
      return;
    }
    queue = found;
    queueIndex = 0;
    stepIndex = 0;
    mode = 'navigating';
    renderQueue();
    startCurrentItem();
  }

  function startCurrentItem() {
    const p = queue[queueIndex];
    stepIndex = 0;
    showStep();
    const intro = queue.length > 1
      ? `Item ${queueIndex + 1} of ${queue.length}: ${p.name} in ${p.aisle}. `
      : `${p.name} in ${p.aisle}. `;
    speak(intro + 'Step 1: ' + speakStep(p.steps[0]), () => startListening());
  }

  function showStep() {
    const p = queue[queueIndex];
    const step = p.steps[stepIndex];
    stepCard.classList.remove('d-none');
    controls.classList.remove('d-none');
    queueCard.classList.remove('d-none');
    doneCard.classList.add('d-none');
    stepProductName.textContent = p.name;
    stepProgress.textContent = `Step ${stepIndex + 1} of ${p.steps.length}`;

    stepText.innerHTML = `<i class="bi bi-arrow-right-circle-fill text-warning me-2"></i>${escapeHtml(getInstruction(step))}`;

    const lm = getLandmark(step);
    if (lm) {
      stepLandmark.innerHTML = `<i class="bi bi-geo-alt-fill text-info me-2"></i><em>${escapeHtml(lm)}</em>`;
      stepLandmark.classList.remove('d-none');
    } else {
      stepLandmark.classList.add('d-none');
    }
    renderQueue();
  }

  function advanceStep() {
    const p = queue[queueIndex];
    stepIndex++;
    if (stepIndex >= p.steps.length) {
      const isLast = queueIndex >= queue.length - 1;
      if (isLast) return finishAll();
      queueIndex++;
      const nextP = queue[queueIndex];
      stepIndex = 0;
      showStep();
      speak(
        `You have reached ${p.name}. Now heading to item ${queueIndex + 1} of ${queue.length}: ` +
        `${nextP.name} in ${nextP.aisle}. Step 1: ${speakStep(nextP.steps[0])}`,
        () => startListening()
      );
      return;
    }
    showStep();
    speak('Step ' + (stepIndex + 1) + ': ' + speakStep(p.steps[stepIndex]), () => startListening());
  }

  function repeatStep() {
    const p = queue[queueIndex];
    speak('Step ' + (stepIndex + 1) + ': ' + speakStep(p.steps[stepIndex]), () => startListening());
  }

  function whereAmI() {
    if (mode !== 'navigating') {
      speak('Navigation is not active. Tap the microphone and say what you want to find, for example: I want soap and milk.');
      return;
    }
    const p = queue[queueIndex];
    const totalItems = queue.length;
    const totalSteps = p.steps.length;
    const itemPart = totalItems > 1
      ? `You are shopping for ${totalItems} items. Currently on item ${queueIndex + 1} of ${totalItems}: ${p.name}, located in ${p.aisle}. `
      : `You are navigating to ${p.name}, located in ${p.aisle}. `;
    const stepPart = `You are on step ${stepIndex + 1} of ${totalSteps}. `;
    const directionPart = speakStep(p.steps[stepIndex]);
    speak(itemPart + stepPart + directionPart, () => startListening());
  }

  function cancelNavigation() {
    speak('Navigation cancelled.', () => {});
    resetAll();
  }

  function finishAll() {
    mode = 'idle';
    stopListening();
    stepCard.classList.add('d-none');
    controls.classList.add('d-none');
    doneCard.classList.remove('d-none');
    renderQueue();
    speak(queue.length > 1
      ? `All ${queue.length} items collected. Happy shopping!`
      : 'You have reached your item. Happy shopping!');
  }

  function resetAll() {
    mode = 'idle';
    queue = [];
    queueIndex = 0;
    stepIndex = 0;
    stopListening();
    stepCard.classList.add('d-none');
    controls.classList.add('d-none');
    queueCard.classList.add('d-none');
    doneCard.classList.add('d-none');
    heardCard.classList.add('d-none');
    micStatus.textContent = 'Tap the microphone to begin';
  }

  function renderQueue() {
    queueList.innerHTML = '';
    queue.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      if (i < queueIndex) div.classList.add('done');
      if (i === queueIndex && mode === 'navigating') div.classList.add('current');
      const checkmark = i < queueIndex ? '<i class="bi bi-check-circle-fill text-success"></i> ' : '';
      div.innerHTML = checkmark + escapeHtml(p.name);
      queueList.appendChild(div);
    });
  }

  // --- Helpers ---
  function containsAny(text, words) {
    return words.some((w) => text.includes(w));
  }
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- Cart from /products page deep-link (?items=1,2,3) ---
  function checkDeepLink() {
    const url = new URL(window.location.href);
    const items = url.searchParams.get('items');
    if (!items) return;
    const ids = items.split(',').map(Number).filter(Boolean);
    const list = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
    if (list.length === 0) return;
    queue = list;
    queueIndex = 0;
    stepIndex = 0;
    mode = 'navigating';
    renderQueue();
    startCurrentItem();
  }

  // --- Wire up buttons ---
  micBtn.addEventListener('click', () => {
    if (mode === 'navigating') return;
    mode = 'searching';
    startListening();
  });
  repeatBtn.addEventListener('click', repeatStep);
  nextBtn.addEventListener('click', advanceStep);
  stopBtn.addEventListener('click', cancelNavigation);
  whereAmIBtn.addEventListener('click', whereAmI);

  // --- Init ---
  loadProducts().then(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      micStatus.innerHTML = '<span class="text-warning">Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.</span>';
    }
    checkDeepLink();
  });
})();

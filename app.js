// JavaScript for the Welsh Mutation Trainer (Stage 2)

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app-container');
  // The dataset is defined in data.js as a global constant `exercises`
  let exercises = window.exercises || [];
  let currentIndex = 0;
  // modes: 'home', 'read', 'parse', 'produce'
  let currentMode = 'home';

  // Immediately show the home screen now that data is available
  showHome();

  // Render the home/welcome screen
  function showHome() {
    currentMode = 'home';
    container.innerHTML = `
      <div class="text-center py-5">
        <h1 class="mb-3">Welsh Mutation Trainer</h1>
        <p class="lead">Drill Welsh mutation rules using Read → Parse → Produce cycles.</p>
        <button class="btn btn-primary btn-lg" id="start-btn">Start Training</button>
      </div>
    `;
    document.getElementById('start-btn').addEventListener('click', () => {
      currentIndex = 0;
      currentMode = 'read';
      renderExercise();
    });
  }

  // Render the current exercise in the given mode
  function renderExercise() {
    const ex = exercises[currentIndex];
    // Progress percentage (0 at first exercise)
    const progress = ((currentIndex) / exercises.length) * 100;
    let content = '';
    if (currentMode === 'read') {
      content = renderRead(ex);
    } else if (currentMode === 'parse') {
      content = renderParse(ex);
    } else if (currentMode === 'produce') {
      content = renderProduce(ex);
    }
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">${ex.topic}</h5>
          <div class="progress mb-3">
            <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          ${content}
        </div>
      </div>
    `;
    attachEvents(ex);
  }

  // Wrap mutated tokens in spans with ghost radicals for read mode
  function wrapSentence(ex) {
    let sentence = ex.welsh;
    // Sort tokens to handle longer tokens first to avoid nested replacements
    const mutatedTokens = ex.tokens.filter((t) => t.type === 'mutated');
    mutatedTokens.sort((a, b) => b.text.length - a.text.length);
    mutatedTokens.forEach((token) => {
      const escaped = token.text.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
      const regex = new RegExp(`\\b${escaped}\\b`);
      const explanation = token.explanation.replace(/"/g, '&quot;');
      const radical = token.radical || '';
      const replacement = `<span class="mutated" data-explanation="${explanation}" data-radical="${radical}">${token.text}<span class="ghost">${radical}</span></span>`;
      sentence = sentence.replace(regex, replacement);
    });
    return sentence;
  }

  // Render read mode content
  function renderRead(ex) {
    const wrapped = wrapSentence(ex);
    return `
      <div class="mode-title">Read</div>
      <p class="fs-5" id="read-sentence">${wrapped}</p>
      <div id="explanation-box" class="explanation-box hidden"></div>
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary" id="home-btn">Home</button>
        <button class="btn btn-primary" id="next-mode-btn">Parse</button>
      </div>
    `;
  }

  // Render parse mode content
  function renderParse(ex) {
    let selects = '';
    ex.tokens.forEach((token, idx) => {
      if (token.type === 'mutated') {
        let options = '';
        token.parseOptions.forEach((opt, i) => {
          options += `<option value="${i}">${opt}</option>`;
        });
        selects += `
          <div class="mb-3">
            <label class="form-label">${token.text}</label>
            <select class="form-select parse-select" data-correct="${token.correctIndex}">
              <option value="" selected disabled>Choose an explanation…</option>
              ${options}
            </select>
          </div>
        `;
      }
    });
    return `
      <div class="mode-title">Parse</div>
      <p class="mb-2"><strong>Sentence:</strong> ${ex.welsh}</p>
      <form id="parse-form">${selects}</form>
      <div id="parse-feedback" class="explanation-box hidden"></div>
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary" id="prev-mode-btn">Back</button>
        <div>
          <button class="btn btn-primary me-2" id="check-parse-btn">Check</button>
          <button class="btn btn-primary d-none" id="next-mode-btn">Produce</button>
        </div>
      </div>
    `;
  }

  // Render produce mode content
  function renderProduce(ex) {
    return `
      <div class="mode-title">Produce</div>
      <p>${ex.producePrompt}</p>
      <textarea id="produce-input" class="form-control" rows="3" placeholder="Write your phrase here…"></textarea>
      <button class="btn btn-outline-secondary mt-2" id="show-example-btn">Show Example</button>
      <div id="example-box" class="explanation-box hidden"><strong>Example answer:</strong> ${ex.welsh}</div>
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary" id="prev-mode-btn">Back</button>
        ${currentIndex < exercises.length - 1 ? `<button class="btn btn-primary" id="next-ex-btn">Next Exercise</button>` : `<button class="btn btn-success" id="finish-btn">Finish</button>`}
      </div>
    `;
  }

  // Attach event listeners after rendering
  function attachEvents(ex) {
    // Common home/back buttons
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', showHome);
    }
    const prevModeBtn = document.getElementById('prev-mode-btn');
    if (prevModeBtn) {
      prevModeBtn.addEventListener('click', () => {
        if (currentMode === 'parse') {
          currentMode = 'read';
        } else if (currentMode === 'produce') {
          currentMode = 'parse';
        }
        renderExercise();
      });
    }
    // Read mode interactions
    if (currentMode === 'read') {
      // Show explanation on clicking a mutated word
      document.querySelectorAll('.mutated').forEach((el) => {
        el.addEventListener('click', () => {
          const exp = el.getAttribute('data-explanation');
          const box = document.getElementById('explanation-box');
          box.innerHTML = exp;
          box.classList.remove('hidden');
        });
      });
      const nextModeBtn = document.getElementById('next-mode-btn');
      nextModeBtn.addEventListener('click', () => {
        currentMode = 'parse';
        renderExercise();
      });
    }
    // Parse mode interactions
    if (currentMode === 'parse') {
      const checkBtn = document.getElementById('check-parse-btn');
      const nextBtn = document.getElementById('next-mode-btn');
      checkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const selects = document.querySelectorAll('.parse-select');
        let allCorrect = true;
        let feedbackMessages = [];
        selects.forEach((sel) => {
          const correct = sel.getAttribute('data-correct');
          const selected = sel.value;
          // remove previous validation classes
          sel.classList.remove('is-valid', 'is-invalid');
          if (selected === correct) {
            sel.classList.add('is-valid');
          } else {
            sel.classList.add('is-invalid');
            allCorrect = false;
            // find token explanation
            const tokenIdx = Array.from(selects).indexOf(sel);
            const mutatedTokens = ex.tokens.filter((t) => t.type === 'mutated');
            const tok = mutatedTokens[tokenIdx];
            feedbackMessages.push(`<strong>${tok.text}:</strong> ${tok.explanation}`);
          }
        });
        const feedbackBox = document.getElementById('parse-feedback');
        if (allCorrect) {
          feedbackBox.classList.remove('hidden');
          feedbackBox.classList.remove('alert-danger');
          feedbackBox.classList.add('alert', 'alert-success');
          feedbackBox.innerHTML = 'All answers are correct!';
          nextBtn.classList.remove('d-none');
        } else {
          feedbackBox.classList.remove('hidden');
          feedbackBox.classList.remove('alert-success');
          feedbackBox.classList.add('alert', 'alert-danger');
          feedbackBox.innerHTML = feedbackMessages.join('<br>');
        }
      });
      // move to produce mode
      nextBtn.addEventListener('click', () => {
        currentMode = 'produce';
        renderExercise();
      });
    }
    // Produce mode interactions
    if (currentMode === 'produce') {
      const showExampleBtn = document.getElementById('show-example-btn');
      const exampleBox = document.getElementById('example-box');
      showExampleBtn.addEventListener('click', () => {
        exampleBox.classList.toggle('hidden');
      });
      const nextExBtn = document.getElementById('next-ex-btn');
      if (nextExBtn) {
        nextExBtn.addEventListener('click', () => {
          // proceed to next exercise
          currentIndex += 1;
          currentMode = 'read';
          renderExercise();
        });
      }
      const finishBtn = document.getElementById('finish-btn');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          container.innerHTML = `
            <div class="text-center py-5">
              <h2>Congratulations!</h2>
              <p>You have completed all ${exercises.length} exercises.</p>
              <button class="btn btn-primary" id="restart-btn">Restart</button>
            </div>
          `;
          document.getElementById('restart-btn').addEventListener('click', showHome);
        });
      }
    }
  }
});

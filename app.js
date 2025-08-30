/*
 * Main client‑side logic for the Welsh Mutation Trainer.
 * The application cycles through three modes — Read, Parse and Produce — for
 * each exercise.  Mode 0 (Read) displays the sentence with highlights and
 * allows the learner to reveal explanations.  Mode 1 (Parse) asks the
 * learner to identify which mutation rule applies.  Mode 2 (Produce)
 * encourages the learner to craft their own sentence following the same
 * structure.
 */

(() => {
  let currentIndex = 0;
  let currentMode = 0; // 0: Read, 1: Parse, 2: Produce

  const exerciseCountEl = document.getElementById('exercise-count');
  const modeIndicatorEl = document.getElementById('mode-indicator');
  const exerciseAreaEl = document.getElementById('exercise-area');
  const feedbackEl = document.getElementById('feedback');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Attach event listeners for navigation
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      currentMode = 0;
      render();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentMode < 2) {
      currentMode++;
    } else if (currentIndex < exercises.length - 1) {
      currentIndex++;
      currentMode = 0;
    }
    render();
  });

  /**
   * Render the current state of the app based on exercise and mode.
   */
  function render() {
    const exercise = exercises[currentIndex];
    exerciseCountEl.textContent = `Exercise ${currentIndex + 1} of ${exercises.length}`;
    const modeNames = ['Read', 'Parse', 'Produce'];
    modeIndicatorEl.textContent = modeNames[currentMode];
    feedbackEl.textContent = '';

    if (currentMode === 0) {
      renderRead(exercise);
    } else if (currentMode === 1) {
      renderParse(exercise);
    } else {
      renderProduce(exercise);
    }
    // Disable prev button on first exercise and first mode
    prevBtn.disabled = currentIndex === 0 && currentMode === 0;
    // Disable next button at the very end
    nextBtn.disabled = currentIndex === exercises.length - 1 && currentMode === 2;
  }

  /**
   * Render read mode.  Highlight mutated words and allow explanations to be shown.
   * @param {Object} exercise
   */
  function renderRead(exercise) {
    // Build the sentence with clickable spans for mutated tokens
    const sentenceFragments = [];
    const words = exercise.welsh.split(/\s+/);
    let tokenIndex = 0;
    for (const word of words) {
      // Find matching token in exercise.tokens (by text ignoring accents)
      // We search for mutated tokens by matching current word to token.text
      const token = exercise.tokens.find(t => t.text === word);
      if (token && token.type === 'mutated') {
        // Create span with ghost radical
        const span = document.createElement('span');
        span.className = 'mutated';
        span.textContent = token.text;
        // Append ghost radical as small element if available
        if (token.radical) {
          const ghost = document.createElement('span');
          ghost.className = 'ghost';
          ghost.textContent = token.radical;
          span.appendChild(ghost);
        }
        // On click, show explanation
        span.addEventListener('click', () => {
          feedbackEl.innerHTML = token.explanation;
        });
        sentenceFragments.push(span);
      } else {
        // Regular word
        const textNode = document.createTextNode(word);
        sentenceFragments.push(textNode);
      }
      // Add space between words except after last
      sentenceFragments.push(document.createTextNode(' '));
      tokenIndex++;
    }
    // Clear area and append all fragments
    exerciseAreaEl.innerHTML = '';
    sentenceFragments.forEach(node => exerciseAreaEl.appendChild(node));
    // Append translation below the Welsh sentence
    const translation = document.createElement('div');
    translation.className = 'translation';
    translation.style.marginTop = '0.5rem';
    translation.style.fontStyle = 'italic';
    translation.textContent = exercise.english;
    exerciseAreaEl.appendChild(translation);
    // Instruction feedback
    feedbackEl.innerHTML = 'Tap a highlighted word to see why it mutates.';
  }

  /**
   * Render parse mode.  Show the sentence and ask the learner to select the rule
   * that applies to each mutated word.  Provide feedback when the
   * "Check" button is pressed.
   * @param {Object} exercise
   */
  function renderParse(exercise) {
    exerciseAreaEl.innerHTML = '';
    // Display the Welsh sentence plainly
    const sentenceDiv = document.createElement('div');
    sentenceDiv.textContent = exercise.welsh;
    exerciseAreaEl.appendChild(sentenceDiv);
    // List mutated tokens
    const mutatedTokens = exercise.tokens.filter(t => t.type === 'mutated');
    if (mutatedTokens.length > 0) {
      mutatedTokens.forEach((token, idx) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'parse-control';
        const label = document.createElement('label');
        label.textContent = `Which rule caused "${token.text}"?`;
        controlDiv.appendChild(label);
        const select = document.createElement('select');
        token.parseOptions.forEach((opt, i) => {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = opt;
          select.appendChild(option);
        });
        controlDiv.appendChild(select);
        exerciseAreaEl.appendChild(controlDiv);
        // Store select element on token for later checking
        token._selectEl = select;
      });
      // Add check button
      const checkBtn = document.createElement('button');
      checkBtn.textContent = 'Check answers';
      checkBtn.className = 'produce-button';
      exerciseAreaEl.appendChild(checkBtn);
      checkBtn.addEventListener('click', () => {
        let allCorrect = true;
        mutatedTokens.forEach(token => {
          const selected = parseInt(token._selectEl.value, 10);
          if (selected !== token.correctIndex) {
            allCorrect = false;
          }
        });
        if (allCorrect) {
          feedbackEl.textContent = 'All correct! Well done.';
        } else {
          // Show explanations for each token
          let messages = mutatedTokens.map(token => {
            return `${token.text}: ${token.explanation.replace(/<[^>]+>/g, '')}`;
          });
          feedbackEl.innerHTML = 'Some answers were incorrect.\n' + messages.join('\n');
        }
      });
    } else {
      feedbackEl.textContent = 'No mutations to parse for this exercise.';
    }
    // Append translation
    const translation = document.createElement('div');
    translation.style.marginTop = '0.5rem';
    translation.style.fontStyle = 'italic';
    translation.textContent = exercise.english;
    exerciseAreaEl.appendChild(translation);
  }

  /**
   * Render produce mode.  Encourage the learner to craft their own sentence
   * following the same structure.  Since automatic checking of free text is
   * difficult, we provide an example answer for inspiration.
   * @param {Object} exercise
   */
  function renderProduce(exercise) {
    exerciseAreaEl.innerHTML = '';
    const promptDiv = document.createElement('div');
    promptDiv.innerHTML = exercise.producePrompt;
    exerciseAreaEl.appendChild(promptDiv);
    // Input box
    const input = document.createElement('textarea');
    input.className = 'produce-input';
    input.rows = 3;
    input.placeholder = 'Write your Welsh sentence here…';
    exerciseAreaEl.appendChild(input);
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Show example';
    submitBtn.className = 'produce-button';
    exerciseAreaEl.appendChild(submitBtn);
    submitBtn.addEventListener('click', () => {
      // Provide example answer derived from tokens
      const mutated = exercise.tokens.filter(t => t.type === 'mutated');
      const examplePieces = mutated.map(token => token.text);
      const example = examplePieces.length > 0 ? examplePieces.join(' ') : exercise.welsh;
      feedbackEl.innerHTML = `Example: <em>${example}</em>`;
    });
    // Append translation for reference
    const translation = document.createElement('div');
    translation.style.marginTop = '0.5rem';
    translation.style.fontStyle = 'italic';
    translation.textContent = exercise.english;
    exerciseAreaEl.appendChild(translation);
  }

  // Initial render
  render();
})();
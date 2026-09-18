/* =====================================================================
   CareerPath AI — counselor.js
   ---------------------------------------------------------------------
   Controls the AI Career Counselor chat interface.

   Flow:
     counselor.html
       ↓
     counselor.js  (this file)
       ↓
     Python FastAPI backend  →  http://127.0.0.1:8000/chat
       ↓
     Hugging Face LLM
       ↓
     Python backend
       ↓
     counselor.js
       ↓
     Chat UI

   No API keys live in this file. They belong in the Python backend.

   Conversation memory:
     A module-level `chatHistory` array keeps the current page session's
     conversation. Each request sends:
         { message, career_context, history }
     The backend uses `history` to give the model conversational context.
   ===================================================================== */

(function () {
  'use strict';

  /* =========================================================
     1. CONFIGURATION
     ========================================================= */

  var API_URL = '/chat';
  var MAX_LENGTH = 1000;
  var REQUEST_TIMEOUT_MS = 45000;

  /* Maximum number of history messages sent to the backend.
     Keeps the request payload small and avoids runaway prompts. */
  var MAX_HISTORY_MESSAGES = 20;

  /* localStorage keys used elsewhere in the project. */
  var STORAGE = {
    selected: 'selectedCareer',
    profile: 'studentProfile',
    assessment: 'careerAssessmentResult'
  };

  /* =========================================================
     2. MODULE STATE
     ========================================================= */

  var els = {};              // cached DOM references
  var isSending = false;     // prevents overlapping requests
  var careerContext = null;  // built once on load, sent with every request

  /*
    Conversation memory for the current page session.
    Each entry: { role: "user" | "assistant", content: string }
  */
  var chatHistory = [];

  /* =========================================================
     3. SAFE STORAGE HELPERS
     ========================================================= */

  /** Safely read and parse a localStorage key. Returns null on any problem. */
  function readStorage(key) {
    var raw;
    try {
      raw = window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
    if (!raw) return null;

    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  /* =========================================================
     4. CAREER CONTEXT
     ========================================================= */

  /**
   * Build the career context object from localStorage.
   * Every field is optional — the backend can handle partial context.
   */
  function buildCareerContext() {
    var ctx = {
      career: null,
      level: null,
      learning_time: null,
      focus: null
    };

    /* --- Selected career (written by dashboard.js) --- */
    var selected = readStorage(STORAGE.selected);
    if (selected && typeof selected.name === 'string') {
      ctx.career = selected.name;
    }

    /* --- Student profile (written by profile.html) --- */
    var profile = readStorage(STORAGE.profile);
    if (profile) {
      if (!ctx.career && typeof profile.careerGoal === 'string') {
        ctx.career = profile.careerGoal;
      }
      if (typeof profile.learningTime === 'string') {
        ctx.learning_time = profile.learningTime;
      }
      if (typeof profile.experienceLevel === 'string') {
        ctx.level = profile.experienceLevel;
      }
    }

    /* --- Assessment result (written by assessment.html) --- */
    var result = readStorage(STORAGE.assessment);
    if (result) {
      if (!ctx.career && result.primaryCareer && typeof result.primaryCareer.name === 'string') {
        ctx.career = result.primaryCareer.name;
      }
    }

    /* Focus defaults to the career itself when nothing more specific exists. */
    if (!ctx.focus && ctx.career) {
      ctx.focus = ctx.career;
    }

    return ctx;
  }

  /** Write the resolved context into the sidebar card. */
  function renderCareerContext() {
    setText(els.targetCareer, careerContext.career || 'Not available');
    setText(els.currentLevel, careerContext.level || 'Not available');
    setText(els.learningTime, careerContext.learning_time || 'Not available');
    setText(els.careerFocus, careerContext.focus || 'Not available');
  }

  /* =========================================================
     5. SMALL UTILITIES
     ========================================================= */

  /** Set textContent only if the element exists. */
  function setText(el, text) {
    if (el && text !== undefined && text !== null) {
      el.textContent = text;
    }
  }

  /** Show an element by removing the `hidden` class. */
  function show(el) {
    if (el) el.classList.remove('hidden');
  }

  /** Hide an element by adding the `hidden` class. */
  function hide(el) {
    if (el) el.classList.add('hidden');
  }

  /** Scroll the chat container to the very bottom. */
  function scrollToBottom() {
    if (els.messages) {
      els.messages.scrollTop = els.messages.scrollHeight;
    }
  }

  /* =========================================================
     6. CONVERSATION HISTORY
     ========================================================= */

  /** Add a message to the in-memory history, then trim to the cap. */
  function pushHistory(role, content) {
    if (typeof content !== 'string' || !content.trim()) return;
    if (role !== 'user' && role !== 'assistant') return;

    chatHistory.push({
      role: role,
      content: content.trim()
    });

    /* Keep only the most recent messages. */
    if (chatHistory.length > MAX_HISTORY_MESSAGES) {
      chatHistory = chatHistory.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  /** Return a shallow copy of the history for the request payload. */
  function snapshotHistory() {
    return chatHistory.map(function (entry) {
      return { role: entry.role, content: entry.content };
    });
  }

  /* =========================================================
     7. MESSAGE RENDERING
     ========================================================= */

  /** Create the avatar badge shown next to each message. */
  function createAvatar(kind) {
    var avatar = document.createElement('span');
    avatar.className =
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
      (kind === 'user'
        ? 'bg-slate-200 text-slate-600'
        : 'bg-indigo-600 text-white');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = kind === 'user' ? 'You' : 'AI';
    return avatar;
  }

  /** Create the author label shown above each bubble. */
  function createAuthorLabel(kind) {
    var label = document.createElement('p');
    label.className = 'mb-1 text-xs font-semibold text-slate-500';
    label.textContent = kind === 'user' ? 'You' : 'CareerPath AI';
    return label;
  }

  /** Create the speech bubble containing the message text. */
  function createBubble(text, kind) {
    var bubble = document.createElement('div');
    bubble.className =
      kind === 'user'
        ? 'rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3'
        : 'rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3';

    var p = document.createElement('p');
    p.className =
      'text-sm leading-relaxed ' +
      (kind === 'user' ? 'text-white' : 'text-slate-700');
    /* textContent keeps user input safe — no HTML injection. */
    p.textContent = text;

    bubble.appendChild(p);
    return bubble;
  }

  /**
   * Append a chat message to the log.
   * @param {string} text  The message body.
   * @param {'user'|'ai'} kind  Who sent it.
   */
  function appendMessage(text, kind) {
    if (!els.messages) return;

    var row = document.createElement('div');
    row.className =
      kind === 'user'
        ? 'flex items-start justify-end gap-3'
        : 'flex items-start gap-3';

    var inner = document.createElement('div');
    inner.className = kind === 'user' ? 'max-w-[85%] text-right' : 'max-w-[85%]';

    inner.appendChild(createAuthorLabel(kind));
    inner.appendChild(createBubble(text, kind));

    if (kind === 'user') {
      row.appendChild(inner);
      row.appendChild(createAvatar('user'));
    } else {
      row.appendChild(createAvatar('ai'));
      row.appendChild(inner);
    }

    els.messages.appendChild(row);
    scrollToBottom();
  }

  /* =========================================================
     8. STATUS + ERROR UI
     ========================================================= */

  /** Update the small status line under the chat header. */
  function setStatus(state) {
    if (!els.status) return;

    /* Rebuild the status line, keeping the coloured dot. */
    els.status.textContent = '';

    var dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');

    var label = document.createElement('span');

    if (state === 'thinking') {
      dot.className = 'h-2 w-2 rounded-full bg-amber-500';
      label.textContent = 'Thinking...';
    } else if (state === 'error') {
      dot.className = 'h-2 w-2 rounded-full bg-red-500';
      label.textContent = 'Connection issue';
    } else {
      dot.className = 'h-2 w-2 rounded-full bg-emerald-500';
      label.textContent = 'AI Assistant';
    }

    els.status.appendChild(dot);
    els.status.appendChild(label);
  }

  /** Display an error message above the input. */
  function showError(message) {
    if (!els.error) return;
    els.error.textContent = '';

    var p = document.createElement('p');
    p.className = 'text-sm font-medium text-red-700';
    p.textContent = message;
    els.error.appendChild(p);

    show(els.error);
  }

  /** Clear any visible error message. */
  function clearError() {
    if (!els.error) return;
    els.error.textContent = '';
    hide(els.error);
  }

  /* =========================================================
     9. INPUT + BUTTON STATE
     ========================================================= */

  /** Enable or disable the send button and textarea together. */
  function setBusy(busy) {
    isSending = busy;

    if (els.send) {
      els.send.disabled = busy;
      els.send.classList.toggle('opacity-60', busy);
      els.send.classList.toggle('cursor-not-allowed', busy);
    }
    if (els.input) {
      els.input.disabled = busy;
    }
    if (busy) {
      show(els.typing);
      setStatus('thinking');
    } else {
      hide(els.typing);
      setStatus('idle');
    }
  }

  /** Refresh the character counter and enforce the maximum length. */
  function updateCharacterCount() {
    if (!els.input || !els.counter) return;

    var length = els.input.value.length;
    if (length > MAX_LENGTH) {
      els.input.value = els.input.value.slice(0, MAX_LENGTH);
      length = MAX_LENGTH;
    }
    els.counter.textContent = String(length);
  }

  /** Clear the textarea and reset the counter. */
  function resetInput() {
    if (els.input) els.input.value = '';
    if (els.counter) els.counter.textContent = '0';
  }

  /* =========================================================
     10. API COMMUNICATION
     ========================================================= */

  /**
   * Send a message to the Python backend and return the AI reply.
   * The current conversation history is included so the model can
   * remember what was discussed earlier in this session.
   *
   * @param {string} message  The user's new message.
   * @param {Array}  history  Snapshot of the conversation so far
   *                          (excluding the new user message).
   * Resolves with the reply string, rejects with an Error on failure.
   */
  function requestAI(message, history) {
    var controller = null;
    var timeoutId = null;

    /* Abort the request if the backend takes too long. */
    if (typeof AbortController === 'function') {
      controller = new AbortController();
      timeoutId = window.setTimeout(function () {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
    }

    var options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        career_context: careerContext,
        history: history || []
      })
    };

    if (controller) {
      options.signal = controller.signal;
    }

    return fetch(API_URL, options)
      .then(function (response) {
        if (timeoutId) window.clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Server responded with status ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        /* Accept a few common reply shapes from the backend. */
        var reply = null;
        if (data && typeof data === 'object') {
          if (typeof data.reply === 'string') reply = data.reply;
          else if (typeof data.response === 'string') reply = data.response;
          else if (typeof data.message === 'string') reply = data.message;
          else if (typeof data.answer === 'string') reply = data.answer;
          else if (Array.isArray(data.choices) && data.choices[0]) {
            var first = data.choices[0];
            if (typeof first.text === 'string') reply = first.text;
            else if (first.message && typeof first.message.content === 'string') {
              reply = first.message.content;
            }
          }
        }

        if (!reply) {
          throw new Error('The AI response was empty or in an unexpected format.');
        }
        return reply.trim();
      })
      .catch(function (err) {
        if (timeoutId) window.clearTimeout(timeoutId);

        if (err && err.name === 'AbortError') {
          throw new Error('The request timed out. Please try again.');
        }
        throw err;
      });
  }

  /* =========================================================
     11. MAIN SEND HANDLER
     ========================================================= */

  function handleSend() {
    /* Guard against duplicate submissions while a request is in flight. */
    if (isSending) return;
    if (!els.input) return;

    var message = els.input.value.trim();
    if (!message) {
      /* Nothing to send — keep the user in the input. */
      els.input.focus();
      return;
    }

    /* Enforce the maximum length one more time. */
    if (message.length > MAX_LENGTH) {
      message = message.slice(0, MAX_LENGTH);
    }

    clearError();

    /* Show the user's message immediately. */
    appendMessage(message, 'user');
    resetInput();

    /*
      Add the user's message to the in-memory history *before* making
      the request. The snapshot sent to the backend excludes the new
      user message because the backend adds it separately.
    */
    var historyForRequest = snapshotHistory();
    pushHistory('user', message);

    /* Enter the busy state while we wait for the backend. */
    setBusy(true);

    requestAI(message, historyForRequest)
      .then(function (reply) {
        /* Only remember the assistant message on success. */
        pushHistory('assistant', reply);
        appendMessage(reply, 'ai');
      })
      .catch(function (err) {
        /*
          On failure we DO NOT add an assistant message to history.
          The UI keeps its error banner and the history stays clean
          so the next successful request does not include a fake reply.
        */
        var text = (err && err.message) ? err.message : 'Something went wrong. Please try again.';
        showError('Could not reach the AI counselor. ' + text);
        setStatus('error');
      })
      .then(function () {
        /* Always return the UI to an interactive state. */
        setBusy(false);
        if (els.input) els.input.focus();
      });
  }

  /* =========================================================
     12. QUICK QUESTIONS
     ========================================================= */

  function setupQuickQuestions() {
    var buttons = document.querySelectorAll('.quick-question');
    if (!buttons || !buttons.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        if (!els.input) return;

        var question = btn.getAttribute('data-question') || btn.textContent.trim();
        if (!question) return;

        /* Place the question into the input so the user can review it first. */
        els.input.value = question.slice(0, MAX_LENGTH);
        updateCharacterCount();
        els.input.focus();
      });
    });
  }

  /* =========================================================
     13. KEYBOARD HANDLING
     ---------------------------------------------------------
     Enter inside the message textarea must trigger handleSend()
     without triggering a native form submit (which would reload
     the page). Shift + Enter keeps the newline behaviour.
     ========================================================= */

  function setupKeyboard() {
    if (!els.input) return;

    els.input.addEventListener('keydown', function (event) {
      /* Enter sends, Shift + Enter inserts a newline. */
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        handleSend();
      }
    });

    els.input.addEventListener('input', updateCharacterCount);
  }

  /* =========================================================
     14. FORM SUBMISSION HANDLING
     ---------------------------------------------------------
     The chat form has a submit button. By default, clicking
     that button (or pressing Enter in a single-line input)
     triggers a native form submission, which reloads the page.

     We intercept BOTH the form's `submit` event and the Send
     button's `click` event and call preventDefault() in each.
     This guarantees the page never reloads, whether the user
     clicks the button or triggers submission another way.

     The `isSending` flag inside handleSend() prevents duplicate
     requests if both handlers somehow fire for the same action.
     ========================================================= */

  /** Attach all listeners that guard against native form submission. */
  function setupFormHandling() {
    var form = document.getElementById('chat-form');

    /* --- 1. Form-level submit guard ------------------------------
       Capturing phase is used so this runs before any other
       listener. The native submit is cancelled here and the
       message is dispatched through fetch() instead.            */
    if (form) {
      form.addEventListener('submit', function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
        }
        handleSend();
        return false;
      }, true);

      /* Fallback for any legacy inline submit path. */
      form.setAttribute('novalidate', 'novalidate');
    }

    /* --- 2. Button-level click guard -----------------------------
       preventDefault() on a click of a type="submit" button stops
       the browser from dispatching the form's submit event at all. */
    if (els.send) {
      els.send.addEventListener('click', function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        handleSend();
        return false;
      });
    }
  }

  /* =========================================================
     15. INITIALISATION
     ========================================================= */

  function cacheElements() {
    els.messages = document.getElementById('chat-messages');
    els.input = document.getElementById('chat-input');
    els.send = document.getElementById('send-message');
    els.typing = document.getElementById('typing-indicator');
    els.error = document.getElementById('chat-error');
    els.counter = document.getElementById('character-count');
    els.status = document.getElementById('chat-status');

    /* Career context fields. */
    els.targetCareer = document.getElementById('target-career');
    els.currentLevel = document.getElementById('current-level');
    els.learningTime = document.getElementById('learning-time');
    els.careerFocus = document.getElementById('career-focus');
  }

  function initialize() {
    cacheElements();

    /* If the core chat container is missing, there is nothing to do. */
    if (!els.messages || !els.input) return;

    /* Start with an empty conversation for this page session. */
    chatHistory = [];

    /* Load and display the career context. */
    careerContext = buildCareerContext();
    renderCareerContext();

    /* Make sure the typing indicator starts hidden. */
    hide(els.typing);
    hide(els.error);

    /* Wire up interactions. */
    setupKeyboard();
    setupQuickQuestions();
    setupFormHandling();

    /* Initial UI state. */
    updateCharacterCount();
    setStatus('idle');
  }

  /* Run after the DOM is ready. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
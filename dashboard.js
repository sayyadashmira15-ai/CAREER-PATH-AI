/* =====================================================================
   CareerPath AI — dashboard.js
   ---------------------------------------------------------------------
   Populates the dashboard with the real assessment result stored in
   localStorage under the key `careerAssessmentResult`.

   If no result is found, an empty state is shown prompting the user
   to complete the assessment.

   No API, no Firebase, no external libraries. Vanilla JS only.
   ===================================================================== */

(function () {
  'use strict';

  /* =========================================================
     1. CONFIGURATION
     ========================================================= */

  var STORAGE = {
    assessment: 'careerAssessmentResult',
    profile: 'studentProfile'
  };

  /* =========================================================
     2. CAREER CATALOGUE
     All dashboard content per career lives here.
     Skill levels are illustrative starting points.
     ========================================================= */

  var CAREER_DATA = {

    /* ---------------- AI / ML ---------------- */
    ai_ml: {
      name: 'AI / Machine Learning Engineer',
      shortName: 'AI / ML Engineer',
      description:
        'AI and Machine Learning Engineers design, train and deploy models that help systems learn from data. ' +
        'The role combines programming, mathematics and experimentation, and is a good fit if you enjoy logical ' +
        'problem solving and building things that improve over time.',
      focus: 'Artificial Intelligence / Machine Learning',
      startingPoint: 'Python and Statistics',
      prepTime: '6–12 months of consistent practice',
      reasons: [
        'You selected an interest in working with AI and intelligent systems.',
        'You prefer solving analytical problems rather than purely visual or design-led ones.',
        'You are willing to build a foundation in mathematics and statistics alongside programming.'
      ],
      improvements: [
        'Mathematics and statistics fundamentals',
        'Data handling with NumPy and Pandas',
        'Core machine learning concepts and workflows'
      ],
      strengthsFallback: [
        'Logical thinking and structured problem solving',
        'Consistent interest in technology and computing',
        'Willingness to learn through hands-on projects'
      ],
      skills: [
        { name: 'Python', level: 55 },
        { name: 'Mathematics & Statistics', level: 40 },
        { name: 'NumPy & Pandas', level: 30 },
        { name: 'Machine Learning', level: 20 },
        { name: 'Deep Learning', level: 10 }
      ],
      prioritySkills: [
        { title: '1. Python for Data Science', priority: 'High', tone: 'red',
          explanation: 'Strengthen the core language skills you will use in every project.' },
        { title: '2. NumPy and Pandas', priority: 'High', tone: 'red',
          explanation: 'Learn to load, clean and reshape data before any model is trained.' },
        { title: '3. Statistics Fundamentals', priority: 'Medium', tone: 'amber',
          explanation: 'Understand probability, distributions and how to evaluate results.' },
        { title: '4. Machine Learning Basics', priority: 'Medium', tone: 'amber',
          explanation: 'Study supervised learning, model training and performance evaluation.' }
      ],
      project: {
        title: 'Student Performance Prediction System',
        description: 'Build a machine learning project that analyzes student-related data and predicts academic performance.',
        difficulty: 'Beginner',
        difficultyTone: 'slate',
        skills: ['Python', 'Pandas', 'Machine Learning']
      }
    },

    /* ---------------- Full Stack ---------------- */
    full_stack: {
      name: 'Full Stack Developer',
      shortName: 'Full Stack Developer',
      description:
        'Full Stack Developers build complete web applications — from the user interface through to the server, ' +
        'database and APIs. The role suits people who enjoy working across many layers of a product and seeing ' +
        'their work come together in the browser.',
      focus: 'Full Stack Development',
      startingPoint: 'HTML, CSS and JavaScript',
      prepTime: '4–9 months of consistent practice',
      reasons: [
        'You are interested in building web applications end to end.',
        'You enjoy programming and working with code day to day.',
        'You prefer learning by shipping real projects.'
      ],
      improvements: [
        'Modern JavaScript patterns and tooling',
        'Backend frameworks and API design',
        'Relational and non-relational databases'
      ],
      strengthsFallback: [
        'Comfortable picking up new programming tools',
        'Interest in both visual and logical problem solving',
        'Motivation to build and finish real projects'
      ],
      skills: [
        { name: 'HTML & CSS', level: 60 },
        { name: 'JavaScript', level: 45 },
        { name: 'React', level: 30 },
        { name: 'Backend Development', level: 25 },
        { name: 'Databases', level: 20 }
      ],
      prioritySkills: [
        { title: '1. Advanced JavaScript', priority: 'High', tone: 'red',
          explanation: 'Master modern syntax, async patterns and the DOM before moving on.' },
        { title: '2. React', priority: 'High', tone: 'red',
          explanation: 'Learn component thinking, state and props to build interactive interfaces.' },
        { title: '3. Backend Development', priority: 'Medium', tone: 'amber',
          explanation: 'Understand routing, authentication and how to expose data over APIs.' },
        { title: '4. Databases', priority: 'Medium', tone: 'amber',
          explanation: 'Learn to model, query and persist data reliably.' }
      ],
      project: {
        title: 'Student Career Portal',
        description: 'Build a full stack web application where students can create profiles, browse careers and track their progress.',
        difficulty: 'Beginner',
        difficultyTone: 'slate',
        skills: ['HTML/CSS', 'JavaScript', 'Node.js']
      }
    },

    /* ---------------- Data Science ---------------- */
    data_science: {
      name: 'Data Scientist',
      shortName: 'Data Scientist',
      description:
        'Data Scientists turn raw data into clear insights using statistics, programming and predictive modelling. ' +
        'The role suits people who enjoy asking questions of data and communicating what they find.',
      focus: 'Data Science',
      startingPoint: 'Python and Statistics',
      prepTime: '6–12 months of consistent practice',
      reasons: [
        'You are interested in analysing data and finding patterns.',
        'You enjoy analytical problems that need careful reasoning.',
        'You are comfortable building skills in mathematics and statistics.'
      ],
      improvements: [
        'Statistics and probability foundations',
        'Data cleaning and exploration with Pandas',
        'Introductory machine learning techniques'
      ],
      strengthsFallback: [
        'Curiosity about data and how things work',
        'Analytical, detail-oriented thinking',
        'Willingness to work with numbers and code'
      ],
      skills: [
        { name: 'Python', level: 55 },
        { name: 'Statistics', level: 45 },
        { name: 'Pandas', level: 35 },
        { name: 'Data Visualization', level: 30 },
        { name: 'Machine Learning', level: 20 }
      ],
      prioritySkills: [
        { title: '1. Python for Data Analysis', priority: 'High', tone: 'red',
          explanation: 'Build fluency in the language used across every data workflow.' },
        { title: '2. Pandas', priority: 'High', tone: 'red',
          explanation: 'Learn to clean, transform and summarise real datasets.' },
        { title: '3. Statistics', priority: 'Medium', tone: 'amber',
          explanation: 'Understand sampling, distributions and hypothesis testing.' },
        { title: '4. Machine Learning', priority: 'Medium', tone: 'amber',
          explanation: 'Apply models to make predictions from the data you prepare.' }
      ],
      project: {
        title: 'Student Placement Data Analysis',
        description: 'Analyse a placement dataset to uncover which factors correlate with successful outcomes, then present the findings.',
        difficulty: 'Beginner',
        difficultyTone: 'slate',
        skills: ['Python', 'Pandas', 'Statistics']
      }
    },

    /* ---------------- Cyber Security ---------------- */
    cyber_security: {
      name: 'Cyber Security Analyst',
      shortName: 'Cyber Security Analyst',
      description:
        'Cyber Security Analysts monitor systems, investigate threats and strengthen the security of networks and ' +
        'applications. The role suits people who enjoy logical detective work and protecting systems from attack.',
      focus: 'Cyber Security',
      startingPoint: 'Networking and Linux',
      prepTime: '6–12 months of consistent practice',
      reasons: [
        'You are interested in security and how systems can be protected.',
        'You enjoy logical, investigative problem solving.',
        'You are willing to learn technical tools and networking fundamentals.'
      ],
      improvements: [
        'Networking and Linux fundamentals',
        'Core security concepts and threat models',
        'Hands-on practice with security tooling'
      ],
      strengthsFallback: [
        'Careful, methodical approach to problems',
        'Interest in how systems and networks operate',
        'Comfortable working through technical detail'
      ],
      skills: [
        { name: 'Networking', level: 45 },
        { name: 'Linux', level: 40 },
        { name: 'Security Fundamentals', level: 30 },
        { name: 'Ethical Hacking', level: 20 },
        { name: 'Incident Response', level: 15 }
      ],
      prioritySkills: [
        { title: '1. Networking', priority: 'High', tone: 'red',
          explanation: 'Understand how data travels across networks before learning to defend them.' },
        { title: '2. Linux', priority: 'High', tone: 'red',
          explanation: 'Get comfortable with the command line and the systems you will be securing.' },
        { title: '3. Security Fundamentals', priority: 'Medium', tone: 'amber',
          explanation: 'Learn core concepts such as authentication, encryption and access control.' },
        { title: '4. Ethical Hacking', priority: 'Medium', tone: 'amber',
          explanation: 'Practice finding weaknesses safely in controlled lab environments.' }
      ],
      project: {
        title: 'Web Security Vulnerability Scanner',
        description: 'Build a small tool that checks a web application for common misconfigurations and reports the findings.',
        difficulty: 'Beginner',
        difficultyTone: 'slate',
        skills: ['Python', 'Networking', 'Security Fundamentals']
      }
    }
  };

  /* Unknown-career fallback so the page never breaks. */
  var UNKNOWN_CAREER = {
    name: 'Your Career Match',
    shortName: 'Your Career Match',
    description: 'This career path appeared in your assessment results.',
    focus: 'General Career Development',
    startingPoint: 'Core fundamentals',
    prepTime: 'Varies by background',
    reasons: [
      'It appeared as a match in your assessment results.',
      'It aligns with the interests you selected.',
      'You can explore it further on the roadmap page.'
    ],
    improvements: [
      'Explore the fundamentals of this field',
      'Identify the core tools used in the role',
      'Build a small project to test your interest'
    ],
    strengthsFallback: [
      'You are open to exploring new directions',
      'You completed the career assessment',
      'You are ready to plan your next steps'
    ],
    skills: [
      { name: 'Foundations', level: 40 },
      { name: 'Core Tools', level: 30 },
      { name: 'Applied Practice', level: 20 },
      { name: 'Projects', level: 15 },
      { name: 'Specialisation', level: 10 }
    ],
    prioritySkills: [
      { title: '1. Foundations', priority: 'High', tone: 'red',
        explanation: 'Start with the concepts that every role in this field relies on.' },
      { title: '2. Core Tools', priority: 'High', tone: 'red',
        explanation: 'Learn the tools you will use day to day.' },
      { title: '3. Applied Practice', priority: 'Medium', tone: 'amber',
        explanation: 'Apply what you learn to small, focused exercises.' },
      { title: '4. Projects', priority: 'Medium', tone: 'amber',
        explanation: 'Build something end to end to consolidate your skills.' }
    ],
    project: {
      title: 'Exploration Project',
      description: 'Build a small project that lets you try the core activities of this career.',
      difficulty: 'Beginner',
      difficultyTone: 'slate',
      skills: ['Fundamentals', 'Problem Solving']
    }
  };

  /* =========================================================
     3. UTILITIES
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

  /** Map any career id or name to a known key in CAREER_DATA. */
  function normalizeCareerKey(id, name) {
    var candidates = [id, name];
    for (var i = 0; i < candidates.length; i++) {
      var raw = candidates[i];
      if (!raw) continue;

      var s = String(raw).toLowerCase().replace(/[\s\-\/]+/g, '_');
      if (CAREER_DATA[s]) return s;

      if (s.indexOf('ai') !== -1 || s.indexOf('ml') !== -1 || s.indexOf('machine') !== -1) return 'ai_ml';
      if (s.indexOf('full') !== -1 || s.indexOf('stack') !== -1 || s.indexOf('web') !== -1) return 'full_stack';
      if (s.indexOf('data') !== -1 || s.indexOf('scientist') !== -1) return 'data_science';
      if (s.indexOf('cyber') !== -1 || s.indexOf('security') !== -1) return 'cyber_security';
    }
    return null;
  }

  /** Resolve the career object from a raw id + optional name. */
  function resolveCareer(rawId, rawName) {
    var key = normalizeCareerKey(rawId, rawName);
    if (key && CAREER_DATA[key]) return CAREER_DATA[key];

    /* Unknown: clone the fallback and override name if given. */
    var copy = JSON.parse(JSON.stringify(UNKNOWN_CAREER));
    if (rawName) {
      copy.name = rawName;
      copy.shortName = rawName;
    }
    return copy;
  }

  /** Return a numeric match from a career entry (supports `match` or `score`). */
  function readMatch(careerEntry) {
    if (!careerEntry) return null;
    if (typeof careerEntry.match === 'number') return careerEntry.match;
    if (typeof careerEntry.score === 'number') return careerEntry.score;
    return null;
  }

  /** Set textContent only if the element exists. */
  function setText(el, text) {
    if (el && text !== undefined && text !== null) {
      el.textContent = text;
    }
  }

  /** Create an element with optional className + textContent. */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /* =========================================================
     4. EMPTY STATE
     ========================================================= */

  function showEmptyState() {
    var empty = document.getElementById('empty-state');
    var content = document.getElementById('dashboard-content');
    if (empty) empty.classList.remove('hidden');
    if (content) content.classList.add('hidden');
  }

  function showContent() {
    var empty = document.getElementById('empty-state');
    var content = document.getElementById('dashboard-content');
    if (empty) empty.classList.add('hidden');
    if (content) content.classList.remove('hidden');
  }

  /* =========================================================
     5. WELCOME NAME
     ========================================================= */

  function renderWelcome() {
    var el = document.getElementById('welcome-text');
    if (!el) return;

    var name = 'Student';
    var profile = readStorage(STORAGE.profile);
    if (profile) {
      var candidate = profile.name || profile.fullName || profile.studentName || '';
      if (typeof candidate === 'string' && candidate.trim()) {
        name = candidate.trim();
      }
    }
    el.textContent = 'Welcome, ' + name;
  }

  /* =========================================================
     6. PRIMARY CAREER CARD
     ========================================================= */

  function renderPrimary(result, career) {
    /* Title + description */
    setText(document.getElementById('primary-career-name'), career.name);
    setText(document.getElementById('primary-career-description'), career.description);

    /* Reasons */
    var reasonsList = document.getElementById('primary-career-reasons');
    if (reasonsList) {
      reasonsList.textContent = '';
      (career.reasons || []).slice(0, 3).forEach(function (reason) {
        var li = el('li', 'flex items-start gap-2.5');

        var dot = el('span', 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600');
        dot.setAttribute('aria-hidden', 'true');

        var span = el('span', 'text-sm leading-relaxed text-slate-600', reason);

        li.appendChild(dot);
        li.appendChild(span);
        reasonsList.appendChild(li);
      });
    }

    /* Match value + bar */
    var match = readMatch(result.primaryCareer);
    var matchEl = document.getElementById('primary-career-match');
    setText(matchEl, match !== null ? (match + '%') : '—');

    var bar = document.getElementById('primary-career-match-bar');
    var fill = document.getElementById('primary-career-match-bar-fill');
    if (bar && fill) {
      var safeMatch = match !== null ? Math.max(0, Math.min(100, match)) : 0;
      bar.setAttribute('aria-valuenow', String(safeMatch));
      bar.setAttribute('aria-label', 'Assessment match for ' + career.name);
      fill.style.width = safeMatch + '%';
    }

    /* Match panel */
    setText(document.getElementById('match-career-goal'), career.shortName);
    setText(document.getElementById('match-starting-point'), career.startingPoint);
    setText(document.getElementById('match-prep-time'), career.prepTime);
    setText(document.getElementById('match-learning-time'), result.learningTime || 'Not available');
    setText(document.getElementById('match-experience-level'), result.experienceLevel || 'Not available');

    /* Strengths — prefer assessment strengths, fall back to career defaults */
    var strengthsList = document.getElementById('primary-career-strengths');
    if (strengthsList) {
      strengthsList.textContent = '';
      var strengths = Array.isArray(result.strengths) && result.strengths.length
        ? result.strengths
        : career.strengthsFallback;

      strengths.slice(0, 4).forEach(function (s) {
        var li = el('li', 'flex items-start gap-2.5');

        var dot = el('span', 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500');
        dot.setAttribute('aria-hidden', 'true');

        var span = el('span', 'text-sm leading-relaxed text-slate-600', s);

        li.appendChild(dot);
        li.appendChild(span);
        strengthsList.appendChild(li);
      });
    }

    /* Skills to improve */
    var impList = document.getElementById('primary-career-improvements');
    if (impList) {
      impList.textContent = '';
      (career.improvements || []).slice(0, 3).forEach(function (s) {
        var li = el('li', 'flex items-start gap-2.5');

        var dot = el('span', 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500');
        dot.setAttribute('aria-hidden', 'true');

        var span = el('span', 'text-sm leading-relaxed text-slate-600', s);

        li.appendChild(dot);
        li.appendChild(span);
        impList.appendChild(li);
      });
    }
  }

  /* =========================================================
     7. ALTERNATIVE CAREERS
     ========================================================= */

  var ALT_ICONS = {
    ai_ml:
      '<path d="M11 3.75 12.6 8.1 17 9.75l-4.4 1.65L11 15.75 9.4 11.4 5 9.75l4.4-1.65L11 3.75Z" />' +
      '<path d="m17.75 15 .7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />',
    full_stack:
      '<path d="m9 7.5-4.5 4.5L9 16.5M15 7.5l4.5 4.5L15 16.5" />',
    data_science:
      '<path d="M4 20h16" /><path d="M7.5 20v-6M12 20V7.5M16.5 20v-9" />',
    cyber_security:
      '<path d="M12 3 5 5.75v5.5c0 4.2 2.9 7.6 7 9.75 4.1-2.15 7-5.55 7-9.75v-5.5L12 3Z" />' +
      '<path d="m9.5 12 1.75 1.75L15 10" />'
  };

  function renderAlternatives(result) {
    var grid = document.getElementById('alternatives-grid');
    if (!grid) return;
    grid.textContent = '';

    var alternatives = Array.isArray(result.alternatives) ? result.alternatives : [];

    /* Fall back to secondaryCareer if no alternatives list exists. */
    if (alternatives.length === 0 && result.secondaryCareer) {
      alternatives = [result.secondaryCareer];
    }

    if (alternatives.length === 0) {
      grid.appendChild(el('p', 'text-sm text-slate-500', 'No alternative career paths available.'));
      return;
    }

    alternatives.forEach(function (alt) {
      var career = resolveCareer(alt.id, alt.name);
      var key = normalizeCareerKey(alt.id, alt.name) || 'ai_ml';
      var match = readMatch(alt);
      var matchText = match !== null ? (match + '% match') : 'Match not available';
      var iconSvg = ALT_ICONS[key] || ALT_ICONS.ai_ml;

      var article = el('article', 'flex flex-col rounded-2xl border border-slate-200 bg-white p-6');

      var header = el('div', 'flex items-start justify-between gap-4');

      var iconWrap = el('span', 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600');
      iconWrap.innerHTML =
        '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        iconSvg +
        '</svg>';

      var badge = el('span', 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700', matchText);

      header.appendChild(iconWrap);
      header.appendChild(badge);

      var title = el('h3', 'mt-5 text-base font-semibold text-slate-900', career.name);
      var desc = el('p', 'mt-2 flex-1 text-sm leading-relaxed text-slate-600', career.description);

      var link = el('a', 'mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600', 'Explore Career');
      link.setAttribute('href', 'roadmap.html');

      article.appendChild(header);
      article.appendChild(title);
      article.appendChild(desc);
      article.appendChild(link);

      grid.appendChild(article);
    });
  }

  /* =========================================================
     8. SKILL GAP
     ========================================================= */

  function renderSkillGap(career) {
    /* Heading */
    setText(document.getElementById('skill-gap-heading-text'), 'Current level for ' + career.shortName);

    var list = document.getElementById('skill-gap-list');
    if (!list) return;
    list.textContent = '';

    (career.skills || []).forEach(function (skill) {
      var li = document.createElement('li');

      var row = el('div', 'flex items-center justify-between gap-4');
      row.appendChild(el('span', 'text-sm font-medium text-slate-700', skill.name));
      row.appendChild(el('span', 'text-sm font-semibold text-slate-900', skill.level + '%'));

      var bar = el('div', 'mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', skill.name);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(skill.level));

      var fill = el('div', 'h-full rounded-full bg-indigo-600');
      fill.style.width = skill.level + '%';
      bar.appendChild(fill);

      li.appendChild(row);
      li.appendChild(bar);
      list.appendChild(li);
    });
  }

  /* =========================================================
     9. PRIORITY SKILLS
     ========================================================= */

  function renderPrioritySkills(career) {
    var ol = document.getElementById('priority-skills-list');
    if (!ol) return;
    ol.textContent = '';

    (career.prioritySkills || []).forEach(function (skill) {
      var li = el('li', 'rounded-xl border border-slate-200 bg-slate-50 p-4');

      var top = el('div', 'flex items-start justify-between gap-3');
      top.appendChild(el('span', 'text-sm font-semibold text-slate-900', skill.title));

      var priorityClass = skill.tone === 'red'
        ? 'shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700'
        : 'shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700';
      top.appendChild(el('span', priorityClass, skill.priority));

      var desc = el('p', 'mt-2 text-sm leading-relaxed text-slate-600', skill.explanation);

      li.appendChild(top);
      li.appendChild(desc);
      ol.appendChild(li);
    });
  }

  /* =========================================================
     10. RECOMMENDED PROJECT
     ========================================================= */

  function renderProject(career) {
    var container = document.getElementById('project-card-container');
    if (!container) return;
    container.textContent = '';

    var project = career.project;

    var article = el('article', 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8');

    var headerRow = el('div', 'flex flex-wrap items-center gap-3');
    headerRow.appendChild(el('span', 'rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700', 'Project suggestion'));

    var diffClass;
    if (project.difficultyTone === 'amber') {
      diffClass = 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700';
    } else if (project.difficultyTone === 'red') {
      diffClass = 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700';
    } else {
      diffClass = 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700';
    }
    headerRow.appendChild(el('span', diffClass, 'Difficulty: ' + project.difficulty));

    var title = el('h3', 'mt-5 text-xl font-bold tracking-tight text-slate-900', project.title);
    var desc = el('p', 'mt-3 max-w-3xl text-base leading-relaxed text-slate-600', project.description);

    var skillsWrap = el('div', 'mt-6');
    skillsWrap.appendChild(el('h4', 'text-xs font-semibold uppercase tracking-wide text-slate-500', 'Suggested skills'));

    var skillsList = el('ul', 'mt-3 flex flex-wrap gap-2');
    (project.skills || []).forEach(function (s) {
      skillsList.appendChild(el('li', 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700', s));
    });
    skillsWrap.appendChild(skillsList);

    var actions = el('div', 'mt-8 border-t border-slate-200 pt-6');

    var link = el('a', 'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600', 'View Roadmap');
    link.setAttribute('href', 'roadmap.html');
    link.innerHTML +=
      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 12h14M13 6l6 6-6 6" />' +
      '</svg>';

    actions.appendChild(link);

    article.appendChild(headerRow);
    article.appendChild(title);
    article.appendChild(desc);
    article.appendChild(skillsWrap);
    article.appendChild(actions);

    container.appendChild(article);
  }

  /* =========================================================
     11. MAIN INITIALISATION
     ========================================================= */

  function initialize() {
    var result = readStorage(STORAGE.assessment);

    if (!result || !result.primaryCareer) {
      showEmptyState();
      return;
    }

    var career = resolveCareer(result.primaryCareer.id, result.primaryCareer.name);

    renderWelcome();
    renderPrimary(result, career);
    renderAlternatives(result);
    renderSkillGap(career);
    renderPrioritySkills(career);
    renderProject(career);

    showContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
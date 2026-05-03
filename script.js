// ============================================================
//  Prioritix — script.js  (fully rewritten with all fixes)
// ============================================================

// ── Supabase init ────────────────────────────────────────────
const SUPABASE_URL = 'https://jakfuclvwydjuruiryhn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impha2Z1Y2x2d3lkanVydWlyeWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTQ0ODQsImV4cCI6MjA5MzMzMDQ4NH0.VpaPBZs2hvfeI2ImG_R8QWvRjTRtWNpebDF4oCyWiC4';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── App state ────────────────────────────────────────────────
let appState = {
    user: null,
    theme: 'light',
    tasks: [],
    events: [],
    notes: [],
    flashcards: [],
    formulas: [],
    subjects: {
        notes: ['General'],
        flashcards: ['General'],
        formulas: ['General']
    },
    moodHistory: [],
    reflections: [],
    emergencyContacts: [
        { name: 'Crisis Hotline', number: '988' }
    ],
    analytics: {
        tasksCompleted: 0,
        studyHours: 0,
        pomodoroSessions: 0,
        flashcardsReviewed: 0
    },
    firstTimeUser: true,
    currentCalendarMonth: new Date().getMonth(),
    currentCalendarYear: new Date().getFullYear()
};

// ── Timer state ──────────────────────────────────────────────
let timerState = {
    mode: 'pomodoro',
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    interval: null
};

// ── Tour state ───────────────────────────────────────────────
let tourState = {
    currentStep: 0,
    isActive: false,
    steps: [
        { target: '.logo',               title: 'Welcome to Prioritix!',    description: 'Your personal productivity companion designed to help students manage tasks, stay focused, and maintain well-being.' },
        { target: '.sidebar',            title: 'Navigation Sidebar',       description: 'Access all your tools from here: Task Manager, Focus Mode, Academic Calendar, Learning resources, Analytics, and Mental Health support.' },
        { target: '#tasks-section',      title: 'Task Manager',             description: 'Organize your tasks using the Eisenhower Matrix. Drag and drop tasks between quadrants based on urgency and importance.' },
        { target: '#focus-section',      title: 'Focus Mode',               description: 'Use the Pomodoro timer to maintain focus during study sessions. Set custom timers and get productivity tips.' },
        { target: '#calendar-section',   title: 'Academic Calendar',        description: 'Track your exams, assignments, and study sessions. Click on any date to view or manage events.' },
        { target: '#learning-section',   title: 'Learning & Revision',      description: 'Create notes, flashcards, and formula cards organized by subject. Perfect for exam preparation.' },
        { target: '#analytics-section',  title: 'Analytics Dashboard',      description: 'Track your productivity over time with visual graphs and statistics. Monitor your progress and habits.' },
        { target: '#mental-health-section', title: 'Mental Well-Being',     description: 'Log your mood, write daily reflections, and access mental health resources and emergency contacts.' },
        { target: '.theme-toggle',       title: 'Dark Mode',                description: 'Toggle between light and dark mode for comfortable viewing during day or night study sessions.' }
    ]
};

// ── Tips arrays ──────────────────────────────────────────────
const focusTips = [
    "Start with your most challenging task when your energy is highest.",
    "Use the 2-minute rule: if a task takes less than 2 minutes, do it now.",
    "Break large tasks into smaller, manageable chunks.",
    "Set specific goals for each study session.",
    "Eliminate distractions by putting your phone in another room.",
    "Take short walks between study sessions to refresh your mind.",
    "Use active recall techniques instead of passive reading.",
    "Teach concepts to others to reinforce your understanding.",
    "Create a dedicated study space free from interruptions.",
    "Stay hydrated and keep healthy snacks nearby."
];

const healthTips = [
    "Take regular breaks to stretch and rest your eyes.",
    "Practice the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.",
    "Maintain good posture while studying to prevent back pain.",
    "Get at least 7-8 hours of sleep for optimal brain function.",
    "Exercise regularly to boost concentration and memory.",
    "Eat brain-healthy foods like nuts, berries, and fish.",
    "Practice deep breathing exercises to reduce stress.",
    "Stay hydrated by drinking water throughout the day.",
    "Limit caffeine intake, especially in the afternoon.",
    "Practice mindfulness meditation for 10 minutes daily."
];

const mentalHealthTips = [
    "Practice mindfulness meditation for 10 minutes daily to reduce stress.",
    "Connect with friends and family regularly for emotional support.",
    "Set realistic goals and celebrate small achievements.",
    "Practice gratitude by writing down three things you're thankful for.",
    "Engage in physical activities you enjoy to boost mood.",
    "Limit social media use to reduce comparison and anxiety.",
    "Seek professional help if you're feeling overwhelmed.",
    "Practice self-compassion and be kind to yourself.",
    "Maintain a regular sleep schedule for better mental health.",
    "Engage in creative activities as a form of expression and relief."
];

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function () {
    loadAppState();
    await initializeApp();
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});

function loadAppState() {
    const saved = localStorage.getItem('prioritixState');
    if (saved) {
        appState = { ...appState, ...JSON.parse(saved) };
        applyTheme();
    }
}

function saveAppState() {
    localStorage.setItem('prioritixState', JSON.stringify(appState));
}

async function initializeApp() {
    setupEventListeners();
    const { data: { user } } = await db.auth.getUser();

    if (user) {
        appState.user = { email: user.email, id: user.id };
        saveAppState();
        showMainApp();
        await renderAllSections();
        if (appState.firstTimeUser) setTimeout(() => startTour(), 1000);
    } else {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
}

function showMainApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    applyTheme();
}

function applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(appState.theme + '-mode');
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveAppState();
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    document.getElementById(tab === 'login' ? 'login-form' : 'signup-form').style.display = 'flex';
    document.querySelectorAll('.auth-tab').forEach(t => {
        if (t.getAttribute('onclick').includes(tab)) t.classList.add('active');
    });
}

document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        showAuthMessage(error.message, 'login-form');
    } else {
        appState.user = { email: data.user.email, id: data.user.id };
        saveAppState();
        showMainApp();
        await renderAllSections();
    }
});

document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const name            = document.getElementById('signup-name').value;
    const email           = document.getElementById('signup-email').value;
    const password        = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match!', 'signup-form');
        return;
    }
    const { error } = await db.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
    });
    if (error) {
        showAuthMessage(error.message, 'signup-form');
    } else {
        showAuthMessage('Account created! Please check your email to confirm, then log in.', 'signup-form');
    }
});

function showAuthMessage(message, formId) {
    const form = document.getElementById(formId);
    const el   = form.querySelector('.auth-message');
    el.textContent  = message;
    el.style.color  = 'var(--danger-color)';
    setTimeout(() => { el.textContent = ''; }, 3000);
}

async function showUserMenu() {
    if (confirm('Do you want to logout?')) {
        await db.auth.signOut();
        appState.user = null;
        saveAppState();
        location.reload();
    }
}

// ════════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════════

function navigateTo(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(section + '-section').style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) link.classList.add('active');
    });

    // FIX: was calling location.reload() which wiped state — now just re-renders
    if (section === 'prioritix' || section === 'dashboard') {
        renderDashboard();
    }

    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.querySelector('.sidebar').classList.toggle('active');
}

// ════════════════════════════════════════════════════════════
//  RENDER ALL
// ════════════════════════════════════════════════════════════

async function renderAllSections() {
    await loadTasks();
    await loadFlashcards();
    await loadMoodHistory();
    await loadEvents();
    await loadNotes();
    await loadFormulas();
    renderAnalytics();
    renderMentalHealth();
    updateSubjectDropdowns();
}

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════

function renderDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = appState.tasks.filter(task => {
        const d = new Date(task.deadline);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    document.getElementById('today-tasks-count').textContent = todayTasks.length;
    document.getElementById('study-hours-count').textContent = appState.analytics.studyHours;

    const completed   = appState.tasks.filter(t => t.completed).length;
    const total       = appState.tasks.length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('productivity-score').textContent = productivity + '%';

    // FIX: moodHistory[0] is newest because we order descending in loadMoodHistory
    const currentMood = appState.moodHistory.length > 0 ? appState.moodHistory[0].mood : '😊';
    document.getElementById('current-mood-display').textContent = currentMood;
}

// ════════════════════════════════════════════════════════════
//  TASKS
// ════════════════════════════════════════════════════════════

async function loadTasks() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('tasks')
        .select('*')
        .eq('user_id', appState.user.id)
        .order('created_at', { ascending: false });

    if (error) { console.error('loadTasks:', error); return; }
    appState.tasks = data;
    renderTasks();
    renderDashboard();
    renderAnalytics();
}

function renderTasks() {
    const quadrants = {
        'urgent-important': [],
        'important-not-urgent': [],
        'urgent-not-important': [],
        'not-urgent-not-important': []
    };

    appState.tasks.forEach(task => {
        let q = 'not-urgent-not-important';
        if      ( task.urgent &&  task.important) q = 'urgent-important';
        else if (!task.urgent &&  task.important) q = 'important-not-urgent';
        else if ( task.urgent && !task.important) q = 'urgent-not-important';
        quadrants[q].push(task);
    });

    Object.keys(quadrants).forEach(q => {
        const container = document.getElementById(q + '-tasks');
        container.innerHTML = '';
        quadrants[q].forEach(task => container.appendChild(createTaskElement(task)));
    });
}

function createTaskElement(task) {
    const div      = document.createElement('div');
    div.className  = `task-item priority-${task.priority}`;
    div.draggable  = true;
    div.dataset.taskId = task.id;

    if (task.completed) {
        div.classList.add('completed');
    } else {
        const deadline = new Date(task.deadline);
        const today    = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDay  = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        if      (taskDay < today)                        div.classList.add('overdue');
        else if (taskDay.getTime() === today.getTime())  div.classList.add('due-today');
        else                                             div.classList.add('upcoming');
    }

    div.innerHTML = `
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-meta">
            <span>${task.subject}</span>
            <span>${new Date(task.deadline).toLocaleDateString()}</span>
        </div>
        <div class="task-actions">
            <button class="task-action-btn edit"   onclick="editTask('${task.id}')">Edit</button>
            <button class="task-action-btn delete" onclick="deleteTask('${task.id}')">Delete</button>
            <button class="task-action-btn"        onclick="toggleTaskComplete('${task.id}')">
                ${task.completed ? 'Undo' : 'Complete'}
            </button>
        </div>
    `;

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend',   handleDragEnd);
    div.addEventListener('dragover',  handleDragOver);
    div.addEventListener('drop',      handleDrop);
    return div;
}

// ── Drag & Drop ──────────────────────────────────────────────
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.5';
}
function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTask = null;
}
function handleDragOver(e) { e.preventDefault(); }

async function handleDrop(e) {
    e.preventDefault();
    const dropTarget  = e.target.closest('.task-item');
    if (!dropTarget || !draggedTask) return;

    const dropQuadrant = dropTarget.closest('.matrix-quadrant');
    const taskId       = draggedTask.dataset.taskId;
    const task         = appState.tasks.find(t => t.id === taskId);

    if (task && dropQuadrant) {
        const qId = dropQuadrant.id;
        if      (qId === 'quadrant-urgent-important')     { task.urgent = true;  task.important = true;  }
        else if (qId === 'quadrant-important-not-urgent') { task.urgent = false; task.important = true;  }
        else if (qId === 'quadrant-urgent-not-important') { task.urgent = true;  task.important = false; }
        else                                              { task.urgent = false; task.important = false; }

        // FIX: persist quadrant change to Supabase
        const { error } = await db.from('tasks')
            .update({ urgent: task.urgent, important: task.important })
            .eq('id', taskId);
        if (error) console.error('handleDrop update:', error);

        saveAppState();
        renderTasks();
        renderDashboard();
    }
}

// ── Task CRUD ────────────────────────────────────────────────
function openTaskModal() {
    document.getElementById('task-modal').style.display = 'block';
    document.getElementById('task-form').reset();
    delete document.getElementById('task-form').dataset.editingId;
}

function editTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('task-title').value       = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-subject').value     = task.subject;
    document.getElementById('task-urgent').checked    = task.urgent;
    document.getElementById('task-important').checked = task.important;
    document.getElementById('task-deadline').value    = task.deadline;
    document.getElementById('task-form').dataset.editingId = taskId;
    document.getElementById('task-modal').style.display = 'block';
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await db.from('tasks').delete().eq('id', taskId);
    if (error) console.error('deleteTask:', error);
    else await loadTasks();
}

async function toggleTaskComplete(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    const { error } = await db.from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);
    if (error) console.error('toggleTaskComplete:', error);
    else await loadTasks();
}

document.getElementById('task-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;
    const taskData  = {
        title:       document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        subject:     document.getElementById('task-subject').value,
        urgent:      document.getElementById('task-urgent').checked,
        important:   document.getElementById('task-important').checked,
        deadline:    document.getElementById('task-deadline').value,
        user_id:     appState.user.id   // FIX: include user_id on every insert
    };

    if (editingId) {
        const { error } = await db.from('tasks').update(taskData).eq('id', editingId);
        if (error) console.error('task update:', error);
        delete this.dataset.editingId;
    } else {
        const { error } = await db.from('tasks').insert(taskData);
        if (error) console.error('task insert:', error);
    }
    closeModal('task-modal');
    await loadTasks();
});

function searchTasks() {
    const term = document.getElementById('task-search').value.toLowerCase();
    document.querySelectorAll('.task-item').forEach(item => {
        const title = item.querySelector('.task-title').textContent.toLowerCase();
        const desc  = item.querySelector('.task-description')?.textContent.toLowerCase() || '';
        item.style.display = (title.includes(term) || desc.includes(term)) ? 'block' : 'none';
    });
}

function sortTasks() {
    const sortBy = document.getElementById('task-sort').value;
    appState.tasks.sort((a, b) =>
        sortBy === 'date' ? new Date(a.deadline) - new Date(b.deadline)
                          : a.subject.localeCompare(b.subject)
    );
    saveAppState();
    renderTasks();
}

// ════════════════════════════════════════════════════════════
//  FOCUS / TIMER
// ════════════════════════════════════════════════════════════

function startTimer() {
    if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerState.interval  = setInterval(updateTimer, 1000);
    }
}
function pauseTimer() {
    timerState.isRunning = false;
    clearInterval(timerState.interval);
}
function resetTimer() {
    pauseTimer();
    timerState.timeLeft = timerState.totalTime;
    updateTimerDisplay();
}
function updateTimer() {
    timerState.timeLeft--;
    updateTimerDisplay();
    if (timerState.timeLeft <= 0) {
        pauseTimer();
        alert('Timer finished!');
        if (timerState.mode === 'pomodoro') {
            appState.analytics.pomodoroSessions++;
            appState.analytics.studyHours += 0.42;
            saveAppState();
            renderDashboard();
            renderAnalytics();
        }
    }
}
function updateTimerDisplay() {
    const m = Math.floor(timerState.timeLeft / 60);
    const s = timerState.timeLeft % 60;
    document.getElementById('timer-time').textContent =
        `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const progress      = document.getElementById('timer-progress');
    const circumference = 2 * Math.PI * 45;
    progress.style.strokeDashoffset =
        circumference - (timerState.timeLeft / timerState.totalTime) * circumference;
}
function setTimerMode(mode) {
    timerState.mode      = mode;
    timerState.totalTime = mode === 'pomodoro' ? 25*60 : mode === 'short' ? 5*60 : 15*60;
    timerState.timeLeft  = timerState.totalTime;
    updateTimerDisplay();
}
function getNewFocusTip()  { document.querySelector('#focus-tip p').textContent  = focusTips[Math.floor(Math.random()*focusTips.length)]; }
function getNewHealthTip() { document.querySelector('#health-tip p').textContent = healthTips[Math.floor(Math.random()*healthTips.length)]; }
function toggleFocusMode() {
    document.body.classList.toggle('focus-mode-active');
    document.querySelector('.focus-mode-toggle').textContent =
        document.body.classList.contains('focus-mode-active') ? 'Exit Focus Mode' : 'Enable Focus Mode';
}

// ════════════════════════════════════════════════════════════
//  CALENDAR / EVENTS
// ════════════════════════════════════════════════════════════

async function loadEvents() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('events')
        .select('*')
        .eq('user_id', appState.user.id);

    if (error) { console.error('loadEvents:', error); return; }

    appState.events = data.map(e => ({
        id:    e.id,
        title: e.title,
        date:  e.event_date,
        time:  e.event_time,
        type:  e.event_type,
        notes: e.notes
    }));
    renderCalendar();
}

function renderCalendar() {
    const month = appState.currentCalendarMonth;
    const year  = appState.currentCalendarYear;
    const names = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
    document.getElementById('calendar-month-year').textContent = `${names[month]} ${year}`;

    const firstDay     = new Date(year, month, 1).getDay();
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day';
        empty.style.cssText = 'background:transparent;cursor:default';
        daysContainer.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl   = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<div class="calendar-day-number">${day}</div>`;

        const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayEvents = appState.events.filter(e => e.date === dateStr);

        if (dayEvents.length > 0) {
            dayEl.classList.add('has-event');
            const evDiv = document.createElement('div');
            evDiv.className = 'calendar-day-events';
            dayEvents.slice(0,2).forEach(ev => { evDiv.innerHTML += `<div>${ev.title}</div>`; });
            if (dayEvents.length > 2) evDiv.innerHTML += `<div>+${dayEvents.length-2} more</div>`;
            dayEl.appendChild(evDiv);
        }
        if (today.getDate()===day && today.getMonth()===month && today.getFullYear()===year)
            dayEl.classList.add('today');

        dayEl.addEventListener('click', () => showDayEvents(dateStr, dayEvents));
        daysContainer.appendChild(dayEl);
    }
    renderUpcomingEvents();
}

function navigateMonth(delta) {
    appState.currentCalendarMonth += delta;
    if      (appState.currentCalendarMonth > 11) { appState.currentCalendarMonth = 0;  appState.currentCalendarYear++; }
    else if (appState.currentCalendarMonth < 0)  { appState.currentCalendarMonth = 11; appState.currentCalendarYear--; }
    renderCalendar();
}

function openEventModal() {
    document.getElementById('event-modal').style.display = 'block';
    document.getElementById('event-form').reset();
    delete document.getElementById('event-form').dataset.editingId;
}

function showDayEvents(dateStr, events) {
    document.getElementById('calendar-events-date').textContent = `Events for ${dateStr}`;
    const list = document.getElementById('calendar-events-list');
    list.innerHTML = '';
    if (events.length === 0) {
        list.innerHTML = '<p>No events for this date.</p>';
    } else {
        events.forEach(ev => {
            const el = document.createElement('div');
            el.className = 'calendar-event-item';
            el.innerHTML = `
                <h4>${ev.title}</h4>
                <p>Time: ${ev.time}</p>
                <p>Type: ${ev.type}</p>
                ${ev.notes ? `<p>${ev.notes}</p>` : ''}
                <div class="calendar-event-actions">
                    <button class="btn btn-secondary" onclick="editEvent('${ev.id}')">Edit</button>
                    <button class="btn btn-danger"    onclick="deleteEvent('${ev.id}')">Delete</button>
                </div>`;
            list.appendChild(el);
        });
    }
    document.getElementById('calendar-events-modal').style.display = 'block';
}

function editEvent(eventId) {
    const ev = appState.events.find(e => e.id === eventId);
    if (!ev) return;
    document.getElementById('event-title').value = ev.title;
    document.getElementById('event-date').value  = ev.date;
    document.getElementById('event-time').value  = ev.time;
    document.getElementById('event-type').value  = ev.type;
    document.getElementById('event-notes').value = ev.notes || '';
    closeModal('calendar-events-modal');
    document.getElementById('event-form').dataset.editingId = eventId;
    document.getElementById('event-modal').style.display = 'block';
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await db.from('events').delete().eq('id', eventId);
    if (error) console.error('deleteEvent:', error);
    else { await loadEvents(); closeModal('calendar-events-modal'); }
}

document.getElementById('event-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;
    const eventData = {
        title:      document.getElementById('event-title').value,
        event_date: document.getElementById('event-date').value,
        event_time: document.getElementById('event-time').value,
        event_type: document.getElementById('event-type').value,
        notes:      document.getElementById('event-notes').value,
        user_id:    appState.user.id   // FIX: include user_id
    };
    if (editingId) {
        const { error } = await db.from('events').update(eventData).eq('id', editingId);
        if (error) console.error('event update:', error);
        delete this.dataset.editingId;
    } else {
        const { error } = await db.from('events').insert(eventData);
        if (error) console.error('event insert:', error);
    }
    closeModal('event-modal');
    await loadEvents();
});

function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-list');
    container.innerHTML = '';
    const today    = new Date(); today.setHours(0,0,0,0);
    const upcoming = appState.events
        .filter(e => new Date(e.date) >= today)
        .sort((a,b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '<p>No upcoming events.</p>';
    } else {
        upcoming.forEach(ev => {
            const el = document.createElement('div');
            el.className = 'upcoming-event-item';
            el.innerHTML = `<strong>${ev.title}</strong><br><small>${ev.date} at ${ev.time}</small>`;
            container.appendChild(el);
        });
    }
}

// ════════════════════════════════════════════════════════════
//  NOTES
// ════════════════════════════════════════════════════════════

async function loadNotes() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('notes')
        .select('*')
        .eq('user_id', appState.user.id)
        .order('created_at', { ascending: false });

    if (error) { console.error('loadNotes:', error); return; }

    appState.notes = data.map(note => ({
        id:      note.id,
        title:   note.title,
        subject: note.subject,
        content: note.content,
        image:   note.image,
        links:   note.links || [],
        hidden:  false
    }));
    renderNotes();
}

function renderNotes() {
    const container     = document.getElementById('notes-grid');
    const subjectFilter = document.getElementById('notes-subject-filter').value;
    const showHidden    = document.getElementById('toggle-notes-visibility').checked;
    container.innerHTML = '';

    let filtered = appState.notes;
    if (subjectFilter !== 'all') filtered = filtered.filter(n => n.subject === subjectFilter);
    if (!showHidden)             filtered = filtered.filter(n => !n.hidden);

    filtered.forEach(note => {
        const el = document.createElement('div');
        el.className = 'note-card';
        el.innerHTML = `
            <h3>${note.title}</h3>
            <p class="note-content">${note.content.substring(0,150)}${note.content.length>150?'...':''}</p>
            ${note.links && note.links.length > 0
                ? `<div class="note-links">${note.links.map(l=>`<a href="${l}" target="_blank" class="note-link">Link</a>`).join('')}</div>`
                : ''}
            ${note.image ? `<img src="${note.image}" alt="Note image" class="note-image" onerror="this.style.display='none'">` : ''}
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editNote('${note.id}')">Edit</button>
                <button class="btn btn-secondary" onclick="toggleNoteVisibility('${note.id}')">${note.hidden?'Show':'Hide'}</button>
                <button class="btn btn-danger"    onclick="deleteNote('${note.id}')">Delete</button>
            </div>`;
        container.appendChild(el);
    });
}

function openNoteModal() {
    document.getElementById('note-modal').style.display = 'block';
    document.getElementById('note-form').reset();
    const preview = document.getElementById('note-image-preview');
    preview.style.display = 'none';
    preview.src = '';
    document.getElementById('note-image-url').value = '';
    delete document.getElementById('note-form').dataset.editingId;
}

function editNote(noteId) {
    const note = appState.notes.find(n => n.id === noteId);
    if (!note) return;
    document.getElementById('note-title').value   = note.title;
    document.getElementById('note-subject').value = note.subject;
    document.getElementById('note-content').value = note.content;

    const preview = document.getElementById('note-image-preview');
    if (note.image) {
        preview.src          = note.image;
        preview.style.display = 'block';
        document.getElementById('note-image-url').value = note.image;
    } else {
        preview.style.display = 'none';
        preview.src = '';
        document.getElementById('note-image-url').value = '';
    }

    document.getElementById('note-form').dataset.editingId = noteId;
    document.getElementById('note-modal').style.display = 'block';
}

function toggleNoteVisibility(noteId) {
    const note = appState.notes.find(n => n.id === noteId);
    if (note) { note.hidden = !note.hidden; saveAppState(); renderNotes(); }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const { error } = await db.from('notes').delete().eq('id', noteId);
    if (error) console.error('deleteNote:', error);
    else await loadNotes();
}

document.getElementById('note-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId   = this.dataset.editingId;
    const imageUrl    = document.getElementById('note-image-url').value.trim();
    const preview     = document.getElementById('note-image-preview');
    let   finalImage  = null;

    // FIX: prefer the URL input; fall back to preview src if it's a valid https URL
    if (imageUrl) {
        finalImage = imageUrl;
    } else if (preview.style.display !== 'none' && preview.src && preview.src.startsWith('https://')) {
        finalImage = preview.src;
    }

    const noteData = {
        title:   document.getElementById('note-title').value,
        subject: document.getElementById('note-subject').value,
        content: document.getElementById('note-content').value,
        image:   finalImage,
        user_id: appState.user.id   // FIX: include user_id
    };

    if (editingId) {
        const { error } = await db.from('notes').update(noteData).eq('id', editingId);
        if (error) console.error('note update:', error);
        delete this.dataset.editingId;
    } else {
        const { error } = await db.from('notes').insert(noteData);
        if (error) console.error('note insert:', error);
    }
    closeModal('note-modal');
    await loadNotes();
});

function filterNotes()          { renderNotes(); }
function toggleNotesVisibility() { renderNotes(); }

// ── Image upload ─────────────────────────────────────────────
async function handleImageUpload(file) {
    const fileName = Date.now() + '_' + file.name;
    const { error } = await db.storage.from('note-images').upload(fileName, file);

    if (error) {
        console.error('Image upload error:', error);
        alert('Image upload failed: ' + error.message + '\nTry using an image URL instead.');
        return;
    }

    const { data: urlData } = db.storage.from('note-images').getPublicUrl(fileName);

    const preview = document.getElementById('note-image-preview');
    preview.src           = urlData.publicUrl;
    preview.style.display = 'block';

    // FIX: write the public URL back to the input so the form submit can read it
    document.getElementById('note-image-url').value = urlData.publicUrl;
}

// ════════════════════════════════════════════════════════════
//  FLASHCARDS
// ════════════════════════════════════════════════════════════

async function loadFlashcards() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('flashcards')
        .select('*')
        .eq('user_id', appState.user.id);

    if (error) { console.error('loadFlashcards:', error); return; }

    appState.flashcards = data.map(card => ({
        id:       card.id,
        question: card.question,
        answer:   card.answer,
        subject:  card.subject,
        hidden:   false
    }));
    renderFlashcards();
}

function renderFlashcards() {
    const container     = document.getElementById('flashcards-container');
    const subjectFilter = document.getElementById('flashcards-subject-filter').value;
    const showHidden    = document.getElementById('toggle-flashcards-visibility').checked;
    container.innerHTML = '';

    let filtered = appState.flashcards;
    if (subjectFilter !== 'all') filtered = filtered.filter(f => f.subject === subjectFilter);
    if (!showHidden)             filtered = filtered.filter(f => !f.hidden);

    if (filtered.length === 0) { container.innerHTML = '<p>No flashcards available.</p>'; return; }

    const grouped = {};
    filtered.forEach(card => {
        if (!grouped[card.subject]) grouped[card.subject] = [];
        grouped[card.subject].push(card);
    });

    Object.keys(grouped).forEach(subject => {
        const title = document.createElement('h3');
        title.textContent = subject;
        title.style.marginTop = '20px';
        container.appendChild(title);

        grouped[subject].forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard';
            cardEl.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <div class="flashcard-question">${card.question}</div>
                        <div class="flashcard-subject">${card.subject}</div>
                    </div>
                    <div class="flashcard-back">
                        <div class="flashcard-answer">${card.answer}</div>
                    </div>
                </div>`;
            cardEl.addEventListener('click', function () {
                this.classList.toggle('flipped');
                if (this.classList.contains('flipped')) {
                    appState.analytics.flashcardsReviewed++;
                    saveAppState();
                    renderAnalytics();
                }
            });

            const actions = document.createElement('div');
            actions.className = 'card-actions';
            actions.innerHTML = `
                <button class="btn btn-secondary" onclick="editFlashcard('${card.id}')">Edit</button>
                <button class="btn btn-danger"    onclick="deleteFlashcard('${card.id}')">Delete</button>`;
            cardEl.appendChild(actions);
            container.appendChild(cardEl);
        });
    });

    const nav = document.createElement('div');
    nav.className = 'flashcard-controls';
    nav.innerHTML = `
        <button class="flashcard-nav-btn" onclick="scrollFlashcards(-1)">Previous</button>
        <button class="flashcard-nav-btn" onclick="scrollFlashcards(1)">Next</button>`;
    container.appendChild(nav);
}

function scrollFlashcards(dir) {
    document.getElementById('flashcards-container').scrollBy({ left: dir * 320, behavior: 'smooth' });
}

function openFlashcardModal() {
    document.getElementById('flashcard-modal').style.display = 'block';
    document.getElementById('flashcard-form').reset();
    delete document.getElementById('flashcard-form').dataset.editingId;
}

function editFlashcard(cardId) {
    const card = appState.flashcards.find(f => f.id === cardId);
    if (!card) return;
    document.getElementById('flashcard-question').value = card.question;
    document.getElementById('flashcard-answer').value   = card.answer;
    document.getElementById('flashcard-subject').value  = card.subject;
    document.getElementById('flashcard-form').dataset.editingId = cardId;
    document.getElementById('flashcard-modal').style.display = 'block';
}

async function deleteFlashcard(cardId) {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    const { error } = await db.from('flashcards').delete().eq('id', cardId);
    if (error) console.error('deleteFlashcard:', error);
    else await loadFlashcards();
}

function toggleFlashcardVisibility(cardId) {
    const card = appState.flashcards.find(f => f.id === cardId);
    if (card) { card.hidden = !card.hidden; saveAppState(); renderFlashcards(); }
}

document.getElementById('flashcard-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;
    const cardData  = {
        question: document.getElementById('flashcard-question').value,
        answer:   document.getElementById('flashcard-answer').value,
        subject:  document.getElementById('flashcard-subject').value,
        user_id:  appState.user.id   // FIX: include user_id
    };
    if (editingId) {
        const { error } = await db.from('flashcards').update(cardData).eq('id', editingId);
        if (error) console.error('flashcard update:', error);
        delete this.dataset.editingId;
    } else {
        const { error } = await db.from('flashcards').insert(cardData);
        if (error) console.error('flashcard insert:', error);
    }
    closeModal('flashcard-modal');
    await loadFlashcards();
});

function filterFlashcards()          { renderFlashcards(); }
function toggleFlashcardsVisibility() { renderFlashcards(); }

// ════════════════════════════════════════════════════════════
//  FORMULAS  (migrated from localStorage → Supabase)
// ════════════════════════════════════════════════════════════

async function loadFormulas() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('formulas')
        .select('*')
        .eq('user_id', appState.user.id);

    if (error) { console.error('loadFormulas:', error); return; }

    appState.formulas = data.map(f => ({
        id:         f.id,
        name:       f.name,
        expression: f.expression,
        subject:    f.subject,
        hidden:     false
    }));
    renderFormulas();
}

function renderFormulas() {
    const container     = document.getElementById('formulas-grid');
    const subjectFilter = document.getElementById('formulas-subject-filter').value;
    const showHidden    = document.getElementById('toggle-formulas-visibility').checked;
    container.innerHTML = '';

    let filtered = appState.formulas;
    if (subjectFilter !== 'all') filtered = filtered.filter(f => f.subject === subjectFilter);
    if (!showHidden)             filtered = filtered.filter(f => !f.hidden);

    filtered.forEach(formula => {
        const el = document.createElement('div');
        el.className = 'formula-card';
        el.innerHTML = `
            <h3>${formula.name}</h3>
            <div class="formula-expression">${formula.expression}</div>
            <p class="formula-content">Subject: ${formula.subject}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editFormula('${formula.id}')">Edit</button>
                <button class="btn btn-secondary" onclick="toggleFormulaVisibility('${formula.id}')">${formula.hidden?'Show':'Hide'}</button>
                <button class="btn btn-danger"    onclick="deleteFormula('${formula.id}')">Delete</button>
            </div>`;
        container.appendChild(el);
    });
}

function openFormulaModal() {
    document.getElementById('formula-modal').style.display = 'block';
    document.getElementById('formula-form').reset();
    delete document.getElementById('formula-form').dataset.editingId;
}

function editFormula(formulaId) {
    const formula = appState.formulas.find(f => f.id === formulaId);
    if (!formula) return;
    document.getElementById('formula-name').value       = formula.name;
    document.getElementById('formula-expression').value = formula.expression;
    document.getElementById('formula-subject').value    = formula.subject;
    document.getElementById('formula-form').dataset.editingId = formulaId;
    document.getElementById('formula-modal').style.display = 'block';
}

async function deleteFormula(formulaId) {
    if (!confirm('Are you sure you want to delete this formula?')) return;
    const { error } = await db.from('formulas').delete().eq('id', formulaId);
    if (error) console.error('deleteFormula:', error);
    else await loadFormulas();
}

function toggleFormulaVisibility(formulaId) {
    const f = appState.formulas.find(f => f.id === formulaId);
    if (f) { f.hidden = !f.hidden; saveAppState(); renderFormulas(); }
}

document.getElementById('formula-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId  = this.dataset.editingId;
    const formulaData = {
        name:       document.getElementById('formula-name').value,
        expression: document.getElementById('formula-expression').value,
        subject:    document.getElementById('formula-subject').value,
        user_id:    appState.user.id
    };
    if (editingId) {
        const { error } = await db.from('formulas').update(formulaData).eq('id', editingId);
        if (error) console.error('formula update:', error);
        delete this.dataset.editingId;
    } else {
        const { error } = await db.from('formulas').insert(formulaData);
        if (error) console.error('formula insert:', error);
    }
    closeModal('formula-modal');
    await loadFormulas();
});

function filterFormulas()          { renderFormulas(); }
function toggleFormulasVisibility() { renderFormulas(); }

// ════════════════════════════════════════════════════════════
//  SUBJECTS
// ════════════════════════════════════════════════════════════

function openSubjectModal(type) {
    document.getElementById('subject-modal').style.display = 'block';
    document.getElementById('subject-form').reset();
    document.getElementById('subject-type').value = type;
}

document.getElementById('subject-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const type    = document.getElementById('subject-type').value;
    const name    = document.getElementById('subject-name').value;
    if (!appState.subjects[type].includes(name)) {
        appState.subjects[type].push(name);
        saveAppState();
        updateSubjectDropdowns();
    }
    closeModal('subject-modal');
});

function updateSubjectDropdowns() {
    ['notes', 'flashcards', 'formulas', 'task'].forEach(type => {
        const selectId   = type === 'task' ? 'task-subject' : `${type}-subject`;
        const filterId   = `${type}-subject-filter`;
        const subjects   = appState.subjects[type === 'task' ? 'notes' : type] || ['General'];

        const selectEl = document.getElementById(selectId);
        if (selectEl) {
            selectEl.innerHTML = '';
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub; opt.textContent = sub;
                selectEl.appendChild(opt);
            });
        }
        const filterEl = document.getElementById(filterId);
        if (filterEl) {
            filterEl.innerHTML = '';
            const all = document.createElement('option');
            all.value = 'all'; all.textContent = 'All Subjects';
            filterEl.appendChild(all);
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub; opt.textContent = sub;
                filterEl.appendChild(opt);
            });
        }
    });
}

function showLearningTab(tab) {
    document.querySelectorAll('.learning-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.learning-subsection').forEach(s => s.style.display = 'none');
    event.target.classList.add('active');
    document.getElementById(tab + '-subsection').style.display = 'block';
}

// ════════════════════════════════════════════════════════════
//  ANALYTICS
// ════════════════════════════════════════════════════════════

function renderAnalytics() {
    renderActivityChart();
    renderSubjectChart();
    renderHoursChart();
    renderMoodHistory();
    updateStatsSummary();
}

function renderActivityChart() {
    const canvas = document.getElementById('activity-chart');
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labels = [], data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        data.push(appState.tasks.filter(t => {
            const td = new Date(t.deadline);
            return td.toDateString() === d.toDateString() && t.completed;
        }).length);
    }

    const padding  = 60;
    const avail    = canvas.width - padding * 2;
    const barWidth = avail / labels.length * 0.5;
    const gap      = avail / labels.length * 0.5;
    const startX   = padding;
    const startY   = canvas.height - 60;
    const maxH     = canvas.height - 100;
    const maxData  = Math.max(...data, 1);

    ctx.fillStyle = '#4CAF50';
    data.forEach((value, i) => {
        const bH = (value / maxData) * maxH;
        const x  = startX + i * (barWidth + gap);
        const y  = startY - bH;
        ctx.fillRect(x, y, barWidth, bH);
        ctx.fillStyle = '#212121'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, startY + 20);
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(value, x + barWidth / 2, y - 5);
    });
}

function renderSubjectChart() {
    const canvas = document.getElementById('subject-chart');
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const counts = {};
    appState.tasks.filter(t => t.completed).forEach(t => {
        counts[t.subject] = (counts[t.subject] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data   = Object.values(counts);

    if (labels.length === 0) {
        ctx.fillStyle = '#757575'; ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width/2, canvas.height/2);
        return;
    }

    const cx = canvas.width/2, cy = canvas.height/2;
    const r  = Math.min(cx, cy) - 20;
    const colors = ['#4CAF50','#2196F3','#FF9800','#f44336','#9C27B0','#00BCD4'];
    let angle = 0;
    const total = data.reduce((s,v) => s+v, 0);

    data.forEach((value, i) => {
        const slice = (value / total) * 2 * Math.PI;
        ctx.beginPath(); ctx.moveTo(cx,cy);
        ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath();
        ctx.fillStyle = colors[i % colors.length]; ctx.fill();
        const la = angle + slice/2;
        ctx.fillStyle = '#212121'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
        ctx.fillText(labels[i], cx + Math.cos(la)*(r+20), cy + Math.sin(la)*(r+20));
        angle += slice;
    });
}

function renderHoursChart() {
    const canvas = document.getElementById('hours-chart');
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labels = [], data = [];
    for (let i = 3; i >= 0; i--) {
        labels.push(`Week ${4-i}`);
        data.push(Math.round(appState.analytics.studyHours / 4 * (1 + Math.random() * 0.5)));
    }

    const startX = 50, startY = canvas.height-50, endX = canvas.width-30, endY = 30;
    const maxData = Math.max(...data, 1);
    ctx.beginPath(); ctx.strokeStyle = '#2196F3'; ctx.lineWidth = 3;

    const pts = [];
    data.forEach((value, i) => {
        const x = startX + (i / (data.length-1)) * (endX - startX);
        const y = startY - (value / maxData) * (startY - endY);
        pts.push({ x, y, value, label: labels[i] });
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();

    pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 2*Math.PI);
        ctx.fillStyle = '#2196F3'; ctx.fill();
        ctx.fillStyle = '#212121'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, startY + 20);
        ctx.fillText(p.value + 'h', p.x, p.y - 10);
    });
}

function renderMoodHistory() {
    const container = document.getElementById('mood-history');
    container.innerHTML = '';

    if (appState.moodHistory.length === 0) {
        container.innerHTML = '<p>No mood data recorded yet.</p>';
        return;
    }
    appState.moodHistory.slice(-14).forEach(entry => {
        const el = document.createElement('div');
        el.className = 'mood-circle';
        el.textContent = entry.mood;
        el.dataset.tooltip = `${entry.date} at ${entry.time}`;
        container.appendChild(el);
    });
}

function updateStatsSummary() {
    document.getElementById('total-tasks-completed').textContent   = appState.analytics.tasksCompleted;
    document.getElementById('total-study-hours').textContent       = appState.analytics.studyHours.toFixed(1);
    document.getElementById('total-pomodoro-sessions').textContent = appState.analytics.pomodoroSessions;
    document.getElementById('total-flashcards-reviewed').textContent = appState.analytics.flashcardsReviewed;
}

// ════════════════════════════════════════════════════════════
//  MENTAL HEALTH / MOOD
// ════════════════════════════════════════════════════════════

async function logMood(mood) {
    // FIX: get the authenticated user and include user_id in insert
    const { data: { user } } = await db.auth.getUser();
    if (!user) { alert('You must be logged in to log mood.'); return; }

    const { error } = await db.from('mood_logs').insert({
        mood:    mood,
        user_id: user.id   // FIX: required for RLS policies to accept the insert
    });

    if (error) {
        console.error('logMood:', error);
        alert('Failed to log mood: ' + error.message);
        return;
    }

    document.getElementById('mood-status').textContent = `Mood logged: ${mood}`;
    await loadMoodHistory();
    renderDashboard();
    renderAnalytics();
}

async function loadMoodHistory() {
    if (!appState.user) return;
    const { data, error } = await db
        .from('mood_logs')
        .select('*')
        .eq('user_id', appState.user.id)
        .order('logged_at', { ascending: false })
        .limit(14);

    if (error) { console.error('loadMoodHistory:', error); return; }

    appState.moodHistory = data.map(entry => ({
        mood: entry.mood,
        date: new Date(entry.logged_at).toLocaleDateString(),
        time: new Date(entry.logged_at).toLocaleTimeString()
    }));
    renderMoodHistory();
    renderDashboard();
}

function saveReflection() {
    const text = document.getElementById('reflection-text').value;
    if (text.trim()) {
        appState.reflections.push({ content: text, date: new Date().toISOString() });
        saveAppState();
        document.getElementById('reflection-text').value = '';
        alert('Reflection saved successfully!');
    }
}

function getNewMentalHealthTip() {
    document.querySelector('#mental-health-tip p').textContent =
        mentalHealthTips[Math.floor(Math.random() * mentalHealthTips.length)];
}

function openEmergencyContactModal() {
    document.getElementById('emergency-contact-modal').style.display = 'block';
    document.getElementById('emergency-contact-form').reset();
}

document.getElementById('emergency-contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    appState.emergencyContacts.push({
        name:   document.getElementById('contact-name').value,
        number: document.getElementById('contact-number').value
    });
    saveAppState();
    closeModal('emergency-contact-modal');
    renderMentalHealth();
});

function renderMentalHealth() {
    const container = document.getElementById('emergency-contacts');
    container.innerHTML = '';
    appState.emergencyContacts.forEach((contact, index) => {
        const el = document.createElement('div');
        el.className = 'contact-item';
        el.innerHTML = `
            <span class="contact-name">${contact.name}</span>
            <span class="contact-number">${contact.number}</span>
            ${index > 0
                ? `<button class="btn btn-danger" onclick="deleteEmergencyContact(${index})">Delete</button>`
                : ''}`;
        container.appendChild(el);
    });
}

function deleteEmergencyContact(index) {
    if (confirm('Are you sure you want to delete this contact?')) {
        appState.emergencyContacts.splice(index, 1);
        saveAppState();
        renderMentalHealth();
    }
}

// ════════════════════════════════════════════════════════════
//  MODALS & UTILITIES
// ════════════════════════════════════════════════════════════

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
};

// ════════════════════════════════════════════════════════════
//  TOUR
// ════════════════════════════════════════════════════════════

function startTour() {
    appState.firstTimeUser = false;
    saveAppState();
    tourState.isActive     = true;
    tourState.currentStep  = 0;
    document.getElementById('tour-overlay').style.display = 'block';
    showTourStep(0);
}

function showTourStep(stepIndex) {
    if (stepIndex >= tourState.steps.length) { endTour(); return; }
    tourState.currentStep = stepIndex;
    const step = tourState.steps[stepIndex];
    document.getElementById('tour-title').textContent       = step.title;
    document.getElementById('tour-description').textContent = step.description;

    const target = document.querySelector(step.target);
    if (target) {
        const rect      = target.getBoundingClientRect();
        const highlight = document.querySelector('.tour-highlight');
        const tooltip   = document.querySelector('.tour-tooltip');
        highlight.style.cssText = `width:${rect.width+20}px;height:${rect.height+20}px;top:${rect.top-10}px;left:${rect.left-10}px`;
        tooltip.style.maxWidth  = '350px';
        const th = 200, tw = 350;
        if (rect.bottom + th + 20 < window.innerHeight) {
            tooltip.style.top  = (rect.bottom + 20) + 'px';
            tooltip.style.left = Math.max(10, Math.min(rect.left + (rect.width-tw)/2, window.innerWidth-tw-10)) + 'px';
        } else if (rect.top - th - 20 > 0) {
            tooltip.style.top  = (rect.top - th - 20) + 'px';
            tooltip.style.left = Math.max(10, Math.min(rect.left + (rect.width-tw)/2, window.innerWidth-tw-10)) + 'px';
        } else {
            tooltip.style.top  = Math.max(10, Math.min(rect.top, window.innerHeight-th-10)) + 'px';
            tooltip.style.left = (rect.right + 20) + 'px';
        }
        document.querySelector('.prev-btn').disabled         = stepIndex === 0;
        document.querySelector('.next-btn').textContent      = stepIndex === tourState.steps.length-1 ? 'Finish' : 'Next';
    }
}

function nextTourStep() { showTourStep(tourState.currentStep + 1); }
function prevTourStep() { if (tourState.currentStep > 0) showTourStep(tourState.currentStep - 1); }
function skipTour()     { endTour(); }
function restartTour()  { showTourStep(0); }
function endTour()      { tourState.isActive = false; document.getElementById('tour-overlay').style.display = 'none'; }

// ════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════

function setupEventListeners() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            if (document.body.classList.contains('focus-mode-active')) toggleFocusMode();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openTaskModal(); }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') { e.preventDefault(); toggleFocusMode(); }
    });

    const dropZone  = document.getElementById('note-drop-zone');
    const fileInput = document.getElementById('note-image-file');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-color)';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--border-color)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-color)';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) handleImageUpload(file);
        });
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageUpload(file);
        });
    }

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (document.getElementById('note-modal').style.display === 'block') {
                    handleImageUpload(file);
                }
            }
        }
    });
}

// ════════════════════════════════════════════════════════════
//  SUPABASE SQL — run this once in your Supabase SQL editor
// ════════════════════════════════════════════════════════════
/*
  CREATE TABLE IF NOT EXISTS formulas (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    expression TEXT NOT NULL,
    subject    TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own formulas" ON formulas
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
*/

console.log('Prioritix loaded successfully!');

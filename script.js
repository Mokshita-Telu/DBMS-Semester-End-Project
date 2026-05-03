// Initialize Supabase
const SUPABASE_URL = 'https://jakfuclvwydjuruiryhn.supabase.co';  // paste your URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impha2Z1Y2x2d3lkanVydWlyeWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTQ0ODQsImV4cCI6MjA5MzMzMDQ4NH0.VpaPBZs2hvfeI2ImG_R8QWvRjTRtWNpebDF4oCyWiC4';                      // paste your anon key

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);


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
        { name: 'Crisis Hotline', number: '100' }
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


let timerState = {
    mode: 'pomodoro',
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    interval: null
};


let tourState = {
    currentStep: 0,
    isActive: false,
    steps: [
        {
            target: '.logo',
            title: 'Welcome to Prioritix!',
            description: 'Your personal productivity companion designed to help students manage tasks, stay focused, and maintain well-being.'
        },
        {
            target: '.sidebar',
            title: 'Navigation Sidebar',
            description: 'Access all your tools from here: Task Manager, Focus Mode, Academic Calendar, Learning resources, Analytics, and Mental Health support.'
        },
        {
            target: '#tasks-section',
            title: 'Task Manager',
            description: 'Organize your tasks using the Eisenhower Matrix. Drag and drop tasks between quadrants based on urgency and importance.'
        },
        {
            target: '#focus-section',
            title: 'Focus Mode',
            description: 'Use the Pomodoro timer to maintain focus during study sessions. Set custom timers and get productivity tips.'
        },
        {
            target: '#calendar-section',
            title: 'Academic Calendar',
            description: 'Track your exams, assignments, and study sessions. Click on any date to view or manage events.'
        },
        {
            target: '#learning-section',
            title: 'Learning & Revision',
            description: 'Create notes, flashcards, and formula cards organized by subject. Perfect for exam preparation.'
        },
        {
            target: '#analytics-section',
            title: 'Analytics Dashboard',
            description: 'Track your productivity over time with visual graphs and statistics. Monitor your progress and habits.'
        },
        {
            target: '#mental-health-section',
            title: 'Mental Well-Being',
            description: 'Log your mood, write daily reflections, and access mental health resources and emergency contacts.'
        },
        {
            target: '.theme-toggle',
            title: 'Dark Mode',
            description: 'Toggle between light and dark mode for comfortable viewing during day or night study sessions.'
        }
    ]
};

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

document.addEventListener('DOMContentLoaded', async function() {
    loadAppState();
    await initializeApp();
});

function loadAppState() {
    const savedState = localStorage.getItem('prioritixState');
    if (savedState) {
        appState = { ...appState, ...JSON.parse(savedState) };
        applyTheme();
    }
}

function saveAppState() {
    localStorage.setItem('prioritixState', JSON.stringify(appState));
}

async function initializeApp() {
    setupEventListeners();

    // Check if user is already logged in via Supabase
    const { data: { user } } = await db.auth.getUser();

    if (user) {
        appState.user = { email: user.email, id: user.id };
        saveAppState();
        showMainApp();
        renderAllSections();
        if (appState.firstTimeUser) {
            setTimeout(() => startTour(), 1000);
        }
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

function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    
    if (tab === 'login') {
        document.getElementById('login-form').style.display = 'flex';
    } else {
        document.getElementById('signup-form').style.display = 'flex';
    }

    document.querySelectorAll('.auth-tab').forEach(t => {
        if (t.getAttribute('onclick').includes(tab)) {
            t.classList.add('active');
        }
    });
}

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        showAuthMessage(error.message, 'login-form');
    } else {
        appState.user = { email: data.user.email, id: data.user.id };
        saveAppState();
        showMainApp();
        renderAllSections();
    }
});

document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match!', 'signup-form');
        return;
    }

    const { data, error } = await db.auth.signUp({
        email,
        password,
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
    const messageEl = form.querySelector('.auth-message');
    messageEl.textContent = message;
    messageEl.style.color = 'var(--danger-color)';
    setTimeout(() => {
        messageEl.textContent = '';
    }, 3000);
}

function navigateTo(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(section + '-section').style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });
    
    if (section === 'prioritix' || section === 'dashboard') {
        location.reload();
    }
   
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.querySelector('.sidebar').classList.toggle('active');
}

async function showUserMenu() {
    if (confirm('Do you want to logout?')) {
        await db.auth.signOut();
        appState.user = null;
        saveAppState();
        location.reload();
    }
}

async function renderAllSections() {
    await loadTasks();
    await loadFlashcards();
    await loadMoodHistory();
    await loadEvents();
await loadNotes();      // notes still uses localStorage for now
    renderFormulas();    // formulas still uses localStorage for now
    renderAnalytics();
    renderMentalHealth();
    updateSubjectDropdowns();
}

function renderDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = appState.tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });
    
    document.getElementById('today-tasks-count').textContent = todayTasks.length;
    document.getElementById('study-hours-count').textContent = appState.analytics.studyHours;
    
    const completedTasks = appState.tasks.filter(task => task.completed).length;
    const totalTasks = appState.tasks.length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('productivity-score').textContent = productivity + '%';
    
    const currentMood = appState.moodHistory.length > 0 ? 
        appState.moodHistory[appState.moodHistory.length - 1].mood : '😊';
    document.getElementById('current-mood-display').textContent = currentMood;
}


async function loadTasks() {
    const { data, error } = await db
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.log(error); return; }

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
        let quadrant = 'not-urgent-not-important';
        if (task.urgent && task.important) {
            quadrant = 'urgent-important';
        } else if (!task.urgent && task.important) {
            quadrant = 'important-not-urgent';
        } else if (task.urgent && !task.important) {
            quadrant = 'urgent-not-important';
        }
        quadrants[quadrant].push(task);
    });
    
    Object.keys(quadrants).forEach(quadrant => {
        const container = document.getElementById(quadrant + '-tasks');
        container.innerHTML = '';
        
        quadrants[quadrant].forEach(task => {
            const taskEl = createTaskElement(task);
            container.appendChild(taskEl);
        });
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item priority-${task.priority}`;
    div.draggable = true;
    div.dataset.taskId = task.id;
    
    if (task.completed) {
        div.classList.add('completed');
    }
    
    const deadline = new Date(task.deadline);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    
    if (task.completed) {
           } else if (taskDay < today) {
        div.classList.add('overdue');
    } else if (taskDay.getTime() === today.getTime()) {
        div.classList.add('due-today');
    } else {
        div.classList.add('upcoming');
    }
    
    div.innerHTML = `
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-meta">
            <span>${task.subject}</span>
            <span>${deadline.toLocaleDateString()}</span>
        </div>
        <div class="task-actions">
            <button class="task-action-btn edit" onclick="editTask('${task.id}')">Edit</button>
            <button class="task-action-btn delete" onclick="deleteTask('${task.id}')">Delete</button>
            <button class="task-action-btn" onclick="toggleTaskComplete('${task.id}')">
                ${task.completed ? 'Undo' : 'Complete'}
            </button>
        </div>
    `;
    
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    
    return div;
}

let draggedTask = null;

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTask = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('.task-item');
    if (!dropTarget || !draggedTask) return;
   
    const dropQuadrant = dropTarget.closest('.matrix-quadrant');
    const taskId = draggedTask.dataset.taskId;
   
    const task = appState.tasks.find(t => t.id === taskId);
    if (task && dropQuadrant) {
        const quadrantId = dropQuadrant.id;
        if (quadrantId === 'quadrant-urgent-important') {
            task.urgent = true;
            task.important = true;
        } else if (quadrantId === 'quadrant-important-not-urgent') {
            task.urgent = false;
            task.important = true;
        } else if (quadrantId === 'quadrant-urgent-not-important') {
            task.urgent = true;
            task.important = false;
        } else {
            task.urgent = false;
            task.important = false;
        }
        
        saveAppState();
        renderTasks();
        renderDashboard();
    }
}

function openTaskModal() {
    document.getElementById('task-modal').style.display = 'block';
    document.getElementById('task-form').reset();
}

function editTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-subject').value = task.subject;
    document.getElementById('task-urgent').checked = task.urgent;
    document.getElementById('task-important').checked = task.important;
    document.getElementById('task-deadline').value = task.deadline;
    
    document.getElementById('task-form').dataset.editingId = taskId;
    document.getElementById('task-modal').style.display = 'block';
}

async function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        await db.from('tasks').delete().eq('id', taskId);
        await loadTasks();
    }
}

async function toggleTaskComplete(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
        await db.from('tasks').update({ completed: !task.completed }).eq('id', taskId);
        await loadTasks();
    }
}



document.getElementById('task-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = this.dataset.editingId;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        subject: document.getElementById('task-subject').value,
        urgent: document.getElementById('task-urgent').checked,
        important: document.getElementById('task-important').checked,
        deadline: document.getElementById('task-deadline').value
    };

    if (editingId) {
        await db.from('tasks').update(taskData).eq('id', editingId);
        delete this.dataset.editingId;
    } else {
        await db.from('tasks').insert(taskData);
    }

    closeModal('task-modal');
    await loadTasks();
});

function searchTasks() {
    const searchTerm = document.getElementById('task-search').value.toLowerCase();
    document.querySelectorAll('.task-item').forEach(item => {
        const title = item.querySelector('.task-title').textContent.toLowerCase();
        const description = item.querySelector('.task-description')?.textContent.toLowerCase() || '';
        item.style.display = (title.includes(searchTerm) || description.includes(searchTerm)) ? 'block' : 'none';
    });
}

function sortTasks() {
    const sortBy = document.getElementById('task-sort').value;
    appState.tasks.sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(a.deadline) - new Date(b.deadline);
        } else if (sortBy === 'subject') {
            return a.subject.localeCompare(b.subject);
        }
    });
    saveAppState();
    renderTasks();
}

function startTimer() {
    if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerState.interval = setInterval(updateTimer, 1000);
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
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    document.getElementById('timer-time').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
   
    const progress = document.getElementById('timer-progress');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (timerState.timeLeft / timerState.totalTime) * circumference;
    progress.style.strokeDashoffset = offset;
}

function setTimerMode(mode) {
    timerState.mode = mode;
    if (mode === 'pomodoro') {
        timerState.totalTime = 25 * 60;
    } else if (mode === 'short') {
        timerState.totalTime = 5 * 60;
    } else if (mode === 'long') {
        timerState.totalTime = 15 * 60;
    }
    timerState.timeLeft = timerState.totalTime;
    updateTimerDisplay();
}

function getNewFocusTip() {
    const tip = focusTips[Math.floor(Math.random() * focusTips.length)];
    document.querySelector('#focus-tip p').textContent = tip;
}

function getNewHealthTip() {
    const tip = healthTips[Math.floor(Math.random() * healthTips.length)];
    document.querySelector('#health-tip p').textContent = tip;
}

function toggleFocusMode() {
    document.body.classList.toggle('focus-mode-active');
    const btn = document.querySelector('.focus-mode-toggle');
    if (document.body.classList.contains('focus-mode-active')) {
        btn.textContent = 'Exit Focus Mode';
    } else {
        btn.textContent = 'Enable Focus Mode';
    }
}

async function loadEvents() {
    const { data, error } = await db
        .from('events')
        .select('*');

    if (error) { console.log(error); return; }

    appState.events = data.map(function(e) {
        return {
            id: e.id,
            title: e.title,
            date: e.event_date,
            time: e.event_time,
            type: e.event_type,
            notes: e.notes
        };
    });

    renderCalendar();
}


function renderCalendar() {
    const month = appState.currentCalendarMonth;
    const year = appState.currentCalendarYear;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const today = new Date();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        emptyDay.style.background = 'transparent';
        emptyDay.style.cursor = 'default';
        daysContainer.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = appState.events.filter(e => e.date === dateStr);
        
        if (dayEvents.length > 0) {
            dayEl.classList.add('has-event');
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'calendar-day-events';
            dayEvents.slice(0, 2).forEach(event => {
                eventsDiv.innerHTML += `<div>${event.title}</div>`;
            });
            if (dayEvents.length > 2) {
                eventsDiv.innerHTML += `<div>+${dayEvents.length - 2} more</div>`;
            }
            dayEl.appendChild(eventsDiv);
        }
        
        if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
            dayEl.classList.add('today');
        }
        
        dayEl.addEventListener('click', () => showDayEvents(dateStr, dayEvents));
        daysContainer.appendChild(dayEl);
    }
    
    renderUpcomingEvents();
}

function navigateMonth(delta) {
    appState.currentCalendarMonth += delta;
    if (appState.currentCalendarMonth > 11) {
        appState.currentCalendarMonth = 0;
        appState.currentCalendarYear++;
    } else if (appState.currentCalendarMonth < 0) {
        appState.currentCalendarMonth = 11;
        appState.currentCalendarYear--;
    }
    renderCalendar();
}

function openEventModal() {
    document.getElementById('event-modal').style.display = 'block';
    document.getElementById('event-form').reset();
}

function showDayEvents(dateStr, events) {
    document.getElementById('calendar-events-date').textContent = `Events for ${dateStr}`;
    const listContainer = document.getElementById('calendar-events-list');
    listContainer.innerHTML = '';
    
    if (events.length === 0) {
        listContainer.innerHTML = '<p>No events for this date.</p>';
    } else {
        events.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar-event-item';
            eventEl.innerHTML = `
                <h4>${event.title}</h4>
                <p>Time: ${event.time}</p>
                <p>Type: ${event.type}</p>
                ${event.notes ? `<p>${event.notes}</p>` : ''}
                <div class="calendar-event-actions">
                    <button class="btn btn-secondary" onclick="editEvent('${event.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteEvent('${event.id}')">Delete</button>
                </div>
            `;
            listContainer.appendChild(eventEl);
        });
    }
    
    document.getElementById('calendar-events-modal').style.display = 'block';
}

function editEvent(eventId) {
    const event = appState.events.find(e => e.id === eventId);
    if (!event) return;
    
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-time').value = event.time;
    document.getElementById('event-type').value = event.type;
    document.getElementById('event-notes').value = event.notes || '';
    
    closeModal('calendar-events-modal');
    document.getElementById('event-form').dataset.editingId = eventId;
    document.getElementById('event-modal').style.display = 'block';
}

async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        await db.from('events').delete().eq('id', eventId);
        await loadEvents();
        closeModal('calendar-events-modal');
    }
}

document.getElementById('event-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = this.dataset.editingId;
    const eventData = {
        title: document.getElementById('event-title').value,
        event_date: document.getElementById('event-date').value,
        event_time: document.getElementById('event-time').value,
        event_type: document.getElementById('event-type').value,
        notes: document.getElementById('event-notes').value
    };

    if (editingId) {
        await db.from('events').update(eventData).eq('id', editingId);
        delete this.dataset.editingId;
    } else {
        await db.from('events').insert(eventData);
    }

    closeModal('event-modal');
    await loadEvents();
});

function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-list');
    container.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = appState.events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcomingEvents.length === 0) {
        container.innerHTML = '<p>No upcoming events.</p>';
    } else {
        upcomingEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'upcoming-event-item';
            eventEl.innerHTML = `
                <strong>${event.title}</strong><br>
                <small>${event.date} at ${event.time}</small>
            `;
            container.appendChild(eventEl);
        });
    }
}

function showLearningTab(tab) {
    document.querySelectorAll('.learning-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.learning-subsection').forEach(s => s.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(tab + '-subsection').style.display = 'block';
}


async function loadNotes() {        // ← NEW function starts here
    const { data, error } = await db
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.log(error); return; }

    appState.notes = data.map(function(note) {
        return {
            id: note.id,
            title: note.title,
            subject: note.subject,
            content: note.content,
            links: [],
            hidden: false
        };
    });

    renderNotes();
}                                   // ← NEW function ends here


function renderNotes() {
    const container = document.getElementById('notes-grid');
    const subjectFilter = document.getElementById('notes-subject-filter').value;
    const showHidden = document.getElementById('toggle-notes-visibility').checked;
    
    container.innerHTML = '';
    
    let filteredNotes = appState.notes;
    if (subjectFilter !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.subject === subjectFilter);
    }
    if (!showHidden) {
        filteredNotes = filteredNotes.filter(n => !n.hidden);
    }
    
    filteredNotes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = 'note-card';
        noteEl.innerHTML = `
            <h3>${note.title}</h3>
            <p class="note-content">${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</p>
            ${note.links && note.links.length > 0 ? `
                <div class="note-links">
                    ${note.links.map(link => `<a href="${link}" target="_blank" class="note-link">Link</a>`).join('')}
                </div>
            ` : ''}
            ${note.image ? `<img src="${note.image}" alt="Note image" class="note-image">` : ''}
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editNote('${note.id}')">Edit</button>
<button class="btn btn-secondary" onclick="toggleNoteVisibility('${note.id}')">${note.hidden ? 'Show' : 'Hide'}</button>
<button class="btn btn-danger" onclick="deleteNote('${note.id}')">Delete</button>
            </div>
        `;
        container.appendChild(noteEl);
    });
}

function openNoteModal() {
    document.getElementById('note-modal').style.display = 'block';
    document.getElementById('note-form').reset();
    document.getElementById('note-image-preview').style.display = 'none';
    delete document.getElementById('note-form').dataset.editingId;
}

function editNote(noteId) {
    const note = appState.notes.find(n => n.id === noteId);
    if (!note) return;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-subject').value = note.subject;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-form').dataset.editingId = noteId;
    document.getElementById('note-modal').style.display = 'block';
}

function toggleNoteVisibility(noteId) {
    const note = appState.notes.find(n => n.id === noteId);
    if (note) {
        note.hidden = !note.hidden;
        saveAppState();
        renderNotes();
    }
}

async function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        await db.from('notes').delete().eq('id', noteId);
        await loadNotes();
    }
}

document.getElementById('note-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = this.dataset.editingId;
    const noteData = {
        title: document.getElementById('note-title').value,
        subject: document.getElementById('note-subject').value,
        content: document.getElementById('note-content').value
    };

    if (editingId) {
        await db.from('notes').update(noteData).eq('id', editingId);
        delete this.dataset.editingId;
    } else {
        await db.from('notes').insert(noteData);
    }

    closeModal('note-modal');
    await loadNotes();
});
function filterNotes() {
    renderNotes();
}

function toggleNotesVisibility() {
    renderNotes();
}


async function loadFlashcards() {
    const { data, error } = await db
        .from('flashcards')
        .select('*');

    if (error) { console.log(error); return; }

    appState.flashcards = data.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        subject: card.subject,
        hidden: false
    }));

    renderFlashcards();
}

function renderFlashcards() {
    const container = document.getElementById('flashcards-container');
    const subjectFilter = document.getElementById('flashcards-subject-filter').value;
    const showHidden = document.getElementById('toggle-flashcards-visibility').checked;
    
    container.innerHTML = '';
    
    let filteredFlashcards = appState.flashcards;
    if (subjectFilter !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(f => f.subject === subjectFilter);
    }
    if (!showHidden) {
        filteredFlashcards = filteredFlashcards.filter(f => !f.hidden);
    }
    
    if (filteredFlashcards.length === 0) {
        container.innerHTML = '<p>No flashcards available.</p>';
        return;
    }
   
    const grouped = {};
    filteredFlashcards.forEach(card => {
        if (!grouped[card.subject]) {
            grouped[card.subject] = [];
        }
        grouped[card.subject].push(card);
    });
    
    Object.keys(grouped).forEach(subject => {
        const subjectTitle = document.createElement('h3');
        subjectTitle.textContent = subject;
        subjectTitle.style.marginTop = '20px';
        container.appendChild(subjectTitle);
        
        grouped[subject].forEach((card, index) => {
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
                </div>
            `;
           cardEl.addEventListener('click', function() {
    this.classList.toggle('flipped');
    if (this.classList.contains('flipped')) {
        appState.analytics.flashcardsReviewed++;
        saveAppState();
        renderAnalytics();
    }
});

const actionsDiv = document.createElement('div');
actionsDiv.className = 'card-actions';
actionsDiv.innerHTML = `
    <button class="btn btn-secondary" onclick="editFlashcard('${card.id}')">Edit</button>
    <button class="btn btn-danger" onclick="deleteFlashcard('${card.id}')">Delete</button>
`;
cardEl.appendChild(actionsDiv);
            container.appendChild(cardEl);
        });
    });
    
    const navDiv = document.createElement('div');
    navDiv.className = 'flashcard-controls';
    navDiv.innerHTML = `
        <button class="flashcard-nav-btn" onclick="scrollFlashcards(-1)">Previous</button>
        <button class="flashcard-nav-btn" onclick="scrollFlashcards(1)">Next</button>
    `;
    container.appendChild(navDiv);
}

function scrollFlashcards(direction) {
    const container = document.getElementById('flashcards-container');
    const scrollAmount = 320;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
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
    document.getElementById('flashcard-answer').value = card.answer;
    document.getElementById('flashcard-subject').value = card.subject;
    document.getElementById('flashcard-form').dataset.editingId = cardId;
    document.getElementById('flashcard-modal').style.display = 'block';
}
async function deleteFlashcard(cardId) {
    if (confirm('Are you sure you want to delete this flashcard?')) {
        await db.from('flashcards').delete().eq('id', cardId);
        await loadFlashcards();
    }
}


function toggleFlashcardVisibility(cardId) {
    const card = appState.flashcards.find(f => f.id === cardId);
    if (card) {
        card.hidden = !card.hidden;
        saveAppState();
        renderFlashcards();
    }
}

document.getElementById('flashcard-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = this.dataset.editingId;
    const cardData = {
        question: document.getElementById('flashcard-question').value,
        answer: document.getElementById('flashcard-answer').value,
        subject: document.getElementById('flashcard-subject').value
    };

    if (editingId) {
        await db.from('flashcards').update(cardData).eq('id', editingId);
        delete this.dataset.editingId;
    } else {
        await db.from('flashcards').insert(cardData);
    }

    closeModal('flashcard-modal');
    await loadFlashcards();
});

function filterFlashcards() {
    renderFlashcards();
}

function toggleFlashcardsVisibility() {
    renderFlashcards();
}

function renderFormulas() {
    const container = document.getElementById('formulas-grid');
    const subjectFilter = document.getElementById('formulas-subject-filter').value;
    const showHidden = document.getElementById('toggle-formulas-visibility').checked;
    
    container.innerHTML = '';
    
    let filteredFormulas = appState.formulas;
    if (subjectFilter !== 'all') {
        filteredFormulas = filteredFormulas.filter(f => f.subject === subjectFilter);
    }
    if (!showHidden) {
        filteredFormulas = filteredFormulas.filter(f => !f.hidden);
    }
    
    filteredFormulas.forEach(formula => {
        const formulaEl = document.createElement('div');
        formulaEl.className = 'formula-card';
        formulaEl.innerHTML = `
            <h3>${formula.name}</h3>
            <div class="formula-expression">${formula.expression}</div>
            <p class="formula-content">Subject: ${formula.subject}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="toggleFormulaVisibility('${formula.id}')">${formula.hidden ? 'Show' : 'Hide'}</button>
                <button class="btn btn-danger" onclick="deleteFormula('${formula.id}')">Delete</button>
            </div>
        `;
        container.appendChild(formulaEl);
    });
}

function openFormulaModal() {
    document.getElementById('formula-modal').style.display = 'block';
    document.getElementById('formula-form').reset();
}

function deleteFormula(formulaId) {
    if (confirm('Are you sure you want to delete this formula?')) {
        appState.formulas = appState.formulas.filter(f => f.id !== formulaId);
        saveAppState();
        renderFormulas();
    }
}

function toggleFormulaVisibility(formulaId) {
    const formula = appState.formulas.find(f => f.id === formulaId);
    if (formula) {
        formula.hidden = !formula.hidden;
        saveAppState();
        renderFormulas();
    }
}

document.getElementById('formula-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formulaData = {
        id: Date.now().toString(),
        name: document.getElementById('formula-name').value,
        expression: document.getElementById('formula-expression').value,
        subject: document.getElementById('formula-subject').value,
        hidden: false
    };
    
    appState.formulas.push(formulaData);
    saveAppState();
    closeModal('formula-modal');
    renderFormulas();
});

function filterFormulas() {
    renderFormulas();
}

function toggleFormulasVisibility() {
    renderFormulas();
}

function openSubjectModal(type) {
    document.getElementById('subject-modal').style.display = 'block';
    document.getElementById('subject-form').reset();
    document.getElementById('subject-type').value = type;
}

document.getElementById('subject-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('subject-type').value;
    const subjectName = document.getElementById('subject-name').value;
    
    if (!appState.subjects[type].includes(subjectName)) {
        appState.subjects[type].push(subjectName);
        saveAppState();
        updateSubjectDropdowns();
    }
    
    closeModal('subject-modal');
});

function updateSubjectDropdowns() {
    ['notes', 'flashcards', 'formulas', 'task'].forEach(type => {
        const selectId = type === 'task' ? 'task-subject' : `${type}-subject`;
        const filterId = `${type}-subject-filter`;

        const subjects = appState.subjects[type === 'task' ? 'notes' : type] || ['General'];

        const selectEl = document.getElementById(selectId);
        if (selectEl) {
            selectEl.innerHTML = '';
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                selectEl.appendChild(opt);
            });
        }

        const filterEl = document.getElementById(filterId);
        if (filterEl) {
            filterEl.innerHTML = '';
            const allOpt = document.createElement('option');
            allOpt.value = 'all';
            allOpt.textContent = 'All Subjects';
            filterEl.appendChild(allOpt);

            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                filterEl.appendChild(opt);
            });
        }
    });
}

function renderAnalytics() {
    renderActivityChart();
    renderSubjectChart();
    renderHoursChart();
    renderMoodHistory();
    updateStatsSummary();
}

function renderActivityChart() {
    const canvas = document.getElementById('activity-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayTasks = appState.tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toDateString() === date.toDateString() && task.completed;
        });
        data.push(dayTasks.length);
    }
    
    const padding = 60;
const availableWidth = canvas.width - padding * 2;
const barWidth = availableWidth / labels.length * 0.5;
const gap = availableWidth / labels.length * 0.5;
const startX = padding;
    const startY = canvas.height - 60;
    const maxHeight = canvas.height - 100;
    const maxData = Math.max(...data, 1);
    
    ctx.fillStyle = '#4CAF50';
    data.forEach((value, index) => {
        const barHeight = (value / maxData) * maxHeight;
        const x = startX + index * (barWidth + gap);
        const y = startY - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
       
        ctx.fillStyle = '#212121';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, startY + 20);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(value, x + barWidth / 2, y - 5);
        
        ctx.fillStyle = '#4CAF50';
    });
}

function renderSubjectChart() {
    const canvas = document.getElementById('subject-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const subjectCounts = {};
    appState.tasks.filter(t => t.completed).forEach(task => {
        subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
    });
    
    const labels = Object.keys(subjectCounts);
    const data = Object.values(subjectCounts);
    
    if (labels.length === 0) {
        ctx.fillStyle = '#757575';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0', '#00BCD4'];
    let startAngle = 0;
    const total = data.reduce((sum, val) => sum + val, 0);
    
    data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
        
        ctx.fillStyle = '#212121';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${labels[index]}`, labelX, labelY);
        
        startAngle += sliceAngle;
    });
}

function renderHoursChart() {
    const canvas = document.getElementById('hours-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const labels = [];
    const data = [];
    for (let i = 3; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        labels.push(`Week ${4 - i}`);
        
        const weekHours = Math.round(appState.analytics.studyHours / 4 * (1 + Math.random() * 0.5));
        data.push(weekHours);
    }
    
    const startX = 50;
    const startY = canvas.height - 50;
    const endX = canvas.width - 30;
    const endY = 30;
    const maxData = Math.max(...data, 1);
    
    ctx.beginPath();
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    
    const pointCoordinates = [];
    data.forEach((value, index) => {
        const x = startX + (index / (data.length - 1)) * (endX - startX);
        const y = startY - (value / maxData) * (startY - endY);
        
        pointCoordinates.push({ x, y, value, label: labels[index] });
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    pointCoordinates.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#2196F3';
        ctx.fill();
        
        ctx.fillStyle = '#212121';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, point.x, startY + 20);
        ctx.fillText(point.value + 'h', point.x, point.y - 10);
    });
}

function renderMoodHistory() {
    const container = document.getElementById('mood-history');
    container.innerHTML = '';
    
    if (appState.moodHistory.length === 0) {
        container.innerHTML = '<p>No mood data recorded yet.</p>';
        return;
    }
    
    const recentMoods = appState.moodHistory.slice(-14);
    
    recentMoods.forEach(moodEntry => {
        const moodEl = document.createElement('div');
        moodEl.className = 'mood-circle';
        moodEl.textContent = moodEntry.mood;
        moodEl.dataset.tooltip = `${moodEntry.date} at ${moodEntry.time}`;
        container.appendChild(moodEl);
    });
}

function updateStatsSummary() {
    document.getElementById('total-tasks-completed').textContent = appState.analytics.tasksCompleted;
    document.getElementById('total-study-hours').textContent = appState.analytics.studyHours.toFixed(1);
    document.getElementById('total-pomodoro-sessions').textContent = appState.analytics.pomodoroSessions;
    document.getElementById('total-flashcards-reviewed').textContent = appState.analytics.flashcardsReviewed;
}

async function logMood(mood) {
    const { error } = await db.from('mood_logs').insert({ mood: mood });

    if (error) {
        console.log('Error logging mood:', error);
        return;
    }

    document.getElementById('mood-status').textContent = `Mood logged: ${mood}`;
    await loadMoodHistory(); // reload from database
    renderDashboard();
    renderAnalytics();
}

async function loadMoodHistory() {
    const { data, error } = await db
        .from('mood_logs')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(14);

    if (error) { console.log(error); return; }

    // convert to the format your existing renderMoodHistory() expects
    appState.moodHistory = data.map(entry => ({
        mood: entry.mood,
        date: new Date(entry.logged_at).toLocaleDateString(),
        time: new Date(entry.logged_at).toLocaleTimeString()
    }));

    renderMoodHistory();
}

function saveReflection() {
    const reflection = document.getElementById('reflection-text').value;
    if (reflection.trim()) {
        appState.reflections.push({
            content: reflection,
            date: new Date().toISOString()
        });
        saveAppState();
        document.getElementById('reflection-text').value = '';
        alert('Reflection saved successfully!');
    }
}

function getNewMentalHealthTip() {
    const tip = mentalHealthTips[Math.floor(Math.random() * mentalHealthTips.length)];
    document.querySelector('#mental-health-tip p').textContent = tip;
}

function openEmergencyContactModal() {
    document.getElementById('emergency-contact-modal').style.display = 'block';
    document.getElementById('emergency-contact-form').reset();
}

document.getElementById('emergency-contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const contactData = {
        name: document.getElementById('contact-name').value,
        number: document.getElementById('contact-number').value
    };
    
    appState.emergencyContacts.push(contactData);
    saveAppState();
    closeModal('emergency-contact-modal');
    renderMentalHealth();
});

function renderMentalHealth() {
    const container = document.getElementById('emergency-contacts');
    container.innerHTML = '';
    
    appState.emergencyContacts.forEach((contact, index) => {
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.innerHTML = `
            <span class="contact-name">${contact.name}</span>
            <span class="contact-number">${contact.number}</span>
            ${index > 0 ? `<button class="btn btn-danger" onclick="deleteEmergencyContact(${index})">Delete</button>` : ''}
        `;
        container.appendChild(contactEl);
    });
}

function deleteEmergencyContact(index) {
    if (confirm('Are you sure you want to delete this contact?')) {
        appState.emergencyContacts.splice(index, 1);
        saveAppState();
        renderMentalHealth();
    }
}



function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function startTour() {
    appState.firstTimeUser = false;
    saveAppState();
    tourState.isActive = true;
    tourState.currentStep = 0;
    document.getElementById('tour-overlay').style.display = 'block';
    showTourStep(0);
}

function showTourStep(stepIndex) {
    if (stepIndex >= tourState.steps.length) {
        endTour();
        return;
    }
    
    tourState.currentStep = stepIndex;
    const step = tourState.steps[stepIndex];
    
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-description').textContent = step.description;
    
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const highlight = document.querySelector('.tour-highlight');
        const tooltip = document.querySelector('.tour-tooltip');
        
        highlight.style.width = rect.width + 20 + 'px';
        highlight.style.height = rect.height + 20 + 'px';
        highlight.style.top = (rect.top - 10) + 'px';
        highlight.style.left = (rect.left - 10) + 'px';
        
        tooltip.style.maxWidth = '350px';
        
        const tooltipHeight = 200; 
        const tooltipWidth = 350;
        
        if (rect.bottom + tooltipHeight + 20 < window.innerHeight) {
            tooltip.style.top = (rect.bottom + 20) + 'px';
            tooltip.style.left = Math.max(10, Math.min(rect.left + (rect.width - tooltipWidth) / 2, window.innerWidth - tooltipWidth - 10)) + 'px';
        } else if (rect.top - tooltipHeight - 20 > 0) {
            tooltip.style.top = (rect.top - tooltipHeight - 20) + 'px';
            tooltip.style.left = Math.max(10, Math.min(rect.left + (rect.width - tooltipWidth) / 2, window.innerWidth - tooltipWidth - 10)) + 'px';
        } else {
            tooltip.style.top = Math.max(10, Math.min(rect.top, window.innerHeight - tooltipHeight - 10)) + 'px';
            tooltip.style.left = (rect.right + 20) + 'px';
        }
        
        document.querySelector('.prev-btn').disabled = stepIndex === 0;
        document.querySelector('.next-btn').textContent = stepIndex === tourState.steps.length - 1 ? 'Finish' : 'Next';
    }
}

function nextTourStep() {
    showTourStep(tourState.currentStep + 1);
}

function prevTourStep() {
    if (tourState.currentStep > 0) {
        showTourStep(tourState.currentStep - 1);
    }
}

function skipTour() {
    endTour();
}

function restartTour() {
    showTourStep(0);
}

function endTour() {
    tourState.isActive = false;
    document.getElementById('tour-overlay').style.display = 'none';
}

function setupEventListeners() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    const dropZone = document.getElementById('note-drop-zone');
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
            if (file && file.type.startsWith('image/')) {
                handleImageUpload(file);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
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

function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('note-image-preview');
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openTaskModal();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
    }
    
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode-active')) {
        toggleFocusMode();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});


console.log('Prioritix loaded successfully!');

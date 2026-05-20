const STORAGE_KEY = 'bb-learning-progress';

function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
}

function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function markComplete(moduleId) {
    const p = getProgress();
    p[moduleId] = { completed: true, date: new Date().toISOString().split('T')[0] };
    saveProgress(p);
    updateUI();
}

function markIncomplete(moduleId) {
    const p = getProgress();
    delete p[moduleId];
    saveProgress(p);
    updateUI();
}

function isComplete(moduleId) {
    return getProgress()[moduleId]?.completed === true;
}

function getCompletedCount() {
    return Object.values(getProgress()).filter(v => v.completed).length;
}

function updateUI() {
    document.querySelectorAll('[data-module-id]').forEach(el => {
        const id = el.dataset.moduleId;
        if (isComplete(id)) {
            el.classList.add('completed');
        } else {
            el.classList.remove('completed');
        }
    });

    const totalEl = document.querySelector('[data-progress-total]');
    const barEl = document.querySelector('[data-progress-bar]');
    if (totalEl && barEl) {
        const total = parseInt(totalEl.dataset.progressTotal);
        const done = getCompletedCount();
        barEl.style.width = `${(done / total) * 100}%`;
        const countEl = document.querySelector('[data-progress-count]');
        if (countEl) countEl.textContent = done;
    }

    document.querySelectorAll('.complete-btn').forEach(btn => {
        const id = btn.dataset.moduleId;
        if (isComplete(id)) {
            btn.textContent = 'Completed';
            btn.classList.add('is-complete');
        } else {
            btn.textContent = 'Mark Complete';
            btn.classList.remove('is-complete');
        }
    });
}

function toggleComplete(moduleId) {
    if (isComplete(moduleId)) {
        markIncomplete(moduleId);
    } else {
        markComplete(moduleId);
    }
}

document.addEventListener('DOMContentLoaded', updateUI);

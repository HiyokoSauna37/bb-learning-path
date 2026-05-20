const QUIZ_STORAGE_KEY = 'bb-learning-quiz';

function getQuizProgress() {
    try {
        return JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || '{}');
    } catch { return {}; }
}

function saveQuizProgress(data) {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
}

function getQuizScore(quizId) {
    return getQuizProgress()[quizId] || null;
}

function saveQuizScore(quizId, score, total) {
    const p = getQuizProgress();
    p[quizId] = { score, total, percentage: Math.round((score / total) * 100), date: new Date().toISOString().split('T')[0] };
    saveQuizProgress(p);
}

function getQuizCompletedCount() {
    return Object.keys(getQuizProgress()).length;
}

function getTotalQuizScore() {
    const p = getQuizProgress();
    const entries = Object.values(p);
    if (entries.length === 0) return { score: 0, total: 0, percentage: 0 };
    const score = entries.reduce((sum, e) => sum + e.score, 0);
    const total = entries.reduce((sum, e) => sum + e.total, 0);
    return { score, total, percentage: Math.round((score / total) * 100) };
}

function initQuiz(quizId, questions) {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    let currentQ = 0;
    let score = 0;
    let answered = new Array(questions.length).fill(null);

    function renderQuestion() {
        const q = questions[currentQ];
        const prev = getQuizScore(quizId);

        let html = `
            <div class="quiz-header">
                <span class="quiz-progress">Question ${currentQ + 1} / ${questions.length}</span>
                ${prev ? `<span class="quiz-prev-score">前回: ${prev.score}/${prev.total} (${prev.percentage}%)</span>` : ''}
            </div>
            <div class="quiz-question">${q.question}</div>
            <div class="quiz-options">
        `;

        q.options.forEach((opt, i) => {
            const selected = answered[currentQ] === i;
            const isCorrect = i === q.answer;
            let cls = 'quiz-option';
            if (answered[currentQ] !== null) {
                if (isCorrect) cls += ' correct';
                else if (selected && !isCorrect) cls += ' incorrect';
            }
            html += `<button class="${cls}" data-idx="${i}" ${answered[currentQ] !== null ? 'disabled' : ''}>${opt}</button>`;
        });

        html += '</div>';

        if (answered[currentQ] !== null) {
            html += `<div class="quiz-explanation">${q.explanation}</div>`;
            html += '<div class="quiz-nav">';
            if (currentQ < questions.length - 1) {
                html += '<button class="quiz-next-btn" onclick="nextQuestion()">Next &rarr;</button>';
            } else {
                html += `<button class="quiz-next-btn" onclick="showResults()">結果を見る</button>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;

        if (answered[currentQ] === null) {
            container.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.idx)));
            });
        }
    }

    function selectAnswer(idx) {
        answered[currentQ] = idx;
        if (idx === questions[currentQ].answer) score++;
        renderQuestion();
    }

    window.nextQuestion = function() {
        currentQ++;
        renderQuestion();
    };

    window.showResults = function() {
        saveQuizScore(quizId, score, questions.length);
        const pct = Math.round((score / questions.length) * 100);
        let grade = '';
        if (pct >= 80) grade = '<span style="color:var(--green)">Excellent! 次のモジュールに進もう。</span>';
        else if (pct >= 60) grade = '<span style="color:var(--yellow)">Good. 間違えた箇所を復習してから進もう。</span>';
        else grade = '<span style="color:var(--red)">もう一度モジュールを読み直してから再挑戦しよう。</span>';

        container.innerHTML = `
            <div class="quiz-results">
                <h3>Quiz Results</h3>
                <div class="quiz-score-display">${score} / ${questions.length} (${pct}%)</div>
                <p>${grade}</p>
                <button class="quiz-retry-btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    };

    renderQuestion();
}

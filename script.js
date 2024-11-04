let character = '';
let playerName = '';
let level = 1;
let gemsCollected = 0;
let currentQuestion = {};
let incorrectAttempts = 0;
let totalQuestions = 10; // Total number of questions per level
let questionHistory = [];
let currentQuestionIndex = -1;
let correctAnswers = 0;
let incorrectAnswers = 0;
const maxLevel = 5;
const gemsPerLevel = 5; // Number of gems needed to level up
let achievements = [];
let miniGamePlayed = false;

const positiveFeedback = [
    'Great job!',
    'Fantastic!',
    'You got it!',
    'Keep it up!',
];

const tryAgainMessages = [
    'Almost there!',
    'You can do it!',
    'Give it another try!',
];

// Function to play sound using Web Audio API
function playSound(frequency, type = 'sine', duration = 0.2) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function goToCharacterSelection() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('character-screen').style.display = 'block';
}

function selectCharacter(selectedCharacter) {
    character = selectedCharacter;
    playerName = document.getElementById('player-name').value.trim() || 'Adventurer';

    const avatarColor = document.getElementById('avatar-color').value;
    document.documentElement.style.setProperty('--avatar-color', avatarColor);

    document.getElementById('character-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('display-name').textContent = playerName;
    updateStatusBar();
    showStorySegment();
    generateQuestion();
}

function updateStatusBar() {
    document.getElementById('level').textContent = level;
    document.getElementById('gems').textContent = gemsCollected;
}

function generateQuestion(isGoingBack = false) {
    if (!isGoingBack) {
        currentQuestionIndex++;
    }

    if (currentQuestionIndex >= totalQuestions) {
        currentQuestionIndex = 0;
        levelUp();
    }

    const creatures = ['Rabbit', 'Owl', 'Fox', 'Squirrel', 'Deer'];
    const creature = creatures[Math.floor(Math.random() * creatures.length)];

    const creatureElement = document.getElementById('creature');
    creatureElement.innerHTML = '';
    creatureElement.className = 'creature';
    creatureElement.classList.add(creature.toLowerCase());

    let operator = getOperator(level);
    let num1, num2;

    if (operator === '×') {
        num1 = getRandomNumber(1, 9);
        num2 = getRandomNumber(1, 9);
    } else if (operator === '÷') {
        num2 = getRandomNumber(1, 9);
        let temp = getRandomNumber(level);
        num1 = num2 * temp;
    } else {
        num1 = getRandomNumber(level);
        num2 = getRandomNumber(level);
    }

    if (operator === '-') {
        if (num1 < num2) {
            [num1, num2] = [num2, num1];
        }
    }

    let questionText = `${num1} ${operator} ${num2}`;
    let correctAnswer = calculateAnswer(num1, num2, operator);

    currentQuestion = {
        question: `${creature}: Hello ${playerName}! What is ${questionText}?`,
        answer: correctAnswer,
        userAnswer: '',
        isAnswered: false,
        isCorrect: false,
        operator: operator
    };

    questionHistory[currentQuestionIndex] = { ...currentQuestion };

    updateProgress();

    document.getElementById('question').textContent = currentQuestion.question;
    document.getElementById('answer').value = currentQuestion.userAnswer || '';
    document.getElementById('feedback').textContent = '';

    const answerInput = document.getElementById('answer');
    answerInput.focus();

    answerInput.removeEventListener('keydown', handleKeyDown);
    answerInput.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        submitAnswer();
    }
}

function getRandomNumber(level, maxNumber = null) {
    if (maxNumber !== null) {
        return Math.floor(Math.random() * maxNumber) + 1;
    } else {
        let max = level * 10;
        return Math.floor(Math.random() * max) + 1;
    }
}

function getOperator(level) {
    let operators = ['+', '-'];
    if (level >= 2) {
        operators.push('×');
    }
    if (level >= 3) {
        operators.push('÷');
    }
    return operators[Math.floor(Math.random() * operators.length)];
}

function calculateAnswer(num1, num2, operator) {
    switch (operator) {
        case '+':
            return num1 + num2;
        case '-':
            return num1 - num2;
        case '×':
            return num1 * num2;
        case '÷':
            return num1 / num2;
    }
}

function submitAnswer() {
    const userAnswer = parseFloat(document.getElementById('answer').value);
    currentQuestion.userAnswer = userAnswer;

    if (userAnswer === currentQuestion.answer) {
        if (!currentQuestion.isAnswered) {
            correctAnswers++;
            currentQuestion.isCorrect = true;
            currentQuestion.isAnswered = true;

            gemsCollected++;
            document.getElementById('gems').textContent = gemsCollected;

            playSound(440, 'sine', 0.3);

            checkAchievements();

            if (gemsCollected % gemsPerLevel === 0) {
                levelUp();
            }
        }
        incorrectAttempts = 0;
        displayFeedback('Correct!', true);
        generateQuestion();
    } else {
        if (!currentQuestion.isAnswered || !currentQuestion.isCorrect) {
            if (!currentQuestion.isAnswered) {
                incorrectAnswers++;
            }
            currentQuestion.isCorrect = false;
            currentQuestion.isAnswered = true;
        }
        incorrectAttempts++;

        playSound(220, 'sawtooth', 0.3);

        displayFeedback('Try again!', false);
        if (incorrectAttempts >= 3) {
            displayHint();
            incorrectAttempts = 0;
        }
    }

    updateProgress();
}

function displayFeedback(message, isCorrect) {
    const feedbackEl = document.getElementById('feedback');
    const randomMessage = isCorrect
        ? positiveFeedback[Math.floor(Math.random() * positiveFeedback.length)]
        : tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
    feedbackEl.textContent = randomMessage;
    feedbackEl.className = isCorrect ? 'green' : 'red';
}

function displayHint() {
    alert('Hint: Remember to follow the order of operations (PEMDAS).');
}

function updateProgress() {
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('incorrect-answers').textContent = incorrectAnswers;
    document.getElementById('remaining-questions').textContent = totalQuestions - currentQuestionIndex - 1;

    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progress').style.width = progressPercentage + '%';
}

function goBack() {
    if (currentQuestionIndex > 0) {
        if (currentQuestion.isAnswered) {
            if (currentQuestion.isCorrect) {
                correctAnswers--;
                gemsCollected--;
                document.getElementById('gems').textContent = gemsCollected;
            } else {
                incorrectAnswers--;
            }
            currentQuestion.isAnswered = false;
            currentQuestion.isCorrect = false;
        }

        currentQuestionIndex -= 1;
        currentQuestion = questionHistory[currentQuestionIndex];
        generateQuestion(true);
        updateProgress();
    } else {
        alert('You are at the first question.');
    }
}

function saveGame() {
    const gameState = {
        character,
        playerName,
        level,
        gemsCollected,
        currentQuestionIndex,
        correctAnswers,
        incorrectAnswers,
        questionHistory,
        incorrectAttempts,
        background: document.body.style.background,
        achievements,
        miniGamePlayed
    };
    localStorage.setItem('savedGame', JSON.stringify(gameState));
    alert('Game saved successfully!');
}

function loadGame() {
    const savedGame = JSON.parse(localStorage.getItem('savedGame'));
    if (savedGame) {
        character = savedGame.character;
        playerName = savedGame.playerName;
        level = savedGame.level;
        gemsCollected = savedGame.gemsCollected;
        currentQuestionIndex = savedGame.currentQuestionIndex;
        correctAnswers = savedGame.correctAnswers;
        incorrectAnswers = savedGame.incorrectAnswers;
        questionHistory = savedGame.questionHistory;
        incorrectAttempts = savedGame.incorrectAttempts;
        document.body.style.background = savedGame.background;
        achievements = savedGame.achievements || [];
        miniGamePlayed = savedGame.miniGamePlayed || false;

        document.getElementById('display-name').textContent = playerName;
        document.getElementById('intro-screen').style.display = 'none';
        document.getElementById('character-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        updateStatusBar();
        updateProgress();
        generateQuestion(true);
    } else {
        alert('No saved game found.');
    }
}

function endGame() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';
    document.getElementById('total-gems').textContent = gemsCollected;
    document.getElementById('final-name').textContent = playerName;

    saveHighScore(playerName, gemsCollected);
    displayHighScores();
    displayAchievements();
}

function displayAchievements() {
    const achievementList = document.getElementById('achievement-list');
    achievementList.innerHTML = '';
    achievements.forEach(achievement => {
        const listItem = document.createElement('li');
        listItem.textContent = achievement;
        achievementList.appendChild(listItem);
    });
}

function saveHighScore(name, score) {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScores.push({ name: name, score: score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    leaderboardEntries.innerHTML = '';
    highScores.forEach(scoreEntry => {
        const entry = document.createElement('p');
        entry.textContent = `${scoreEntry.name}: ${scoreEntry.score} gems`;
        leaderboardEntries.appendChild(entry);
    });
}

function restartGame() {
    character = '';
    playerName = '';
    level = 1;
    gemsCollected = 0;
    currentQuestion = {};
    incorrectAttempts = 0;
    totalQuestions = 10;
    questionHistory = [];
    currentQuestionIndex = -1;
    correctAnswers = 0;
    incorrectAnswers = 0;
    achievements = [];
    miniGamePlayed = false;
    localStorage.removeItem('savedGame');
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'block';
    document.body.style.background = getBackgroundForLevel(level);
}

function levelUp() {
    if (level < maxLevel) {
        level++;
        alert(`Congratulations, ${playerName}! You've reached Level ${level}!\n\n${generateFunFact()}`);
        document.body.style.background = getBackgroundForLevel(level);

        playSound(880, 'triangle', 0.5);

        updateStatusBar();
        updateMapProgress();
        showStorySegment();
        checkForMiniGame();
    }
}

function getBackgroundForLevel(level) {
    switch (level) {
        case 1:
            return 'linear-gradient(to bottom, #a8e6cf, #dcedc1)';
        case 2:
            return 'linear-gradient(to bottom, #ffd54f, #ffb300)';
        case 3:
            return 'linear-gradient(to bottom, #ce93d8, #ab47bc)';
        case 4:
            return 'linear-gradient(to bottom, #90caf9, #42a5f5)';
        case 5:
            return 'linear-gradient(to bottom, #bcaaa4, #8d6e63)';
        default:
            return 'linear-gradient(to bottom, #a8e6cf, #dcedc1)';
    }
}

function generateFunFact() {
    const facts = [
        'Did you know? Zero is the only number that cannot be represented by Roman numerals.',
        'Math Fact: The word "hundred" comes from the old Norse term "hundrath," which actually means 120.',
        'Fun Fact: A circle has infinite lines of symmetry.',
        'Interesting! The number 2 is the only even prime number.',
        'Amazing! The Fibonacci sequence appears in nature, such as in the arrangement of leaves on a stem.',
    ];
    return facts[Math.floor(Math.random() * facts.length)];
}

function showStorySegment() {
    const storySegments = [
        "Welcome, brave adventurer! The Enchanted Forest is in trouble. A mischievous wizard has confused the creatures with tricky math spells!",
        "Great job! You've helped the rabbits find their way home. But the journey continues...",
        "Fantastic! The owls can now see clearly at night. Keep going!",
        "Amazing work! The foxes are sly again, thanks to you. The wizard is getting worried!",
        "You've reached the wizard's tower. One final challenge awaits to restore harmony!",
    ];

    if (level <= storySegments.length) {
        alert(storySegments[level - 1]);
    }
}

function checkAchievements() {
    if (correctAnswers === 1 && !achievements.includes('First Correct Answer')) {
        achievements.push('First Correct Answer');
        alert('Achievement Unlocked: First Correct Answer!');
        playSound(660, 'square', 0.4);
    }
    if (gemsCollected >= 10 && !achievements.includes('Gem Collector')) {
        achievements.push('Gem Collector');
        alert('Achievement Unlocked: Gem Collector!');
        playSound(660, 'square', 0.4);
    }
    if (level === maxLevel && !achievements.includes('Math Master')) {
        achievements.push('Math Master');
        alert('Achievement Unlocked: Math Master!');
        playSound(660, 'square', 0.4);
    }
}

function updateMapProgress() {
    const marker = document.getElementById('progress-marker');
    const positions = [
        { left: '10%', top: '80%' },
        { left: '30%', top: '60%' },
        { left: '50%', top: '40%' },
        { left: '70%', top: '20%' },
        { left: '90%', top: '10%' },
    ];
    const position = positions[level - 1];
    marker.style.left = position.left;
    marker.style.top = position.top;
}

function checkForMiniGame() {
    if (level === 3 && !miniGamePlayed) {
        miniGamePlayed = true;
        startMiniGame();
    }
}

function startMiniGame() {
    alert('Bonus Round! Solve as many problems as you can in 60 seconds!');
}

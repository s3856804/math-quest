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

// Sound elements
let correctSound = new Audio('sounds/correct.mp3');
let incorrectSound = new Audio('sounds/incorrect.mp3');

function goToCharacterSelection() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('character-screen').style.display = 'block';
}

function selectCharacter(selectedCharacter) {
    character = selectedCharacter;
    playerName = document.getElementById('player-name').value.trim() || 'Adventurer';

    // Get the selected color
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

    // Check if we need to generate new set of questions for next level
    if (currentQuestionIndex >= totalQuestions) {
        currentQuestionIndex = 0;
        levelUp();
    }

    // Generate new question
    const creatures = ['Rabbit', 'Owl', 'Fox', 'Squirrel', 'Deer'];
    const creature = creatures[Math.floor(Math.random() * creatures.length)];

    // Display creature (using CSS)
    const creatureElement = document.getElementById('creature');
    creatureElement.innerHTML = '';
    creatureElement.className = 'creature';
    creatureElement.classList.add(creature.toLowerCase());

    let operator = getOperator(level);
    let num1, num2;

    // Adjust number generation based on operator
    if (operator === '×') {
        // Limit multiplication to one-digit numbers (1-9)
        num1 = getRandomNumber(1, 9);
        num2 = getRandomNumber(1, 9);
    } else if (operator === '÷') {
        // For division, ensure divisor is one-digit and result is whole number
        num2 = getRandomNumber(1, 9);
        let temp = getRandomNumber(level);
        num1 = num2 * temp;
    } else {
        // For addition and subtraction, use numbers based on level
        num1 = getRandomNumber(level);
        num2 = getRandomNumber(level);
    }

    // Adjust numbers for subtraction to ensure non-negative results
    if (operator === '-') {
        if (num1 < num2) {
            [num1, num2] = [num2, num1]; // Swap numbers
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

    // Store the question in history
    questionHistory[currentQuestionIndex] = { ...currentQuestion };

    // Update progress info
    updateProgress();

    // Display the question
    document.getElementById('question').textContent = currentQuestion.question;
    document.getElementById('answer').value = currentQuestion.userAnswer || '';
    document.getElementById('feedback').textContent = '';

    // Focus on the answer input field
    const answerInput = document.getElementById('answer');
    answerInput.focus();

    // Add event listener for the Enter key
    answerInput.removeEventListener('keydown', handleKeyDown);
    answerInput.addEventListener('keydown', handleKeyDown);
}

// Function to handle keydown event
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        submitAnswer();
    }
}

function getRandomNumber(level, maxNumber = null) {
    if (maxNumber !== null) {
        // Generate number between 1 and maxNumber (inclusive)
        return Math.floor(Math.random() * maxNumber) + 1;
    } else {
        // Generate number based on level
        let max = level * 10;
        return Math.floor(Math.random() * max) + 1;
    }
}

function getOperator(level) {
    let operators = ['+', '-'];
    if (level >= 2) {
        operators.push('×'); // Introduce multiplication at level 2
    }
    if (level >= 3) {
        operators.push('÷'); // Introduce division at level 3
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

            // Collect gems
            gemsCollected++;
            document.getElementById('gems').textContent = gemsCollected;

            // Check achievements
            checkAchievements();

            // Check if it's time to level up
            if (gemsCollected % gemsPerLevel === 0) {
                levelUp();
            }
        }
        incorrectAttempts = 0;
        displayFeedback('Correct!', true);
        // Proceed to next question
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
        displayFeedback('Try again!', false);
        if (incorrectAttempts >= 3) {
            displayHint();
            incorrectAttempts = 0; // Reset attempts after providing hint
        }
    }

    // Update progress info
    updateProgress();
}

function displayFeedback(message, isCorrect) {
    const feedbackEl = document.getElementById('feedback');
    const randomMessage = isCorrect
        ? positiveFeedback[Math.floor(Math.random() * positiveFeedback.length)]
        : tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
    feedbackEl.textContent = randomMessage;
    feedbackEl.className = isCorrect ? 'green' : 'red';
    playSound(isCorrect);
    // Add animations
    const creatureElement = document.getElementById('creature');
    creatureElement.classList.remove('animate-correct', 'animate-incorrect');
    void creatureElement.offsetWidth; // Trigger reflow
    creatureElement.classList.add(isCorrect ? 'animate-correct' : 'animate-incorrect');
}

function playSound(isCorrect) {
    if (isCorrect) {
        correctSound.play();
    } else {
        incorrectSound.play();
    }
}

function displayHint() {
    alert('Hint: Remember to follow the order of operations (PEMDAS).');
}

function updateProgress() {
    // Update progress info
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('incorrect-answers').textContent = incorrectAnswers;
    document.getElementById('remaining-questions').textContent = totalQuestions - currentQuestionIndex - 1;

    // Update progress bar
    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progress').style.width = progressPercentage + '%';
}

function goBack() {
    if (currentQuestionIndex > 0) {
        // Adjust counts if necessary
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
    highScores = highScores.slice(0, 5); // Keep top 5
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
    // Reset game variables
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
    // Clear saved game
    localStorage.removeItem('savedGame');
    // Reset screens
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'block';
    document.body.style.background = getBackgroundForLevel(level);
}

function levelUp() {
    if (level < maxLevel) {
        level++;
        alert(`Congratulations, ${playerName}! You've reached Level ${level}!\n\n${generateFunFact()}`);
        document.body.style.background = getBackgroundForLevel(level);
        updateStatusBar();
        updateMapProgress();
        showStorySegment();
        checkForMiniGame();
    }
}

function getBackgroundForLevel(level) {
    switch (level) {
        case 1:
            return 'linear-gradient(to bottom, #a8e6cf, #dcedc1)'; // Original
        case 2:
            return 'linear-gradient(to bottom, #ffd54f, #ffb300)'; // Sunny meadow
        case 3:
            return 'linear-gradient(to bottom, #ce93d8, #ab47bc)'; // Magical twilight
        case 4:
            return 'linear-gradient(to bottom, #90caf9, #42a5f5)'; // Enchanted river
        case 5:
            return 'linear-gradient(to bottom, #bcaaa4, #8d6e63)'; // Mystical mountains
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
        // Add more fun facts...
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
    }
    if (gemsCollected >= 10 && !achievements.includes('Gem Collector')) {
        achievements.push('Gem Collector');
        alert('Achievement Unlocked: Gem Collector!');
    }
    if (level === maxLevel && !achievements.includes('Math Master')) {
        achievements.push('Math Master');
        alert('Achievement Unlocked: Math Master!');
    }
    // Add more achievements as desired
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
    // Implement mini-game logic here
}

// Slot Machine Game Logic

// Symbol definitions with weights
const BASE_SYMBOLS = {
    '🍒': { weight: 30, payout: 2 },
    '🍋': { weight: 25, payout: 3 },
    '🍊': { weight: 20, payout: 4 },
    '🍇': { weight: 15, payout: 5 },
    '💎': { weight: 8, payout: 10 },
    '⭐': { weight: 2, payout: 50 }
};

// Game state
let symbols = JSON.parse(JSON.stringify(BASE_SYMBOLS));
let oddsMultiplier = 1.0;
let guaranteedWin = false;
let isSpinning = false;
let soundEnabled = true;

// Audio context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Color mapping for win animations
const SYMBOL_COLORS = {
    '🍒': '#e74c3c',
    '🍋': '#f1c40f',
    '🍊': '#e67e22',
    '🍇': '#9b59b6',
    '💎': '#3498db',
    '⭐': '#f39c12'
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupEventListeners();
});

// Load configuration from localStorage
function loadConfig() {
    const config = JSON.parse(localStorage.getItem('slotMachineConfig') || '{}');
    oddsMultiplier = config.odds_multiplier || 1.0;
    guaranteedWin = config.guaranteed_win || false;
    soundEnabled = config.sound_enabled !== false;

    updateOdds(oddsMultiplier);
    updateGuaranteedWinUI();
    updateSoundButton();
}

// Save configuration to localStorage
function saveConfig() {
    const config = {
        odds_multiplier: oddsMultiplier,
        guaranteed_win: guaranteedWin,
        sound_enabled: soundEnabled
    };
    localStorage.setItem('slotMachineConfig', JSON.stringify(config));
}

// Setup event listeners
function setupEventListeners() {
    // Spin button
    document.getElementById('spin-button').addEventListener('click', spin);

    // Sound toggle
    document.getElementById('sound-button').addEventListener('click', toggleSound);

    // Symbols modal
    const modal = document.getElementById('symbols-modal');
    const symbolsBtn = document.getElementById('symbols-button');
    const closeBtn = document.querySelector('.close');

    symbolsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Hotkey for guaranteed win (Shift+R)
    document.addEventListener('keydown', (event) => {
        if (event.shiftKey && (event.key === 'R' || event.key === 'r')) {
            toggleGuaranteedWin();
        }
    });
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    saveConfig();
}

function updateSoundButton() {
    const btn = document.getElementById('sound-button');
    btn.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
}

// Toggle guaranteed win
function toggleGuaranteedWin() {
    guaranteedWin = !guaranteedWin;
    updateGuaranteedWinUI();
    saveConfig();
}

function updateGuaranteedWinUI() {
    const spinButton = document.getElementById('spin-button');
    if (guaranteedWin) {
        spinButton.classList.add('guaranteed-win');
    } else {
        spinButton.classList.remove('guaranteed-win');
    }
}

// Update odds multiplier
function updateOdds(newOdds) {
    oddsMultiplier = newOdds;
    symbols = {};

    for (const [symbol, data] of Object.entries(BASE_SYMBOLS)) {
        const baseWeight = data.weight;
        const payout = data.payout;
        let newWeight;

        if (oddsMultiplier > 1.0) {
            const weightAdjustment = (oddsMultiplier - 1.0) * (payout / 10);
            newWeight = baseWeight * (1.0 + weightAdjustment);
        } else if (oddsMultiplier < 1.0) {
            const weightAdjustment = (1.0 - oddsMultiplier) * (payout / 10);
            newWeight = baseWeight * (1.0 - weightAdjustment);
        } else {
            newWeight = baseWeight;
        }

        symbols[symbol] = {
            weight: Math.max(1, newWeight),
            payout: payout
        };
    }
}

// Get weighted random symbol
function getWeightedSymbol() {
    const symbolList = [];
    const weights = [];

    for (const [symbol, data] of Object.entries(symbols)) {
        symbolList.push(symbol);
        weights.push(data.weight);
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < symbolList.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return symbolList[i];
        }
    }

    return symbolList[0];
}

// Play spinning sound
function playSpinSound() {
    if (!soundEnabled) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
}

// Play reel stop sound
function playReelStopSound() {
    if (!soundEnabled) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
}

// Play sound for symbol
function playSymbolSound(symbol) {
    if (!soundEnabled) return;

    const now = audioContext.currentTime;

    // Symbol-specific melodies
    const melodies = {
        '🍒': [523, 587, 659],
        '🍋': [659, 784, 880],
        '🍊': [392, 494, 523, 659],
        '🍇': [659, 523, 784, 659, 880],
        '💎': [1047, 1319, 1568, 2093],
        '⭐': [523, 659, 784, 1047, 1319, 1568]
    };

    const frequencies = melodies[symbol] || [440];
    const noteDuration = symbol === '⭐' ? 0.18 : 0.15;

    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = now + (index * noteDuration);
        const endTime = startTime + noteDuration;

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
    });

    // Extra long note for star
    if (symbol === '⭐') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1047;
        oscillator.type = 'sine';

        const startTime = now + (frequencies.length * noteDuration);
        const endTime = startTime + 0.4;

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
}

// Animate reel spinning
function animateReel(reelElement, duration) {
    const symbols = Object.keys(BASE_SYMBOLS);
    const startTime = Date.now();

    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            reelElement.textContent = randomSymbol;
        } else {
            clearInterval(interval);
        }
    }, 100);

    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

// Main spin function
async function spin() {
    if (isSpinning) return;

    isSpinning = true;
    const spinButton = document.getElementById('spin-button');
    const status = document.getElementById('status');
    spinButton.disabled = true;

    status.textContent = 'Spinning...';
    status.style.color = 'white';

    // Play initial spin sound
    playSpinSound();

    // Get result
    let result;
    if (guaranteedWin) {
        const symbolKeys = Object.keys(symbols);
        const winSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
        result = [winSymbol, winSymbol, winSymbol];
        guaranteedWin = false;
        updateGuaranteedWinUI();
        saveConfig();
    } else {
        result = [
            getWeightedSymbol(),
            getWeightedSymbol(),
            getWeightedSymbol()
        ];
    }

    // Animate reels stopping progressively
    const reels = [
        document.getElementById('reel-0'),
        document.getElementById('reel-1'),
        document.getElementById('reel-2')
    ];

    reels.forEach(reel => reel.classList.add('spinning'));

    // Stop reels one by one
    await animateReel(reels[0], 800);
    reels[0].textContent = result[0];
    reels[0].classList.remove('spinning');
    playReelStopSound();

    await animateReel(reels[1], 800);
    reels[1].textContent = result[1];
    reels[1].classList.remove('spinning');
    playReelStopSound();

    await animateReel(reels[2], 800);
    reels[2].textContent = result[2];
    reels[2].classList.remove('spinning');
    playReelStopSound();

    // Check for win
    await new Promise(resolve => setTimeout(resolve, 300));

    if (result[0] === result[1] && result[1] === result[2]) {
        // Win!
        const symbol = result[0];
        const payout = symbols[symbol].payout;

        // Flash animation
        reels.forEach(reel => {
            reel.classList.add('win-flash');
            reel.style.borderColor = SYMBOL_COLORS[symbol];
        });

        // Play sound
        playSymbolSound(symbol);

        // Update status with color
        status.textContent = `🎉 YOU WIN! ${symbol} ${symbol} ${symbol} - ${payout}x! 🎉`;
        status.style.color = SYMBOL_COLORS[symbol];

        // Remove flash after animation
        setTimeout(() => {
            reels.forEach(reel => {
                reel.classList.remove('win-flash');
                reel.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            });
        }, 1000);

    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        // Two matching
        status.textContent = '😐 Two matching! Close!';
        status.style.color = 'yellow';
    } else {
        // No win
        status.textContent = '😢 No match. Try again!';
        status.style.color = 'white';
    }

    isSpinning = false;
    spinButton.disabled = false;
}

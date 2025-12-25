// Slot Machine Game Logic

// Symbol definitions with weights (Halloween themed!)
const BASE_SYMBOLS = {
    '🎃': { weight: 30, payout: 2 },
    '👻': { weight: 25, payout: 3 },
    '🦇': { weight: 20, payout: 4 },
    '💀': { weight: 15, payout: 5 },
    '🕷️': { weight: 8, payout: 10 },
    '🧙': { weight: 2, payout: 50 }
};

// Game state
let symbols = JSON.parse(JSON.stringify(BASE_SYMBOLS));
let isSpinning = false;

// ============================================
// SETTINGS - Configure these values here
// ============================================
let oddsMultiplier = 1.0;      // 1.0 = normal odds, >1.0 = better odds, <1.0 = worse odds
let guaranteedWin = false;      // Set to true to always win (for testing)
let soundEnabled = true;        // Set to true to enable sound effects
let musicEnabled = true;        // Set to true to enable background music
// ============================================

// Audio files (only for music and victory)
const AUDIO_FILES = {
    backgroundMusic: 'sounds/background-music.mp3',
    victory: 'sounds/victory.mp3'
};

// Background music and victory audio objects
let backgroundMusic = null;
let victoryAudio = null;
let musicStarted = false; // Track if music has been started by user interaction

// Audio context for simple synthesizer sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Color mapping for win animations (Halloween colors!)
const SYMBOL_COLORS = {
    '🎃': '#ff6b35',
    '👻': '#f0f0f0',
    '🦇': '#9b4dca',
    '💀': '#e0e0e0',
    '🕷️': '#8b0000',
    '🧙': '#ff8c00'
};

// Preload all audio files
function preloadAudio() {
    // Setup background music
    backgroundMusic = new Audio(AUDIO_FILES.backgroundMusic);
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.008; // Lower volume for background music
    backgroundMusic.preload = 'auto';

    // Setup victory sound
    victoryAudio = new Audio(AUDIO_FILES.victory);
    victoryAudio.volume = 0.01;
    victoryAudio.preload = 'auto';
}

// Simple synthesizer sound effects
function playBeep(frequency, duration, volume = 0.3) {
    if (!soundEnabled) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    preloadAudio();
    initializeSettings();
    setupEventListeners();
});

// Initialize settings (no localStorage needed)
function initializeSettings() {
    updateOdds(oddsMultiplier);
    updateGuaranteedWinUI();
    updateSoundButton();
    updateMusicButton();

    // Note: Don't try to autoplay here - browsers block it
    // Music will start on first user interaction via tryStartMusic()
}

// Setup event listeners
function setupEventListeners() {
    // Spin button
    document.getElementById('spin-button').addEventListener('click', () => {
        tryStartMusic();
        spin();
    });

    // Sound toggle
    document.getElementById('sound-button').addEventListener('click', () => {
        tryStartMusic();
        toggleSound();
    });

    // Music toggle
    document.getElementById('music-button').addEventListener('click', () => {
        tryStartMusic();
        toggleMusic();
    });

    // Symbols modal
    const modal = document.getElementById('symbols-modal');
    const symbolsBtn = document.getElementById('symbols-button');
    const closeBtn = document.querySelector('.close');

    symbolsBtn.addEventListener('click', () => {
        tryStartMusic();
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
}

function updateSoundButton() {
    const btn = document.getElementById('sound-button');
    btn.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
}

// Toggle music on/off
function toggleMusic() {
    musicEnabled = !musicEnabled;
    updateMusicButton();

    if (musicEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

function updateMusicButton() {
    const btn = document.getElementById('music-button');
    btn.textContent = musicEnabled ? '🎵 Music: ON' : '🎵 Music: OFF';
}

// Play background music
function playBackgroundMusic() {
    if (!backgroundMusic || !musicEnabled) return;

    backgroundMusic.play()
        .then(() => {
            musicStarted = true; // Only set flag if play succeeded
        })
        .catch(err => {
            // Browser blocked autoplay, will try again on user interaction
            console.warn('Background music blocked:', err);
        });
}

// Try to start music on first user interaction
function tryStartMusic() {
    if (!musicStarted && musicEnabled && backgroundMusic) {
        playBackgroundMusic();
    }
}

// Stop background music
function stopBackgroundMusic() {
    if (!backgroundMusic) return;

    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Toggle guaranteed win
function toggleGuaranteedWin() {
    guaranteedWin = !guaranteedWin;
    updateGuaranteedWinUI();
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
    playBeep(800, 0.1, 0.2);
}

// Play reel stop sound
function playReelStopSound() {
    playBeep(400, 0.05, 0.2);
}

// Play victory sound (from audio file)
function playVictorySound() {
    if (!soundEnabled || !victoryAudio) return;

    // Pause background music during victory sound
    const wasMusicPlaying = backgroundMusic && !backgroundMusic.paused;
    if (wasMusicPlaying) {
        backgroundMusic.pause();
    }

    victoryAudio.currentTime = 0;
    victoryAudio.play().catch(err => {
        console.warn('Could not play victory sound:', err);
    });

    // Resume background music after victory sound ends
    if (wasMusicPlaying) {
        victoryAudio.addEventListener('ended', () => {
            if (musicEnabled && backgroundMusic) {
                backgroundMusic.play().catch(err => {
                    console.warn('Could not resume background music:', err);
                });
            }
        }, { once: true }); // Use 'once' so listener is removed after first trigger
    }
}

// Play lose sound
function playLoseSound() {
    playBeep(200, 0.3, 0.15);
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

        // Play victory sound
        playVictorySound();

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
        playLoseSound();
    }

    isSpinning = false;
    spinButton.disabled = false;
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const CMajorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // Frequencies for C4 to B4
let activeNotes = 0;

function playFrequency(frequency) {
    const maxGain = 0.2; // Maximum gain allowed
    const totalNotes = 4; // Total number of notes in your application

    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Sine wave for smoother tone
    const gainNode = audioContext.createGain();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Adjusted ADSR parameters for smoother transitions
    const attackTime = 0.02; // Slightly longer attack to reduce clipping
    const decayTime = 0.2;
    const sustainLevel = 0.7;
    const releaseTime = 1.2; // Ensuring a smoother fade-out

    // Use exponential ramp for smoother gain changes
    const currentTime = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.001, currentTime); // Start from almost silence to reduce clicking
    gainNode.gain.exponentialRampToValueAtTime(1, currentTime + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime + decayTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + attackTime + decayTime + releaseTime);

    // Smooth fade-out to prevent clipping at the end
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + attackTime + decayTime + releaseTime);

    // Dynamic gain adjustment based on the number of active notes
    const gain = Math.min(maxGain / totalNotes, (maxGain - activeNotes * maxGain / totalNotes)); // Dynamic gain adjustment
    gainNode.gain.setValueAtTime(gain, currentTime);

    // Increment active notes count
    activeNotes++;
    oscillator.onended = () => {
        // Decrement active notes count when the oscillator ends
        activeNotes--;
    };
}

function playHarmoniousNote(noteidx) {
    // const noteIndex = Math.floor(Math.random() * CMajorScale.length);
    const harmoniousFrequency = CMajorScale[noteidx];
    playFrequency(harmoniousFrequency);
}
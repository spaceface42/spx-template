/**
 * Simple Background Audio Player
 * Lightweight class for background music/noise with on/off controls
 */
export class BackgroundAudio {
  #audio = null;
  #isPlaying = false;
  #onButton = null;
  #offButton = null;

  constructor(audioSrc, options = {}) {
    this.audioSrc = audioSrc;
    this.volume = options.volume ?? 0.3;
    this.loop = options.loop ?? true;

    this.#initializeAudio();
    this.#bindButtons();
  }

  #initializeAudio() {
    this.#audio = new Audio(this.audioSrc);
    this.#audio.loop = this.loop;
    this.#audio.volume = this.volume;
    this.#audio.preload = 'auto';
    
    this.#audio.addEventListener('play', () => {
      this.#isPlaying = true;
      this.#updateButtons();
    });
    
    this.#audio.addEventListener('pause', () => {
      this.#isPlaying = false;
      this.#updateButtons();
    });
  }

  #bindButtons() {
    this.#onButton = document.querySelector('#music-on');
    this.#offButton = document.querySelector('#music-off');
    
    if (this.#onButton) {
      this.#onButton.addEventListener('click', () => this.play());
    }
    
    if (this.#offButton) {
      this.#offButton.addEventListener('click', () => this.stop());
    }
    
    this.#updateButtons();
  }

  #updateButtons() {
    if (this.#onButton) {
      this.#onButton.disabled = this.#isPlaying;
    }
    if (this.#offButton) {
      this.#offButton.disabled = !this.#isPlaying;
    }
  }

  // Public API
  async play() {
    try {
      await this.#audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  stop() {
    this.#audio.pause();
    this.#audio.currentTime = 0;
  }

  setVolume(volume) {
    this.#audio.volume = Math.max(0, Math.min(1, volume));
  }

  isPlaying() {
    return this.#isPlaying;
  }
}

// Usage example:
/*
HTML:
<button id="music-on">Music On</button>
<button id="music-off">Music Off</button>

JavaScript:
const backgroundAudio = new BackgroundAudio('/audio/background.mp3', {
  volume: 0.3,
  loop: true
});
*/
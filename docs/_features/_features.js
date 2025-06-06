import { BackgroundAudioPlayer } from '/spaceface/system/features/AudioPlayer/BackgroundAudioPlayer.js';
import { FloatingImagesManager } from '/spaceface/system/features/FloatingImages/FloatingImagesManager.js';

const button = document.getElementById('bg-audio-toggle');

const player = new BackgroundAudioPlayer('/content/bbc_rain---rai_nhu0506113.mp3', button, {
  volume: 0.4,
  loop: true,
  playText: 'Start Music',
  pauseText: 'Stop Music'
});

// Optional: manually control or destroy it later
// player.stop();
// player.setVolume(0.2);
// player.destroy();

const container = document.getElementById('floating-images-container');
if (container) {
  // Optionally, you can pass options like { maxImages: 2 }
  const manager = new FloatingImagesManager(container);
  // Optionally, randomize positions on load:
  manager.resetAllImagePositions();
  // Expose for debugging
  window.FloatingImagesManager = manager;
}

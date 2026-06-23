// ============================================================
//  FIREWALL DEFENDER – wave.js
//  Nhiệm vụ: Quản lý cấu hình wave, spawn delay và pause giữa các wave
// ============================================================

const WAVE_CONFIG = [
  {
    wave: 1,
    enemies: ['malware', 'phishing', 'malware', 'phishing', 'malware'],
    spawnDelay: 1.4,
    pauseAfter: 3.0,
  },
  {
    wave: 2,
    enemies: ['malware', 'ddos', 'phishing', 'malware', 'phishing', 'malware'],
    spawnDelay: 1.2,
    pauseAfter: 3.5,
  },
  {
    wave: 3,
    enemies: ['ddos', 'ransomware', 'phishing', 'malware', 'apt', 'apt'],
    spawnDelay: 1.0,
    pauseAfter: 0,
  },
];

const TOTAL_WAVES = WAVE_CONFIG.length;
const WAVE_POPUP_WAVES = [2, 3];

function getWaveConfig(wave) {
  return WAVE_CONFIG[wave - 1] || WAVE_CONFIG[0];
}

function getWaveEnemyCount(wave) {
  return getWaveConfig(wave).enemies.length;
}

function getWaveEnemyType(wave, index) {
  const config = getWaveConfig(wave);
  return config.enemies[index % config.enemies.length];
}

function getWaveSpawnDelay(wave) {
  return getWaveConfig(wave).spawnDelay;
}

function getWavePauseDuration(wave) {
  const config = getWaveConfig(wave);
  return config.pauseAfter ?? 3.0;
}

function shouldShowWavePopup(wave) {
  return WAVE_POPUP_WAVES.includes(wave);
}

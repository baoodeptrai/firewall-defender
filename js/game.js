// ============================================================
//  FIREWALL DEFENDER – game.js
//  Nhiệm vụ hôm nay: Canvas + background map + game loop
// ============================================================


// -----------------------------------------------------------
// 1. LẤY CANVAS VÀ CONTEXT
//    ctx là "cây bút" — mọi thứ muốn vẽ đều gọi qua ctx
// -----------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const W = canvas.width;   // 900
const H = canvas.height;  // 500


// -----------------------------------------------------------
// 2. BẢNG MÀU — chỉ chỉnh ở đây, cả game đổi theo
// -----------------------------------------------------------
const COLORS = {
  BG_DEEP:    '#0A1628',   // nền canvas
  BG_PANEL:   '#0D2137',   // panel HUD phía trên
  BG_HOVER:   '#162845',   // đường đi của quái
  GRID:       '#0D2137',   // lưới nền
  ROAD:       '#0D2137',   // đường quái chạy
  ROAD_LINE:  '#1A3A5C',   // nét đứt giữa đường
  SLOT_EMPTY: '#1A3A5C',   // ô slot chưa đặt tower
  SLOT_BORDER:'#0099CC',   // viền slot
  CYAN:       '#00D4FF',   // màu accent chính
  CYAN_DARK:  '#0099CC',   // viền thường
  SERVER:     '#00FF88',   // màu server
  GOLD:       '#FFD700',   // tiền vàng
  TEXT:       '#A8C8E8',   // text chính
  TEXT_MUTED: '#4A6080',   // text phụ
  HP_HIGH:    '#00FF88',   // HP xanh lá
  HP_MID:     '#FFD700',   // HP vàng
  HP_LOW:     '#FF2D55',   // HP đỏ
};


// -----------------------------------------------------------
// 3. CẤU HÌNH MAP
//    Đường đi của quái: một dải ngang nằm giữa màn hình
//    4 slot tower đặt cố định phía trên đường
// -----------------------------------------------------------
const MAP = {
  // Đường quái chạy
  roadY:  H / 2 - 20,   // tọa độ Y bắt đầu đường
  roadH:  40,            // chiều cao đường

  // 4 vị trí đặt tower (tính theo tọa độ X tâm của slot)
  slots: [
    { x: 180 },
    { x: 340 },
    { x: 520 },
    { x: 680 },
  ],

  slotW: 52,   // chiều rộng ô slot
  slotH: 52,   // chiều cao ô slot
};


// -----------------------------------------------------------
// 4. TRẠNG THÁI GAME (sẽ mở rộng dần ở các ngày sau)
// -----------------------------------------------------------
const game = {
  gold:       150,    // tiền ban đầu
  serverHP:   100,    // máu server
  serverMaxHP:100,
  wave:       1,      // wave hiện tại
  totalWaves: 10,
};
// -----------------------------------------------------------
// DANH SÁCH TOWER CÓ THỂ MUA
// -----------------------------------------------------------
const TOWERS = [
  {
    id:      'firewall',
    name:    'FIREWALL',
    price:   100,
    color:   '#00D4FF',
    counter: 'DDoS',
    targetType: 'ddos',
    desc:    'Chặn DDoS hiệu quả',
  },
  {
    id:      'antivirus',
    name:    'ANTIVIRUS',
    price:   150,
    color:   '#00FF88',
    counter: 'Malware',
    targetType: 'malware',
    desc:    'Diệt Malware hiệu quả',
  },
  {
    id:      'awareness',
    name:    'AWARENESS',
    price:   120,
    color:   '#FFD700',
    counter: 'Phishing',
    targetType: 'phishing',
    desc:    'Chặn Phishing hiệu quả',
  },
];

// Trạng thái từng slot — null = chưa đặt tower
const slotState = [null, null, null, null];
// -----------------------------------------------------------
// 4b. DANH SÁCH QUÁI, ĐẠN, TOWER VÀ BIẾN SPAWN
// -----------------------------------------------------------
let enemies = [];            // danh sách quái hiện tại
let projectiles = [];        // danh sách đạn phát ra
let towers = [];             // danh sách towers
let goldPopups = [];         // hiệu ứng +gold
let spawnTimer = 0;          // bộ đếm thời gian spawn
const SPAWN_INTERVAL = 1.5;  // cứ 1.5 giây spawn 1 quái
const PROJECTILE_SPEED = 300; // px/giây
const TOWER_DAMAGE = 20;      // damage mỗi phát bắn
const TOWER_FIRE_RATE = 0.8;  // giây giữa các phát bắn
const GOLD_POPUP_DURATION = 0.9; // giây
const GOLD_POPUP_RISE = 24;      // pixel di chuyển lên trên


// Slot nào đang được chọn (hiện menu mua) — -1 = không có
let selectedSlot = -1;
// -----------------------------------------------------------
// 5. CÁC HÀM VẼ
// -----------------------------------------------------------

// 5a. Vẽ lưới nền — tạo cảm giác terminal/cybersecurity
function drawGrid() {
  ctx.strokeStyle = COLORS.GRID;
  ctx.lineWidth   = 1;

  // đường dọc mỗi 45px
  for (let x = 0; x < W; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // đường ngang mỗi 45px
  for (let y = 0; y < H; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}


// 5b. Vẽ đường quái chạy (dải ngang giữa màn hình)
function drawRoad() {
  const { roadY, roadH } = MAP;

  // nền đường
  ctx.fillStyle = COLORS.ROAD;
  ctx.fillRect(0, roadY, W, roadH);

  // nét đứt giữa đường (như vạch kẻ đường)
  ctx.strokeStyle = COLORS.ROAD_LINE;
  ctx.lineWidth   = 1;
  ctx.setLineDash([14, 10]);   // 14px nét, 10px khoảng trắng
  ctx.beginPath();
  ctx.moveTo(0,   roadY + roadH / 2);
  ctx.lineTo(W,   roadY + roadH / 2);
  ctx.stroke();
  ctx.setLineDash([]);          // tắt nét đứt cho các hình tiếp theo

  // nhãn "INTERNET" bên trái
  ctx.fillStyle  = COLORS.TEXT_MUTED;
  ctx.font       = "10px 'Courier New'";
  ctx.textAlign  = 'left';
  ctx.fillText('[ INTERNET ]', 8, roadY + roadH / 2 + 4);

  // nhãn "SERVER" bên phải (vẽ bằng hàm drawServer bên dưới)
}


// 5c. Vẽ biểu tượng SERVER ở đầu bên phải đường
function drawServer() {
  const { roadY, roadH } = MAP;
  const sw = 54, sh = 60;
  const sx  = W - sw - 8;
  const sy  = roadY + roadH / 2 - sh / 2;

  // hộp server
  ctx.fillStyle   = '#0D2137';
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeStyle = COLORS.SERVER;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(sx, sy, sw, sh);

  // chữ SERVER
  ctx.fillStyle  = COLORS.SERVER;
  ctx.font       = "bold 9px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText('SERVER', sx + sw / 2, sy + 14);

  // icon ổ cứng đơn giản (3 dải ngang)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? COLORS.CYAN : COLORS.TEXT_MUTED;
    ctx.fillRect(sx + 8, sy + 20 + i * 10, sw - 16, 6);
  }
}


// 5d. Vẽ 4 slot đặt tower phía trên đường
function drawSlots() {
  const { roadY, slotW, slotH, slots } = MAP;

  slots.forEach((slot, index) => {
    const sx = slot.x - slotW / 2;
    const sy = roadY - slotH - 10;
    const tower = slotState[index];   // tower đã đặt (hoặc null)
    const isSelected = selectedSlot === index;

    // nền slot — sáng hơn nếu đang được chọn
    ctx.fillStyle = isSelected ? '#1E4A6E' : COLORS.SLOT_EMPTY;
    ctx.fillRect(sx, sy, slotW, slotH);

    // viền — cyan sáng nếu chọn, nét đứt nếu trống
    ctx.strokeStyle = isSelected ? COLORS.CYAN : COLORS.SLOT_BORDER;
    ctx.lineWidth   = isSelected ? 2 : 1;
    if (!tower) ctx.setLineDash([5, 4]);
    ctx.strokeRect(sx, sy, slotW, slotH);
    ctx.setLineDash([]);

    if (tower) {
      // --- Slot đã có tower ---
      // hình tròn màu tower
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(slot.x, sy + slotH / 2, 16, 0, Math.PI * 2);
      ctx.fill();

      // chữ viết tắt (F / A / W)
      ctx.fillStyle = '#0A1628';
      ctx.font      = "bold 14px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillText(tower.name[0], slot.x, sy + slotH / 2 + 5);

      // tên tower phía dưới slot
      ctx.fillStyle = tower.color;
      ctx.font      = "9px 'Courier New'";
      ctx.fillText(tower.name, slot.x, roadY - 2);

    } else {
      // --- Slot trống ---
      ctx.fillStyle = isSelected ? COLORS.CYAN : COLORS.TEXT_MUTED;
      ctx.font      = "20px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillText('+', slot.x, sy + slotH / 2 + 7);

      ctx.fillStyle = COLORS.TEXT_MUTED;
      ctx.font      = "9px 'Courier New'";
      ctx.fillText(`SLOT ${index + 1}`, slot.x, roadY - 2);
    }
  });

  // Vẽ menu mua tower nếu có slot đang được chọn
  if (selectedSlot !== -1 && !slotState[selectedSlot]) {
    drawBuyMenu(selectedSlot);
  }
}

// -----------------------------------------------------------
// VẼ MENU MUA TOWER (hiện phía dưới slot được click)
// -----------------------------------------------------------
function drawBuyMenu(slotIndex) {
  const slot  = MAP.slots[slotIndex];
  const menuW = 160;
  const menuH = TOWERS.length * 52 + 12;
  const mx    = Math.min(slot.x - menuW / 2, W - menuW - 8);  // không tràn ra phải
  const my    = MAP.roadY + MAP.roadH + 12;

  // nền menu
  ctx.fillStyle   = '#0D2137';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = COLORS.CYAN;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(mx, my, menuW, menuH);

  // tiêu đề menu
  ctx.fillStyle  = COLORS.CYAN;
  ctx.font       = "bold 10px 'Courier New'";
  ctx.textAlign  = 'left';
  ctx.fillText('[ CHỌN TOWER ]', mx + 10, my + 14);

  TOWERS.forEach((tower, i) => {
    const ty          = my + 20 + i * 52;
    const canAfford   = game.gold >= tower.price;
    // nền từng dòng tower
    ctx.fillStyle = canAfford ? '#162845' : '#0A1628';
    ctx.fillRect(mx + 6, ty, menuW - 12, 44);

    // chấm màu tower
    ctx.fillStyle = canAfford ? tower.color : '#4A6080';
    ctx.beginPath();
    ctx.arc(mx + 20, ty + 14, 8, 0, Math.PI * 2);
    ctx.fill();

    // tên tower
    ctx.fillStyle  = canAfford ? '#FFFFFF' : '#4A6080';
    ctx.font       = "bold 11px 'Courier New'";
    ctx.textAlign  = 'left';
    ctx.fillText(tower.name, mx + 34, ty + 13);

    // mô tả ngắn
    ctx.fillStyle = canAfford ? COLORS.TEXT_MUTED : '#2A4060';
    ctx.font      = "9px 'Courier New'";
    ctx.fillText(tower.desc, mx + 34, ty + 26);

    // giá
    ctx.fillStyle = canAfford ? COLORS.GOLD : '#4A6080';
    ctx.font      = "bold 10px 'Courier New'";
    ctx.fillText(`${tower.price}G`, mx + 34, ty + 38);

    // nhãn "KHÔNG ĐỦ TIỀN"
    if (!canAfford) {
      ctx.fillStyle = '#FF2D55';
      ctx.font      = "9px 'Courier New'";
      ctx.textAlign = 'right';
      ctx.fillText('Không đủ tiền', mx + menuW - 10, ty + 38);
    }
  });
}


// -----------------------------------------------------------
// XỬ LÝ CLICK CHUỘT
// -----------------------------------------------------------
canvas.addEventListener('click', function(e) {
  // Tính tọa độ click so với canvas (không phải trang web)
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;   // ← thêm dòng này
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top)  * scaleY;  // ← đổi scaleX → scaleY

  const { roadY, slotW, slotH, slots } = MAP;

  // --- Kiểm tra click vào slot ---
  let clickedSlot = -1;
  slots.forEach((slot, index) => {
    const sx = slot.x - slotW / 2;
    const sy = roadY - slotH - 10;
    if (mouseX >= sx && mouseX <= sx + slotW &&
        mouseY >= sy && mouseY <= sy + slotH) {
      clickedSlot = index;
    }
  });

  if (clickedSlot !== -1) {
    if (slotState[clickedSlot]) {
      // Slot đã có tower → click lại để bỏ chọn
      selectedSlot = selectedSlot === clickedSlot ? -1 : clickedSlot;
    } else {
      // Slot trống → mở/đóng menu mua
      selectedSlot = selectedSlot === clickedSlot ? -1 : clickedSlot;
    }
    return;
  }

  // --- Kiểm tra click vào menu mua tower ---
  if (selectedSlot !== -1 && !slotState[selectedSlot]) {
    const slot  = MAP.slots[selectedSlot];
    const menuW = 160;
    const menuH = TOWERS.length * 52 + 12;
    const mx    = Math.min(slot.x - menuW / 2, W - menuW - 8);
    const my    = MAP.roadY + MAP.roadH + 12;

    TOWERS.forEach((tower, i) => {
      const ty = my + 20 + i * 52;
      if (mouseX >= mx + 6  && mouseX <= mx + menuW - 6 &&
          mouseY >= ty       && mouseY <= ty + 44) {
        buyTower(selectedSlot, tower);
      }
    });
    return;
  }

  // Click vào vùng trống → đóng menu
  selectedSlot = -1;
});


// -----------------------------------------------------------
// MUA TOWER
// -----------------------------------------------------------
function buyTower(slotIndex, towerConfig) {
  if (game.gold < towerConfig.price) return;

  game.gold -= towerConfig.price;
  slotState[slotIndex] = towerConfig;  // để drawSlots() vẽ đúng

  // Tạo Tower object cho logic bắn đạn của B
  const slot = MAP.slots[slotIndex];
  const towerObj = new Tower(slot.x, MAP.roadY - 20,towerConfig.targetType);
  towerObj.isActive = true;
  towers[slotIndex] = towerObj;        // lưu đúng vị trí slot

  selectedSlot = -1;
}


// 5e. Vẽ HUD phía trên (thanh thông tin: gold, wave, HP server)
function drawHUD() {
  // nền HUD
  ctx.fillStyle = COLORS.BG_PANEL;
  ctx.fillRect(0, 0, W, 36);

  // đường kẻ dưới HUD
  ctx.strokeStyle = '#162845';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(W, 36);
  ctx.stroke();

  // --- Gold ---
  ctx.save();
  ctx.shadowColor = COLORS.GOLD;
  ctx.shadowBlur = 8;
  ctx.fillStyle  = COLORS.GOLD;
  ctx.font       = "bold 16px 'Courier New'";
  ctx.textAlign  = 'left';
  ctx.fillText(`GOLD: ${game.gold}`, 14, 23);
  ctx.restore();

  // --- Wave counter ---
  ctx.fillStyle  = COLORS.CYAN;
  ctx.textAlign  = 'center';
  ctx.fillText(`WAVE  ${game.wave} / ${game.totalWaves}`, W / 2, 23);

  // --- HP Bar ---
  drawHPBar(W - 230, 9, 170, 18, game.serverHP, game.serverMaxHP);
}


// 5f. Hàm vẽ thanh HP — dùng lại được ở nhiều chỗ
function drawHPBar(x, y, w, h, current, max) {
  const pct   = current / max;
  const color = pct > 0.6 ? COLORS.HP_HIGH
              : pct > 0.3 ? COLORS.HP_MID
              :              COLORS.HP_LOW;

  // nền bar
  ctx.fillStyle = '#162845';
  ctx.fillRect(x, y, w, h);

  // phần HP còn lại
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * pct, h);

  // viền
  ctx.strokeStyle = COLORS.CYAN_DARK;
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);

  // text "SERVER HP 100/100" căn giữa bar
  ctx.fillStyle  = '#FFFFFF';
  ctx.font       = "bold 11px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText(`SERVER HP  ${current}/${max}`, x + w / 2, y + h - 3);
}


// -----------------------------------------------------------
// 5.5 CLASS PROJECTILE — đạn bắn từ tower
//  Simple: di chuyển về phía phải, vẽ dưới dạng hình vuông nhỏ
// -----------------------------------------------------------
class Projectile {
  constructor(x, y, targetX, targetY, speed = PROJECTILE_SPEED) {
    this.x      = x;
    this.y      = y;
    this.speed  = speed;
    this.radius = 5;    // bán kính hình tròn đạn
    this.damage = TOWER_DAMAGE;
    this.alive  = true;

    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    this.vx = (dx / distance) * speed;
    this.vy = (dy / distance) * speed;
  }

  move(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  draw(ctx) {
    if (!this.alive) return;

    // Vẽ đạn dưới dạng hình tròn xanh nhỏ với glow
    ctx.save();
    ctx.shadowColor = COLORS.CYAN;
    ctx.shadowBlur  = 8;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fill();

    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.restore();
  }
}

// -----------------------------------------------------------
// 5.6 HÀM SPAWN ĐẠN
//  Tower tại vị trí slot bắn về phía quái
// -----------------------------------------------------------
function spawnProjectile(towerX, towerY, targetEnemy) {
  const projectile = new Projectile(towerX, towerY, targetEnemy.x, targetEnemy.y);
  projectiles.push(projectile);
}


// -----------------------------------------------------------
// 5.7 COLLISION DETECTION — Đạn trúng Enemy
//  Khoảng cách giữa đạn và enemy < (radius đạn + radius enemy)
// -----------------------------------------------------------
function checkCollisions() {
  // Lặp qua từng đạn
  for (let p = projectiles.length - 1; p >= 0; p--) {
    const projectile = projectiles[p];

    // Lặp qua từng enemy
    for (let e = enemies.length - 1; e >= 0; e--) {
      const enemy = enemies[e];

      if (!enemy.alive) continue;

      // Tính khoảng cách
      const dx = projectile.x - enemy.x;
      const dy = projectile.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Nếu trúng
      if (dist < projectile.radius + enemy.radius) {
        projectile.alive = false;

        // Enemy nhận damage
        const isDead = enemy.takeDamage(projectile.damage);

        if (isDead) {
          // Enemy chết → cộng gold
          game.gold += 50;
          createGoldPopup(50, enemy.x, enemy.y - enemy.radius - 10);
          console.log(`✓ Enemy ${enemy.type} defeated! +50 gold (total: ${game.gold})`);
        } else {
          console.log(`✓ Hit ${enemy.type}! HP: ${enemy.hp}/${enemy.maxHp}`);
        }

        break;  // một đạn chỉ trúng 1 enemy
      }
    }
  }

  // Xóa đạn chết khỏi array
  projectiles = projectiles.filter(p => p.alive && p.x < W && p.y >= 0 && p.y <= H);
  
  // Xóa enemy chết khỏi array
  enemies = enemies.filter(e => e.alive);
}


// -----------------------------------------------------------
// 6. HÀM VẼ TOÀN BỘ MỘT FRAME
//    Gọi theo thứ tự: nền → lưới → đường → slot → tower → server → projectiles → enemies → HUD
// -----------------------------------------------------------
function draw() {
  // Xóa màn hình (vẽ lại nền mỗi frame)
  ctx.fillStyle = COLORS.BG_DEEP;
  ctx.fillRect(0, 0, W, H);

  drawGrid();    // lưới nền
  drawRoad();    // đường quái chạy
  drawSlots();   // 4 ô đặt tower
  drawServer();  // biểu tượng server
  
  // Vẽ tất cả projectiles
  projectiles.forEach(projectile => {
    projectile.draw(ctx);
  });
  
  // Vẽ tất cả enemies
  enemies.forEach(enemy => {
    enemy.draw(ctx);
  });
  
  drawHUD();     // thanh thông tin phía trên
  drawGoldPopups(ctx); // hiệu ứng +gold
}


// -----------------------------------------------------------
// 5.8 EFFECTS: GOLD POPUP
// -----------------------------------------------------------
function createGoldPopup(amount, x, y) {
  goldPopups.push({
    amount,
    x,
    y,
    alpha: 1,
    age: 0,
  });
}

function updateGoldPopups(deltaTime) {
  goldPopups.forEach(popup => {
    popup.age += deltaTime;
    popup.y -= (GOLD_POPUP_RISE / GOLD_POPUP_DURATION) * deltaTime;
    popup.alpha = 1 - popup.age / GOLD_POPUP_DURATION;
  });

  goldPopups = goldPopups.filter(popup => popup.age < GOLD_POPUP_DURATION);
}

function drawGoldPopups(ctx) {
  goldPopups.forEach(popup => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, popup.alpha);
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 18px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${popup.amount}`, popup.x, popup.y);
    ctx.restore();
  });
}


// -----------------------------------------------------------
// 8. HÀM UPDATE — cập nhật logic game
//    - Spawn enemies
//    - Update towers
//    - Di chuyển enemies
//    - Di chuyển projectiles
//    - Kiểm tra collisions
//    - Cập nhật flash effect
// -----------------------------------------------------------
let lastTime = Date.now();

function update() {
  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000;  // chuyển ms thành giây
  lastTime = now;

  // --- Spawn enemies ---
  spawnTimer += deltaTime;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnEnemy();
    spawnTimer = 0;
  }

  // --- Update towers (shooting logic) ---
  updateTowers(deltaTime);

  // --- Update enemies (di chuyển, flash effect) ---
  enemies.forEach(enemy => {
    enemy.move(deltaTime);
    enemy.updateFlash(deltaTime);
  });

  // --- Update projectiles (di chuyển) ---
  projectiles.forEach(projectile => {
    projectile.move(deltaTime);
  });

  // --- Kiểm tra collisions ---
  checkCollisions();

  // --- Update gold popup hiệu ứng ---
  updateGoldPopups(deltaTime);
}

// -----------------------------------------------------------
// 7b. HÀM SPAWN QUÁI
//     Random loại quái: malware | phishing | ddos
// -----------------------------------------------------------
function spawnEnemy() {
  const types = ['malware', 'phishing', 'ddos'];
  const typeConfigs = {
    malware:  { hp: 80,  speed: 60,  damage: 15 },
    phishing: { hp: 40,  speed: 120,  damage: 10 },
    ddos:     { hp: 200, speed: 30,  damage: 35 },
  };

  const type = types[Math.floor(Math.random() * types.length)];
  const config = typeConfigs[type];

  const enemy = new Enemy(type, config.hp, config.speed, config.damage);
  enemies.push(enemy);

  console.log(`✓ Spawned ${type} enemy at x=${enemy.x}`);
}

// -----------------------------------------------------------
// 7c. HÀM UPDATE TOWERS
//     Cập nhật fire rate và shooting logic
// -----------------------------------------------------------
function updateTowers(deltaTime) {
  towers.forEach(tower => {
    tower.update(deltaTime, enemies);
  });
}


// -----------------------------------------------------------
// 9. GAME LOOP — trái tim của game
//    requestAnimationFrame gọi hàm gameLoop ~60 lần/giây
//    Thứ tự: update logic → draw frame → lên lịch frame tiếp theo
// -----------------------------------------------------------
function gameLoop() {
  update();                        // cập nhật logic game
  draw();                          // vẽ frame hiện tại
  requestAnimationFrame(gameLoop); // lên lịch vẽ frame tiếp theo
}

// Khởi động game
gameLoop();

// ============================================================
//  GAME STATES — quản lý trạng thái toàn cục
//  MENU → PLAYING → WAVE_CLEAR → POPUP → GAME_OVER
// ============================================================

// -----------------------------------------------------------
// STATE CONSTANTS
// -----------------------------------------------------------
const STATE = {
  MENU:       'MENU',
  PLAYING:    'PLAYING',
  WAVE_CLEAR: 'WAVE_CLEAR',
  POPUP:      'POPUP',
  GAME_OVER:  'GAME_OVER',
};

let currentState = STATE.MENU;

// Dữ liệu riêng cho từng state
const stateData = {
  // MENU
  menuAnimTick: 0,

  // WAVE_CLEAR — delay trước khi chuyển wave tiếp
  waveClearTimer:    0,
  waveClearDuration: 3.0,   // hiển thị 3 giây rồi tự chuyển

  // POPUP — thông báo mini (mua tower xong, thiếu tiền…)
  popupMessage:  '',
  popupColor:    '#00D4FF',
  popupTimer:    0,
  popupDuration: 1.8,
  popupPrevState: STATE.PLAYING,   // state nào sẽ quay lại sau popup

  // GAME_OVER
  gameOverWon: false,   // true = thắng, false = thua
};


// -----------------------------------------------------------
// CHUYỂN STATE — dùng hàm này thay vì gán trực tiếp
// -----------------------------------------------------------
function setState(newState, options = {}) {
  currentState = newState;

  if (newState === STATE.PLAYING) {
    // Mỗi khi bắt đầu / tiếp tục playing, reset spawn timer
    spawnTimer = 0;
  }

  if (newState === STATE.WAVE_CLEAR) {
    stateData.waveClearTimer = 0;
    enemies = [];
    projectiles = [];
  }

  if (newState === STATE.POPUP) {
    stateData.popupMessage  = options.message  ?? 'THÔNG BÁO';
    stateData.popupColor    = options.color     ?? '#00D4FF';
    stateData.popupTimer    = 0;
    stateData.popupDuration = options.duration  ?? 1.8;
    stateData.popupPrevState = options.returnTo ?? STATE.PLAYING;
  }

  if (newState === STATE.GAME_OVER) {
    stateData.gameOverWon = options.won ?? false;
    enemies = [];
    projectiles = [];
  }
}


// -----------------------------------------------------------
// VẼ MÀN HÌNH MENU
// -----------------------------------------------------------
function drawMenu() {
  // Nền tối
  ctx.fillStyle = COLORS.BG_DEEP;
  ctx.fillRect(0, 0, W, H);

  // Lưới nền mờ
  drawGrid();

  stateData.menuAnimTick += 0.02;
  const pulse = 0.7 + 0.3 * Math.sin(stateData.menuAnimTick);

  // --- Logo / Tiêu đề ---
  ctx.save();
  ctx.shadowColor = COLORS.CYAN;
  ctx.shadowBlur  = 30 * pulse;
  ctx.fillStyle   = COLORS.CYAN;
  ctx.font        = "bold 48px 'Courier New'";
  ctx.textAlign   = 'center';
  ctx.fillText('FIREWALL', W / 2, H / 2 - 80);

  ctx.fillStyle = '#00FF88';
  ctx.shadowColor = '#00FF88';
  ctx.font = "bold 28px 'Courier New'";
  ctx.fillText('DEFENDER', W / 2, H / 2 - 38);
  ctx.restore();

  // Gạch ngang trang trí
  ctx.strokeStyle = COLORS.CYAN_DARK;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, H / 2 - 16);
  ctx.lineTo(W / 2 + 180, H / 2 - 16);
  ctx.stroke();

  // Mô tả
  ctx.fillStyle  = COLORS.TEXT;
  ctx.font       = "14px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText('Bảo vệ server khỏi các cuộc tấn công mạng', W / 2, H / 2 + 12);

  // Nút PLAY (nhấp nháy)
  const btnW = 220, btnH = 46;
  const btnX = W / 2 - btnW / 2;
  const btnY = H / 2 + 44;

  ctx.fillStyle   = `rgba(0, 212, 255, ${0.12 + 0.08 * pulse})`;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = `rgba(0, 212, 255, ${pulse})`;
  ctx.lineWidth   = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle  = COLORS.CYAN;
  ctx.font       = "bold 18px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText('[ BẮT ĐẦU CHƠI ]', W / 2, btnY + 30);

  // Hướng dẫn nhỏ
  ctx.fillStyle = COLORS.TEXT_MUTED;
  ctx.font      = "11px 'Courier New'";
  ctx.fillText('Click slot để đặt tower · Bảo vệ SERVER', W / 2, H / 2 + 118);

  // Lưu vùng nút để check click
  drawMenu._btnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
}


// -----------------------------------------------------------
// VẼ MÀN HÌNH WAVE CLEAR
// -----------------------------------------------------------
function drawWaveClear() {
  // Vẽ game bên dưới (mờ đi)
  draw();

  // Overlay mờ
  ctx.fillStyle = 'rgba(10, 22, 40, 0.72)';
  ctx.fillRect(0, 0, W, H);

  const pct = stateData.waveClearTimer / stateData.waveClearDuration;
  const isLastWave = game.wave > game.totalWaves;

  // Box giữa màn
  const bw = 360, bh = 160;
  const bx = W / 2 - bw / 2;
  const by = H / 2 - bh / 2;

  ctx.fillStyle   = '#0D2137';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth   = 2;
  ctx.strokeRect(bx, by, bw, bh);

  // Tiêu đề
  ctx.save();
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur  = 20;
  ctx.fillStyle   = '#00FF88';
  ctx.font        = "bold 26px 'Courier New'";
  ctx.textAlign   = 'center';
  ctx.fillText(isLastWave ? '✓ ALL WAVES CLEAR!' : `✓ WAVE ${game.wave - 1} CLEAR!`, W / 2, by + 52);
  ctx.restore();

  ctx.fillStyle  = COLORS.TEXT;
  ctx.font       = "14px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText(
    isLastWave
      ? 'Bạn đã bảo vệ server thành công!'
      : `Wave ${game.wave} / ${game.totalWaves} sắp bắt đầu…`,
    W / 2, by + 84
  );

  // Thanh đếm ngược
  const barW = bw - 60;
  ctx.fillStyle = '#162845';
  ctx.fillRect(bx + 30, by + 106, barW, 12);
  ctx.fillStyle = '#00FF88';
  ctx.fillRect(bx + 30, by + 106, barW * pct, 12);
  ctx.strokeStyle = COLORS.CYAN_DARK;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 30, by + 106, barW, 12);

  ctx.fillStyle  = COLORS.TEXT_MUTED;
  ctx.font       = "10px 'Courier New'";
  ctx.fillText(
    isLastWave ? 'Màn hình kết thúc…' : 'Wave tiếp theo…',
    W / 2, by + 134
  );
}


// -----------------------------------------------------------
// VẼ POPUP THÔNG BÁO (đè lên game)
// -----------------------------------------------------------
function drawPopup() {
  // Vẽ game bên dưới (game vẫn chạy nhưng tạm dừng)
  draw();

  const pct     = stateData.popupTimer / stateData.popupDuration;
  const alpha   = pct < 0.15 ? pct / 0.15
                : pct > 0.75 ? 1 - (pct - 0.75) / 0.25
                : 1;

  const slideY  = H / 2 - 30 - (1 - alpha) * 20;

  ctx.save();
  ctx.globalAlpha = alpha;

  const bw = 300, bh = 60;
  const bx = W / 2 - bw / 2;

  ctx.fillStyle   = '#0D2137';
  ctx.fillRect(bx, slideY, bw, bh);

  ctx.strokeStyle = stateData.popupColor;
  ctx.lineWidth   = 2;
  ctx.strokeRect(bx, slideY, bw, bh);

  ctx.shadowColor = stateData.popupColor;
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = stateData.popupColor;
  ctx.font        = "bold 15px 'Courier New'";
  ctx.textAlign   = 'center';
  ctx.fillText(stateData.popupMessage, W / 2, slideY + 37);

  ctx.restore();
}


// -----------------------------------------------------------
// VẼ MÀN HÌNH GAME OVER
// -----------------------------------------------------------
function drawGameOver() {
  ctx.fillStyle = COLORS.BG_DEEP;
  ctx.fillRect(0, 0, W, H);
  drawGrid();

  const won = stateData.gameOverWon;

  // Màu sắc & text theo kết quả
  const accentColor = won ? '#00FF88' : '#FF2D55';
  const title       = won ? '[ MISSION COMPLETE ]' : '[ SYSTEM BREACHED ]';
  const subtitle    = won ? 'Server đã được bảo vệ thành công!' : 'Server đã bị xâm nhập. Hệ thống sụp đổ!';

  ctx.save();
  ctx.shadowColor = accentColor;
  ctx.shadowBlur  = 40;
  ctx.fillStyle   = accentColor;
  ctx.font        = "bold 36px 'Courier New'";
  ctx.textAlign   = 'center';
  ctx.fillText(title, W / 2, H / 2 - 80);
  ctx.restore();

  ctx.fillStyle  = COLORS.TEXT;
  ctx.font       = "16px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText(subtitle, W / 2, H / 2 - 36);

  // Stats
  ctx.fillStyle = COLORS.TEXT_MUTED;
  ctx.font      = "13px 'Courier New'";
  ctx.fillText(`Server HP còn lại: ${game.serverHP} / ${game.serverMaxHP}`, W / 2, H / 2 + 2);
  ctx.fillText(`Gold: ${game.gold}  |  Wave đã qua: ${Math.min(game.wave - 1, game.totalWaves)} / ${game.totalWaves}`, W / 2, H / 2 + 24);

  // Nút CHƠI LẠI
  const btnW = 220, btnH = 46;
  const btnX = W / 2 - btnW / 2;
  const btnY = H / 2 + 60;

  ctx.fillStyle   = won ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 45, 85, 0.12)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth   = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle  = accentColor;
  ctx.font       = "bold 16px 'Courier New'";
  ctx.textAlign  = 'center';
  ctx.fillText('[ CHƠI LẠI ]', W / 2, btnY + 30);

  drawGameOver._btnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
}


// -----------------------------------------------------------
// RESET GAME — khởi động lại hoàn toàn
// -----------------------------------------------------------
function resetGame() {
  game.gold       = 150;
  game.serverHP   = 100;
  game.wave       = 1;
  enemies         = [];
  projectiles     = [];
  towers          = [];
  goldPopups      = [];
  spawnTimer      = 0;
  selectedSlot    = -1;
  for (let i = 0; i < slotState.length; i++) slotState[i] = null;
  setState(STATE.PLAYING);
}


// -----------------------------------------------------------
// KIỂM TRA ĐIỀU KIỆN WIN/LOSE trong update()
//  - Server HP ≤ 0 → GAME_OVER (thua)
//  - Hết wave + không còn enemy → WAVE_CLEAR → nếu là wave cuối → GAME_OVER (thắng)
// -----------------------------------------------------------
function checkWinLose() {
  if (game.serverHP <= 0) {
    setState(STATE.GAME_OVER, { won: false });
    return;
  }
}

// Gọi khi enemy đến đích (server)
function enemyReachedServer(enemy) {
  game.serverHP = Math.max(0, game.serverHP - enemy.damage);
  enemy.alive   = false;
  console.log(`⚠ ${enemy.type} hit server! HP: ${game.serverHP}`);
  checkWinLose();
}


// -----------------------------------------------------------
// ĐẾM SỐ QUÁI CÒN SPAWN TRONG WAVE
// -----------------------------------------------------------
const WAVE_ENEMY_COUNT = 8;   // số quái mỗi wave
let enemiesSpawnedThisWave = 0;

function resetWaveCounters() {
  enemiesSpawnedThisWave = 0;
  spawnTimer = 0;
}


// -----------------------------------------------------------
// PATCH: spawnEnemy() cũ → gắn thêm đếm wave + check done
// -----------------------------------------------------------
const _origSpawnEnemy = spawnEnemy;
spawnEnemy = function() {
  if (currentState !== STATE.PLAYING) return;
  if (enemiesSpawnedThisWave >= WAVE_ENEMY_COUNT) return;

  _origSpawnEnemy();
  enemiesSpawnedThisWave++;
};


// -----------------------------------------------------------
// PATCH: checkCollisions() cũ → thêm kiểm tra enemy đến đích
// -----------------------------------------------------------
const _origCheckCollisions = checkCollisions;
checkCollisions = function() {
  // Kiểm tra enemy đến server (vượt qua bên phải canvas)
  enemies.forEach(enemy => {
    if (enemy.alive && enemy.x > W - 72) {
      enemyReachedServer(enemy);
    }
  });

  _origCheckCollisions();

  // Sau khi xóa enemy, kiểm tra xem wave đã clear chưa
  if (currentState === STATE.PLAYING) {
    const allSpawned = enemiesSpawnedThisWave >= WAVE_ENEMY_COUNT;
    const noEnemies  = enemies.length === 0;
    if (allSpawned && noEnemies) {
      game.wave++;
      if (game.wave > game.totalWaves) {
        // Thắng game
        setState(STATE.WAVE_CLEAR);
        // Sau khi WAVE_CLEAR hiển thị, sẽ chuyển sang GAME_OVER (thắng)
      } else {
        setState(STATE.WAVE_CLEAR);
      }
      resetWaveCounters();
    }
  }
};


// -----------------------------------------------------------
// PATCH: gameLoop() cũ → thêm state machine
// -----------------------------------------------------------
const _origGameLoop = gameLoop;

// Override hoàn toàn gameLoop
// (hàm cũ đã được gọi 1 lần, nên ta dừng nó bằng flag)
let stateMachineActive = false;

function stateGameLoop() {
  const now  = Date.now();
  const dt   = Math.min((now - lastTime) / 1000, 0.1);
  lastTime   = now;

  switch (currentState) {

    // -------------------------------------------------------
    case STATE.MENU:
      drawMenu();
      break;

    // -------------------------------------------------------
    case STATE.PLAYING:
      // Chạy đúng logic update cũ
      spawnTimer += dt;
      if (spawnTimer >= SPAWN_INTERVAL) {
        spawnEnemy();
        spawnTimer = 0;
      }
      updateTowers(dt);
      enemies.forEach(e => { e.move(dt); e.updateFlash(dt); });
      projectiles.forEach(p => p.move(dt));
      checkCollisions();
      updateGoldPopups(dt);
      draw();
      break;

    // -------------------------------------------------------
    case STATE.WAVE_CLEAR:
      stateData.waveClearTimer += dt;
      drawWaveClear();

      if (stateData.waveClearTimer >= stateData.waveClearDuration) {
        if (game.wave > game.totalWaves) {
          setState(STATE.GAME_OVER, { won: true });
        } else {
          setState(STATE.PLAYING);
        }
      }
      break;

    // -------------------------------------------------------
    case STATE.POPUP:
      stateData.popupTimer += dt;
      drawPopup();

      if (stateData.popupTimer >= stateData.popupDuration) {
        currentState = stateData.popupPrevState;
      }
      break;

    // -------------------------------------------------------
    case STATE.GAME_OVER:
      drawGameOver();
      break;
  }

  requestAnimationFrame(stateGameLoop);
}


// -----------------------------------------------------------
// PATCH CLICK — thêm xử lý cho MENU & GAME_OVER
// -----------------------------------------------------------
canvas.addEventListener('click', function(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx     = (e.clientX - rect.left) * scaleX;
  const my     = (e.clientY - rect.top)  * scaleY;

  // MENU → nút bắt đầu
  if (currentState === STATE.MENU) {
    const btn = drawMenu._btnRect;
    if (btn && mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      setState(STATE.PLAYING);
    }
    return;
  }

  // GAME_OVER → nút chơi lại
  if (currentState === STATE.GAME_OVER) {
    const btn = drawGameOver._btnRect;
    if (btn && mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      resetGame();
    }
    return;
  }

  // WAVE_CLEAR / POPUP → chặn click qua
  if (currentState === STATE.WAVE_CLEAR || currentState === STATE.POPUP) return;

}, true);   // capture phase để chạy TRƯỚC listener cũ


// -----------------------------------------------------------
// KHỞI ĐỘNG STATE MACHINE
//  Dừng vòng lặp cũ (đã chạy rồi) bằng cách override requestAnimationFrame
//  → Đơn giản hơn: chỉ cần stateGameLoop tự lặp, loop cũ sẽ
//    tiếp tục gọi gameLoop() nhưng gameLoop() giờ không làm gì.
// -----------------------------------------------------------
// Override gameLoop cũ thành no-op
window._oldGameLoop = gameLoop;
gameLoop = function() {};   // vô hiệu vòng lặp cũ

// Đặt state ban đầu và chạy loop mới
currentState = STATE.MENU;
lastTime     = Date.now();
stateGameLoop();

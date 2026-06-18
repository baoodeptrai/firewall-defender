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
  gold:       300,    // tiền ban đầu
  serverHP:   100,    // máu server
  serverMaxHP:100,
  wave:       1,      // wave hiện tại
  totalWaves: 3,
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
    desc:    'Chặn DDoS hiệu quả',
  },
  {
    id:      'antivirus',
    name:    'ANTIVIRUS',
    price:   150,
    color:   '#00FF88',
    counter: 'Malware',
    desc:    'Diệt Malware hiệu quả',
  },
  {
    id:      'awareness',
    name:    'AWARENESS',
    price:   120,
    color:   '#FFD700',
    counter: 'Phishing',
    desc:    'Chặn Phishing hiệu quả',
  },
];

// Trạng thái từng slot — null = chưa đặt tower
const slotState = [null, null, null, null];

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
function buyTower(slotIndex, tower) {
  if (game.gold < tower.price) return;   // không đủ tiền

  game.gold         -= tower.price;      // trừ tiền
  slotState[slotIndex] = tower;          // đặt tower vào slot
  selectedSlot         = -1;            // đóng menu
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
  ctx.fillStyle  = COLORS.GOLD;
  ctx.font       = "bold 13px 'Courier New'";
  ctx.textAlign  = 'left';
  ctx.fillText(`GOLD: ${game.gold}`, 14, 23);

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
// 6. HÀM VẼ TOÀN BỘ MỘT FRAME
//    Gọi theo thứ tự: nền → lưới → đường → slot → server → HUD
// -----------------------------------------------------------
function draw() {
  // Xóa màn hình (vẽ lại nền mỗi frame)
  ctx.fillStyle = COLORS.BG_DEEP;
  ctx.fillRect(0, 0, W, H);

  drawGrid();    // lưới nền
  drawRoad();    // đường quái chạy
  drawSlots();   // 4 ô đặt tower
  drawServer();  // biểu tượng server
  drawHUD();     // thanh thông tin phía trên
}


// -----------------------------------------------------------
// 7. GAME LOOP — trái tim của game
//    requestAnimationFrame gọi hàm gameLoop ~60 lần/giây
//    Sau này thêm: update() để di chuyển quái, bắn đạn...
// -----------------------------------------------------------
function gameLoop() {
  draw();                          // vẽ frame hiện tại
  requestAnimationFrame(gameLoop); // lên lịch vẽ frame tiếp theo
}

// Khởi động game loop
gameLoop();
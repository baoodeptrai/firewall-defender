// ============================================================
//  FIREWALL DEFENDER – guide.js
//  Bảng hướng dẫn cách chơi + enemy info popup khi click quái
// ============================================================

// -----------------------------------------------------------
// ENEMY INFO PANEL — hiện khi click vào quái
// -----------------------------------------------------------
const ENEMY_INFO = {
  malware: {
    name: 'MALWARE',
    icon: '🔴',
    hp: 80,
    speed: 'Trung bình (60)',
    damage: 15,
    threat: '★★☆☆☆',
    desc: 'Virus nguy hiểm, tấn công trực tiếp. Có kháng nhẹ với Firewall.',
    recommended: ['ANTIVIRUS'],
    weakness: 'Antivirus diệt nhanh, Encryption hỗ trợ tốt.',
  },
  phishing: {
    name: 'PHISHING',
    icon: '🟡',
    hp: 40,
    speed: 'Nhanh (120)',
    damage: 10,
    threat: '★★☆☆☆',
    desc: 'Email lừa đảo. Máu thấp nhưng chạy rất nhanh — phải bắn sớm!',
    recommended: ['AWARENESS'],
    weakness: 'Awareness phát hiện và hạ nhanh. IDS/IPS cũng hiệu quả.',
  },
  ddos: {
    name: 'DDoS',
    icon: '🟠',
    hp: 200,
    speed: 'Chậm (30)',
    damage: 35,
    threat: '★★★★☆',
    desc: 'Tấn công dồn dập, máu rất cao. Đặt Firewall phía trước để chặn!',
    recommended: ['FIREWALL', 'IDS/IPS'],
    weakness: 'Firewall + IDS/IPS phối hợp sẽ hạ trước khi đến server.',
  },
  ransomware: {
    name: 'RANSOMWARE',
    icon: '🟣',
    hp: 150,
    speed: 'Vừa (50)',
    damage: 25,
    threat: '★★★☆☆',
    desc: 'Mã hóa dữ liệu, gây damage nặng. Cần phản ứng nhanh!',
    recommended: ['ENCRYPTION'],
    weakness: 'Encryption là khắc tinh trực tiếp của Ransomware.',
  },
  apt: {
    name: 'APT (BOSS)',
    icon: '🔵',
    hp: 500,
    speed: 'Chậm (25)',
    damage: 50,
    threat: '★★★★★',
    desc: 'Mối đe dọa nâng cao — boss khó nhất! Dùng tất cả tower mạnh nhất.',
    recommended: ['IDS/IPS', 'FIREWALL', 'ENCRYPTION'],
    weakness: 'Cần tổng hợp tất cả tower. IDS/IPS là cốt lõi chống APT.',
  },
};

// -----------------------------------------------------------
// TOWER COLORS (để tô màu recommended badges)
// -----------------------------------------------------------
const TOWER_COLORS_GUIDE = {
  'FIREWALL':   '#00D4FF',
  'ANTIVIRUS':  '#00FF88',
  'AWARENESS':  '#FFD700',
  'ENCRYPTION': '#CC00FF',
};

// -----------------------------------------------------------
// TRẠNG THÁI GUIDE & ENEMY POPUP
// -----------------------------------------------------------
const GuideSystem = {
  // Bảng hướng dẫn chính
  guideVisible: true,   // mở ngay khi bắt đầu
  guidePage: 0,         // trang hiện tại (0 hoặc 1)

  // Popup thông số quái khi click
  enemyPopup: null,     // { enemy, x, y } hoặc null
  enemyPopupTimer: 0,
  ENEMY_POPUP_TIMEOUT: 8, // giây tự đóng

  // Nút ? để mở hướng dẫn (vị trí cố định)
HELP_BTN: { x: 40, y: 46, r: 16 },

  // --------------------------------------------------------
  // Mở / đóng bảng hướng dẫn
  // --------------------------------------------------------
  openGuide() {
    this.guideVisible = true;
    this.guidePage = 0;
  },
  closeGuide() {
    this.guideVisible = false;
  },
  toggleGuide() {
    this.guideVisible = !this.guideVisible;
  },

  // --------------------------------------------------------
  // Mở popup thông số quái
  // --------------------------------------------------------
  openEnemyPopup(enemy) {
    this.enemyPopup = enemy;
    this.enemyPopupTimer = 0;
  },
  closeEnemyPopup() {
    this.enemyPopup = null;
  },

  // --------------------------------------------------------
  // Update timer tự đóng popup quái
  // --------------------------------------------------------
  update(dt) {
    if (this.enemyPopup) {
      this.enemyPopupTimer += dt;
      if (this.enemyPopupTimer >= this.ENEMY_POPUP_TIMEOUT) {
        this.enemyPopup = null;
      }
    }
  },

  // --------------------------------------------------------
  // Vẽ nút ? (Help Button) — luôn hiển thị khi đang chơi
  // --------------------------------------------------------
  drawHelpButton(ctx) {
    const { x, y, r } = this.HELP_BTN;
    ctx.save();
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.guideVisible ? '#00D4FF' : '#0D2137';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = this.guideVisible ? '#0A1628' : '#00D4FF';
    ctx.font = "bold 14px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
    ctx.textBaseline = 'alphabetic';
  },

  // --------------------------------------------------------
  // Vẽ bảng hướng dẫn (overlay)
  // --------------------------------------------------------
  drawGuide(ctx, W, H) {
    if (!this.guideVisible) return;

    // Overlay mờ
    ctx.fillStyle = 'rgba(6, 14, 26, 0.88)';
    ctx.fillRect(0, 0, W, H);

    const bw = 700, bh = 420;
    const bx = W / 2 - bw / 2;
    const by = H / 2 - bh / 2;

    // Box nền
    ctx.fillStyle = '#0A1628';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Tiêu đề
    ctx.save();
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#00D4FF';
    ctx.font = "bold 18px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillText('[ HƯỚNG DẪN CHƠI ]', W / 2, by + 32);
    ctx.restore();

    // Tab chọn trang
    const tabs = ['📖 Cách chơi', '🛡️ Tower & Quái'];
    tabs.forEach((tab, i) => {
      const tx = bx + 60 + i * 180;
      const ty = by + 46;
      const tw = 160, th = 26;
      ctx.fillStyle = this.guidePage === i ? '#00D4FF' : '#162845';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tw, th);
      ctx.fillStyle = this.guidePage === i ? '#0A1628' : '#00D4FF';
      ctx.font = "bold 11px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillText(tab, tx + tw / 2, ty + 17);
    });

    if (this.guidePage === 0) {
      this._drawGuidePage0(ctx, bx, by, bw, bh);
    } else {
      this._drawGuidePage1(ctx, bx, by, bw, bh);
    }

    // Nút đóng [X]
    const cx = bx + bw - 36, cy = by + 14;
    ctx.fillStyle = '#FF2D55';
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 12px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', cx, cy);
    ctx.textBaseline = 'alphabetic';

    // Lưu vùng click
    this._closeBtnRect = { x: cx - 13, y: cy - 13, w: 26, h: 26 };
    this._tab0Rect = { x: bx + 60, y: by + 46, w: 160, h: 26 };
    this._tab1Rect = { x: bx + 240, y: by + 46, w: 160, h: 26 };
  },

  _drawGuidePage0(ctx, bx, by, bw, bh) {
    const startY = by + 90;
    const col1 = bx + 30;
    const col2 = bx + 360;
    const lineH = 28;

    // Mục tiêu
    ctx.fillStyle = '#00FF88';
    ctx.font = "bold 13px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText('🎯 MỤC TIÊU', col1, startY);

    ctx.fillStyle = '#A8C8E8';
    ctx.font = "12px 'Courier New'";
    ctx.fillText('Đặt tower để tiêu diệt quái trước khi chúng', col1, startY + 18);
    ctx.fillText('đến được SERVER. Bảo vệ HP server đến wave cuối!', col1, startY + 34);

    // Điều khiển
    ctx.fillStyle = '#00FF88';
    ctx.font = "bold 13px 'Courier New'";
    ctx.fillText('🖱️ ĐIỀU KHIỂN', col1, startY + 64);

    const controls = [
      ['Click slot (+)', 'Mở menu mua tower'],
      ['Click tower đã đặt', 'Xem / chọn tower'],
      ['Click vào quái', 'Xem thông số + gợi ý'],
      ['Click [ ? ]', 'Mở/đóng hướng dẫn'],
      ['Click vùng trống', 'Đóng menu'],
    ];
    controls.forEach(([key, val], i) => {
      const y = startY + 84 + i * lineH;
      ctx.fillStyle = '#00D4FF';
      ctx.font = "bold 11px 'Courier New'";
      ctx.fillText(`▸ ${key}`, col1, y);
      ctx.fillStyle = '#A8C8E8';
      ctx.font = "11px 'Courier New'";
      ctx.fillText(val, col1 + 160, y);
    });

    // Kinh tế
    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 13px 'Courier New'";
    ctx.fillText('💰 KINH TẾ', col2, startY);

    ctx.fillStyle = '#A8C8E8';
    ctx.font = "11px 'Courier New'";
    const tips = [
      'Bắt đầu với 500 Gold',
      'Tiêu diệt quái: +50 Gold',
      'Ưu tiên mua tower sớm',
      'Tower rẻ hơn chưa chắc tệ hơn!',
    ];
    tips.forEach((tip, i) => {
      ctx.fillText(`• ${tip}`, col2, startY + 20 + i * 20);
    });

    // Chiến thuật
    ctx.fillStyle = '#FF6B00';
    ctx.font = "bold 13px 'Courier New'";
    ctx.fillText('⚡ CHIẾN THUẬT', col2, startY + 106);

    ctx.fillStyle = '#A8C8E8';
    ctx.font = "11px 'Courier New'";
    const strats = [
      'Phối hợp nhiều loại tower',
      'Đặt tower range rộng ở giữa',
      'Xem thông số quái để chọn tower đúng',
      'APT (boss) cần nhiều tower mạnh!',
    ];
    strats.forEach((s, i) => {
      ctx.fillText(`• ${s}`, col2, startY + 124 + i * 20);
    });

    // Ghi chú dưới
    ctx.fillStyle = '#4A6080';
    ctx.font = "10px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillText('💡 Click vào quái để xem thông số chi tiết và gợi ý tower phù hợp', bx + bw / 2, by + bh - 18);
  },

  _drawGuidePage1(ctx, bx, by, bw, bh) {
    const startY = by + 90;

    // === TOWER TABLE ===
    ctx.fillStyle = '#00FF88';
    ctx.font = "bold 12px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText('🛡️ BẢNG TOWER', bx + 20, startY);

    const towerRows = [
      { name: 'FIREWALL',   cost: '100G', dmg: '20', range: '150', best: 'DDoS, APT',      color: '#00D4FF' },
      { name: 'ANTIVIRUS',  cost: '80G',  dmg: '25', range: '120', best: 'Malware',         color: '#00FF88' },
      { name: 'AWARENESS',  cost: '60G',  dmg: '15', range: '100', best: 'Phishing',         color: '#FFD700' },
      { name: 'ENCRYPTION', cost: '150G', dmg: '30', range: '130', best: 'Ransomware',      color: '#CC00FF' },
    ];

    // Header
    const cols = [bx + 20, bx + 130, bx + 185, bx + 235, bx + 285];
    const headers = ['Tower', 'Giá', 'DMG', 'Range', 'Hiệu quả nhất vs'];
    headers.forEach((h, i) => {
      ctx.fillStyle = '#4A6080';
      ctx.font = "bold 10px 'Courier New'";
      ctx.textAlign = 'left';
      ctx.fillText(h, cols[i], startY + 18);
    });

    towerRows.forEach((row, i) => {
      const ry = startY + 36 + i * 30;
      // nền xen kẽ
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(22, 40, 69, 0.5)';
        ctx.fillRect(bx + 14, ry - 14, 330, 26);
      }
      // Dot màu
      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.arc(cols[0] + 6, ry - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      // Name
      ctx.fillStyle = row.color;
      ctx.font = "bold 11px 'Courier New'";
      ctx.fillText(row.name, cols[0] + 16, ry);
      ctx.fillStyle = '#A8C8E8';
      ctx.font = "11px 'Courier New'";
      ctx.fillText(row.cost, cols[1], ry);
      ctx.fillText(row.dmg, cols[2], ry);
      ctx.fillText(row.range, cols[3], ry);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(row.best, cols[4], ry);
    });

    // === ENEMY TABLE ===
    const ex = bx + 370;
    ctx.fillStyle = '#FF2D55';
    ctx.font = "bold 12px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText('👾 BẢNG QUÁI', ex, startY);

    const enemyRows = [
      { name: 'MALWARE',    hp: '80',  spd: 'TB', dmg: '15', color: '#FF2D55' },
      { name: 'PHISHING',   hp: '40',  spd: 'Nhanh', dmg: '10', color: '#FFD700' },
      { name: 'DDoS',       hp: '200', spd: 'Chậm', dmg: '35', color: '#FF6B00' },
      { name: 'RANSOMWARE', hp: '150', spd: 'TB', dmg: '25', color: '#CC00FF' },
      { name: 'APT',        hp: '500', spd: 'Chậm', dmg: '50', color: '#00D4FF' },
    ];

    const ecols = [ex, ex + 120, ex + 175, ex + 215];
    const eheaders = ['Quái', 'HP', 'Tốc', 'DMG'];
    eheaders.forEach((h, i) => {
      ctx.fillStyle = '#4A6080';
      ctx.font = "bold 10px 'Courier New'";
      ctx.fillText(h, ecols[i], startY + 18);
    });

    enemyRows.forEach((row, i) => {
      const ry = startY + 36 + i * 30;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(22, 40, 69, 0.5)';
        ctx.fillRect(ex - 6, ry - 14, 260, 26);
      }
      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.arc(ecols[0] + 6, ry - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = row.color;
      ctx.font = "bold 11px 'Courier New'";
      ctx.fillText(row.name, ecols[0] + 16, ry);
      ctx.fillStyle = '#A8C8E8';
      ctx.font = "11px 'Courier New'";
      ctx.fillText(row.hp, ecols[1], ry);
      ctx.fillText(row.spd, ecols[2], ry);
      ctx.fillStyle = '#FF2D55';
      ctx.fillText(row.dmg, ecols[3], ry);
    });

    ctx.fillStyle = '#4A6080';
    ctx.font = "10px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillText('💡 APT là boss — xuất hiện wave 3, cần mọi tower mạnh!', bx + bw / 2, by + bh - 18);
  },

  // --------------------------------------------------------
  // Vẽ popup thông số quái khi click
  // --------------------------------------------------------
  drawEnemyPopup(ctx, W, H) {
    if (!this.enemyPopup) return;

    const enemy = this.enemyPopup;
    const info = ENEMY_INFO[enemy.type];
    if (!info) return;

    const pw = 260, ph = 230;
    // Vị trí: cố định góc phải, không đè HUD
    const px = W - pw - 12;
    const py = 48;

    // Nền
    ctx.fillStyle = '#0A1628';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = ENEMY_INFO[enemy.type] ? enemy.color || '#00D4FF' : '#00D4FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Header
    ctx.fillStyle = enemy.color || '#00D4FF';
    ctx.font = "bold 13px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText(`${info.icon} ${info.name}`, px + 12, py + 20);

    // Timer bar
    const pct = 1 - this.enemyPopupTimer / this.ENEMY_POPUP_TIMEOUT;
    ctx.fillStyle = '#162845';
    ctx.fillRect(px + 12, py + 26, pw - 24, 3);
    ctx.fillStyle = enemy.color || '#00D4FF';
    ctx.fillRect(px + 12, py + 26, (pw - 24) * pct, 3);

    // Stats
    const stats = [
      ['HP',     `${Math.round(enemy.hp)} / ${enemy.maxHp}`],
      ['Tốc độ', info.speed],
      ['Damage', `${enemy.damage} / chạm`],
      ['Threat', info.threat],
    ];

    stats.forEach(([label, val], i) => {
      const sy = py + 46 + i * 22;
      ctx.fillStyle = '#4A6080';
      ctx.font = "10px 'Courier New'";
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 12, sy);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = "bold 11px 'Courier New'";
      ctx.fillText(val, px + 80, sy);
    });

    // Divider
    ctx.strokeStyle = '#162845';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 140);
    ctx.lineTo(px + pw - 10, py + 140);
    ctx.stroke();

    // Recommended towers
    ctx.fillStyle = '#00FF88';
    ctx.font = "bold 10px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText('⚡ TOWER NÊN DÙNG:', px + 12, py + 155);

    info.recommended.forEach((tName, i) => {
      const tx = px + 12 + i * 86;
      const ty2 = py + 162;
      const tw = 80, th = 20;
      const tColor = TOWER_COLORS_GUIDE[tName] || '#00D4FF';
      ctx.fillStyle = `${tColor}22`;
      ctx.fillRect(tx, ty2, tw, th);
      ctx.strokeStyle = tColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty2, tw, th);
      ctx.fillStyle = tColor;
      ctx.font = "bold 9px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillText(tName, tx + tw / 2, ty2 + 13);
    });

    // Weakness tip
    ctx.fillStyle = '#A8C8E8';
    ctx.font = "9px 'Courier New'";
    ctx.textAlign = 'left';
    const tipWords = info.weakness;
    // Word wrap thô
    const maxW = pw - 24;
    const words = tipWords.split(' ');
    let line = '';
    let lineY = py + 198;
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), px + 12, lineY);
        line = word + ' ';
        lineY += 14;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line.trim(), px + 12, lineY);

    // Nút đóng X nhỏ
    ctx.fillStyle = '#FF2D55';
    ctx.beginPath();
    ctx.arc(px + pw - 12, py + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 10px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', px + pw - 12, py + 12);
    ctx.textBaseline = 'alphabetic';

    this._enemyCloseBtnRect = { x: px + pw - 21, y: py + 3, w: 18, h: 18 };
  },

  // --------------------------------------------------------
  // Xử lý click — trả về true nếu đã consume event
  // --------------------------------------------------------
  handleClick(mx, my) {
    // Click nút X đóng guide
    if (this.guideVisible && this._closeBtnRect) {
      const b = this._closeBtnRect;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        this.closeGuide();
        return true;
      }
      // Click tab 0
      if (this._tab0Rect) {
        const t = this._tab0Rect;
        if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
          this.guidePage = 0; return true;
        }
      }
      // Click tab 1
      if (this._tab1Rect) {
        const t = this._tab1Rect;
        if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
          this.guidePage = 1; return true;
        }
      }
      // Click ngoài guide → đóng
      return true; // khi guide mở, chặn mọi click khác
    }

    // Click nút ? help
    const { x, y, r } = this.HELP_BTN;
    if (Math.hypot(mx - x, my - y) <= r) {
      this.toggleGuide();
      return true;
    }

    // Click nút X đóng enemy popup
    if (this.enemyPopup && this._enemyCloseBtnRect) {
      const b = this._enemyCloseBtnRect;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        this.closeEnemyPopup();
        return true;
      }
    }

    return false;
  },

  // --------------------------------------------------------
  // Kiểm tra click vào quái
  // --------------------------------------------------------
  checkEnemyClick(mx, my, enemies) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = mx - enemy.x;
      const dy = my - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) <= enemy.radius + 6) {
        this.openEnemyPopup(enemy);
        return true;
      }
    }
    return false;
  },
};

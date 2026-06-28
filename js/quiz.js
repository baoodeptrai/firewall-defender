// ============================================================
//  FIREWALL DEFENDER – quiz.js
//  Nhiệm vụ: lưu trữ data câu hỏi và vẽ quiz trong popup
// ============================================================

const QUIZ_DATA = {
  3: {
    question: 'Vì sao Phishing vẫn có thể lọt qua Firewall trong game?',
    choices: [
      'Vì Phishing khai thác lỗi kỹ thuật Firewall',
      'Vì Phishing lừa người dùng mở liên kết độc hại',
      'Vì Firewall không thể xử lý gói tin Phishing',
      'Vì Phishing quá nhanh nên Firewall không kịp phản ứng',
    ],
    correctIndex: 1,
    reward: 20,
  },
  5: {
    question: 'Loại tấn công nào bị ngăn chặn tốt nhất khi sử dụng Firewall?',
    choices: [
      'Malware',
      'Phishing',
      'DDoS',
      'Ransomware',
    ],
    correctIndex: 2,
    reward: 25,
  },
  8: {
    question: 'Tower nào có hiệu quả nhất trước Ransomware trong game?',
    choices: [
      'Firewall',
      'Antivirus',
      'Awareness',
      'IDS/IPS',
    ],
    correctIndex: 1,
    reward: 30,
  },
};

class Quiz {
  constructor(wave) {
    const data = QUIZ_DATA[wave] || QUIZ_DATA[3];
    this.question = data.question;
    this.choices = data.choices;
    this.correctIndex = data.correctIndex;
    this.reward = data.reward;
    this.selectedIndex = -1;
    this.answerChecked = false;
    this.choiceRects = [];
  }

  get isAnswered() {
    return this.answerChecked;
  }

  get wasCorrect() {
    return this.answerChecked && this.selectedIndex === this.correctIndex;
  }

  draw(ctx, x, y, width) {
    const lineHeight = 18;
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = "bold 14px 'Courier New'";
    ctx.textAlign = 'left';
    ctx.fillText('Quiz:', x, y);

    ctx.font = "12px 'Courier New'";
    ctx.fillText(this.question, x, y + lineHeight * 1.5);

    this.choiceRects = [];
    const choiceStartY = y + lineHeight * 3.2;

    this.choices.forEach((choice, index) => {
      const rect = {
        x: x,
        y: choiceStartY + index * 34,
        w: width,
        h: 28,
      };

      const isSelected = this.selectedIndex === index;
      const isCorrect = this.answerChecked && index === this.correctIndex;
      const isWrong = this.answerChecked && isSelected && !isCorrect;

      ctx.fillStyle = isCorrect ? '#00FF88'
                    : isWrong ? '#FF2D55'
                    : isSelected ? 'rgba(0, 212, 255, 0.16)'
                    : '#142A44';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = isSelected ? COLORS.CYAN : '#22425A';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

      ctx.fillStyle = '#E8F4FF';
      ctx.font = "12px 'Courier New'";
      ctx.fillText(choice, rect.x + 10, rect.y + 18);
      this.choiceRects.push(rect);
    });

    if (this.answerChecked) {
      ctx.fillStyle = this.wasCorrect ? '#00FF88' : '#FF2D55';
      ctx.font = "bold 12px 'Courier New'";
      ctx.fillText(
        this.wasCorrect
          ? `Đúng! +${this.reward} GOLD` 
          : 'Sai rồi. Không có thưởng.',
        x,
        choiceStartY + this.choices.length * 34 + 24
      );
    }
  }

  handleClick(mx, my) {
    if (this.answerChecked) return null;
    for (let i = 0; i < this.choiceRects.length; i += 1) {
      const rect = this.choiceRects[i];
      if (isInsideRect(mx, my, rect)) {
        this.selectedIndex = i;
        this.answerChecked = true;
        return i === this.correctIndex ? this.reward : 0;
      }
    }
    return null;
  }
}

# 🚀 快速開始指南 / Quick Start Guide

## 中文說明

### 1️⃣ 安裝依賴

```bash
npm install
```

### 2️⃣ 啟動開發伺服器

```bash
npm run dev
```

遊戲會自動在瀏覽器中打開（預設：http://localhost:3000）

### 3️⃣ 開始遊戲！

- 點擊「Start Game」開始
- 使用鍵盤方向鍵或 A/D、W/S 控制
- 手機上可以直接滑動螢幕

### 建置正式版本

```bash
npm run build
```

建置完成後，檔案會在 `dist/` 目錄中。

### 預覽正式版本

```bash
npm run preview
```

---

## English Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Development Server

```bash
npm run dev
```

The game will automatically open in your browser (default: http://localhost:3000)

### 3️⃣ Start Playing!

- Click "Start Game" to begin
- Use arrow keys or A/D, W/S to control
- On mobile, swipe on the screen

### Build for Production

```bash
npm run build
```

After building, files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🎮 遊戲操作 / Game Controls

### 桌面 / Desktop
- **← → or A/D**: 切換車道 / Switch lanes
- **Space or W/↑**: 跳躍 / Jump
- **Shift or S/↓**: 滑行 / Slide
- **Esc or P**: 暫停 / Pause

### 手機 / Mobile
- **左右滑動 / Swipe Left/Right**: 切換車道 / Switch lanes
- **上滑 / Swipe Up**: 跳躍 / Jump
- **下滑 / Swipe Down**: 滑行 / Slide

---

## 📝 常見問題 / FAQ

### Q: 音效沒有播放？
**A**: 現代瀏覽器會阻擋自動播放音效，請點擊畫面任何地方啟用音效。

### Q: 遊戲太卡頓？
**A**: 可以在 `src/utils/Constants.ts` 中關閉陰影：
```typescript
ENABLE_SHADOWS: false
```

### Q: 想要自訂遊戲設定？
**A**: 編輯 `src/utils/Constants.ts` 檔案即可調整速度、難度、分數等設定。

### Q: No audio playing?
**A**: Modern browsers block autoplay. Click anywhere on the screen to enable audio.

### Q: Game is laggy?
**A**: You can disable shadows in `src/utils/Constants.ts`:
```typescript
ENABLE_SHADOWS: false
```

### Q: Want to customize game settings?
**A**: Edit the `src/utils/Constants.ts` file to adjust speed, difficulty, scoring, etc.

---

## 🎨 添加自訂資源 / Adding Custom Assets

將 3D 模型（.glb 格式）放入 `public/models/` 目錄即可自動載入。

詳細說明請參考 `public/ASSETS_README.md`

Place 3D models (.glb format) in `public/models/` directory to automatically load them.

See `public/ASSETS_README.md` for detailed instructions.

---

## 🐛 回報問題 / Report Issues

如果遇到任何問題，請檢查瀏覽器的開發者工具 (F12) 查看錯誤訊息。

If you encounter any issues, check the browser's developer console (F12) for error messages.

---

**祝你玩得開心！ / Have fun playing! 🐱✨**

# 音频文件指南

## 需要的音频文件

请将以下音频文件放入 `public/sounds/` 文件夹：

### 1. 背景音乐
- **文件名**: `bgm.mp3`
- **类型**: 欢快的、轻松的背景音乐
- **时长**: 30秒-2分钟（会循环播放）
- **推荐**: 8-bit 风格或轻快的电子音乐

### 2. 跳跃音效
- **文件名**: `jump.wav`
- **类型**: 短促的跳跃音效
- **时长**: 0.2-0.5秒
- **推荐**: "boing" 或 "hop" 音效

### 3. 金币音效
- **文件名**: `coin.wav`
- **类型**: 清脆的收集音效
- **时长**: 0.2-0.5秒
- **推荐**: "ding" 或 "chime" 音效

### 4. 鱼音效
- **文件名**: `fish.wav`
- **类型**: 较高价值的收集音效
- **时长**: 0.3-0.6秒
- **推荐**: 比 coin 更丰富的音效

### 5. 碰撞音效
- **文件名**: `hit.wav`
- **类型**: 碰撞或撞击音效
- **时长**: 0.3-0.7秒
- **推荐**: "thud" 或 "crash" 音效

### 6. 道具音效
- **文件名**: `powerup.wav`
- **类型**: 获得道具的提示音
- **时长**: 0.5-1秒
- **推荐**: 上升音调或魔法音效

---

## 免费音效资源网站

### 推荐网站：

1. **Freesound.org**
   - 网址: https://freesound.org/
   - 免费，需注册
   - 搜索关键词: "jump", "coin", "hit", "powerup", "8bit music"

2. **OpenGameArt.org**
   - 网址: https://opengameart.org/
   - 专门的游戏素材网站
   - 有很多适合的音效和音乐

3. **Mixkit.co**
   - 网址: https://mixkit.co/free-sound-effects/
   - 无需注册
   - 免费商用

4. **Zapsplat.com**
   - 网址: https://www.zapsplat.com/
   - 需注册（免费）
   - 音效质量高

5. **Pixabay** (有音效版块)
   - 网址: https://pixabay.com/sound-effects/
   - 无需注册
   - 完全免费

---

## 如何添加音频文件

1. 下载你喜欢的音频文件
2. 将文件重命名为上面列出的文件名
3. 将文件复制到项目的 `public/sounds/` 文件夹
4. 重新构建项目: `npm run build`
5. 部署到 GitHub Pages

---

## 音频格式建议

- **背景音乐**: MP3 格式（文件较小）
- **音效**: WAV 格式（音质好，反应快）

如果你下载的音频格式不对，可以使用在线转换工具：
- https://cloudconvert.com/
- https://online-audio-converter.com/

---

## 快速测试

添加音频文件后，在本地测试：
```bash
npm run dev
```

打开浏览器，检查控制台是否有 "Audio system initialized" 消息。

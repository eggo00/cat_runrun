# 🛠️ Developer Guide - 開發者指南

## 目錄 / Table of Contents

1. [如何添加新的障礙物類型](#添加障礙物)
2. [如何添加新的道具](#添加道具)
3. [如何調整遊戲難度](#調整難度)
4. [如何添加新的皮膚](#添加皮膚)
5. [如何集成後端 API](#集成後端)
6. [性能優化建議](#性能優化)

---

## <a name="添加障礙物"></a>📦 如何添加新的障礙物類型

### 步驟 1: 在 Constants.ts 中定義新類型

```typescript
// src/utils/Constants.ts
export enum ObstacleType {
  LOW = 'low',
  MIDDLE = 'middle',
  HIGH = 'high',
  MOVING = 'moving',  // 新增：移動障礙物
}
```

### 步驟 2: 在 Obstacle.ts 中添加創建邏輯

```typescript
// src/entities/Obstacle.ts
private createObstacleMesh(type: ObstacleType): THREE.Object3D {
  // ... 現有代碼

  switch (type) {
    // ... 現有 cases

    case ObstacleType.MOVING:
      // 創建移動障礙物的幾何體
      geometry = new THREE.SphereGeometry(0.5, 8, 8);
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 1;
      break;
  }
}
```

### 步驟 3: 添加移動邏輯（如果需要）

```typescript
// src/entities/Obstacle.ts
update(deltaTime: number): void {
  if (!this.active) return;

  // 移動障礙物特殊邏輯
  if (this.type === ObstacleType.MOVING) {
    this.mesh.position.x += Math.sin(Date.now() * 0.001) * 2;
  }

  this.boundingBox.setFromObject(this.mesh);
}
```

### 步驟 4: 在 LevelGenerator 中使用

```typescript
// src/systems/LevelGenerator.ts
private randomObstacleType(): ObstacleType {
  const types = [
    ObstacleType.LOW,
    ObstacleType.MIDDLE,
    ObstacleType.HIGH,
    ObstacleType.MOVING  // 添加新類型
  ];
  return types[Math.floor(Math.random() * types.length)];
}
```

---

## <a name="添加道具"></a>⚡ 如何添加新的道具

### 步驟 1: 定義道具類型

```typescript
// src/utils/Constants.ts
export enum PowerUpType {
  MAGNET = 'magnet',
  MULTIPLIER = 'multiplier',
  SHIELD = 'shield',
  SLOW_MOTION = 'slow_motion',  // 新增：慢動作
}

export enum CollectibleType {
  // ... 現有類型
  POWERUP_SLOW_MOTION = 'powerup_slow_motion',  // 新增
}

export const GAME_CONFIG = {
  // ... 現有設定
  SLOW_MOTION_DURATION: 10,  // 新增：慢動作持續時間
  SLOW_MOTION_FACTOR: 0.5,   // 新增：速度減緩倍數
};
```

### 步驟 2: 在 PowerUpSystem 中初始化

```typescript
// src/systems/PowerUpSystem.ts
private initializePowerUps(): void {
  // ... 現有道具

  this.powerUps.set(PowerUpType.SLOW_MOTION, {
    type: PowerUpType.SLOW_MOTION,
    duration: GAME_CONFIG.SLOW_MOTION_DURATION,
    remainingTime: 0,
    active: false,
  });
}
```

### 步驟 3: 在 Collectible 中創建視覺效果

```typescript
// src/entities/Collectible.ts
case CollectibleType.POWERUP_SLOW_MOTION: {
  const geometry = new THREE.IcosahedronGeometry(0.4, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5,
  });
  const slowMo = new THREE.Mesh(geometry, material);
  group.add(slowMo);
  break;
}
```

### 步驟 4: 在 Game.ts 中實現效果

```typescript
// src/Game.ts
private handleCollision(type: 'obstacle' | 'collectible', object: any): void {
  if (type === 'collectible') {
    const collectible = object as Collectible;

    switch (collectible.getType()) {
      // ... 現有 cases

      case CollectibleType.POWERUP_SLOW_MOTION:
        this.powerUpSystem.activatePowerUp(PowerUpType.SLOW_MOTION);
        this.audioManager.playSFX('powerup');
        break;
    }
  }
}

private update(deltaTime: number): void {
  // ... 現有代碼

  // 應用慢動作效果
  const slowMotionActive = this.powerUpSystem.isActive(PowerUpType.SLOW_MOTION);
  const effectiveDeltaTime = slowMotionActive
    ? deltaTime * GAME_CONFIG.SLOW_MOTION_FACTOR
    : deltaTime;

  this.gameScene.update(effectiveDeltaTime);
}
```

---

## <a name="調整難度"></a>🎯 如何調整遊戲難度

### 簡單模式設定

```typescript
// src/utils/Constants.ts
export const GAME_CONFIG = {
  BASE_SPEED: 12,              // 降低起始速度
  MAX_SPEED: 30,               // 降低最高速度
  SPEED_INCREMENT: 0.3,        // 減緩速度增長
  JUMP_FORCE: 15,              // 增加跳躍高度
  OBSTACLE_BASE_PROBABILITY: 0.25,  // 減少障礙物
  OBSTACLE_MAX_PROBABILITY: 0.5,    // 上限也降低
};
```

### 困難模式設定

```typescript
export const GAME_CONFIG = {
  BASE_SPEED: 20,              // 提高起始速度
  MAX_SPEED: 50,               // 提高最高速度
  SPEED_INCREMENT: 0.8,        // 加速速度增長
  JUMP_FORCE: 10,              // 減少跳躍高度
  OBSTACLE_BASE_PROBABILITY: 0.6,   // 增加障礙物
  OBSTACLE_MAX_PROBABILITY: 0.9,    // 上限也提高
  SLIDE_DURATION: 0.4,         // 縮短滑行時間
};
```

### 動態難度系統

```typescript
// src/systems/DifficultyManager.ts (新建文件)
export class DifficultyManager {
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.updateGameConfig();
  }

  private updateGameConfig(): void {
    switch (this.difficulty) {
      case 'easy':
        GAME_CONFIG.BASE_SPEED = 12;
        GAME_CONFIG.OBSTACLE_BASE_PROBABILITY = 0.25;
        break;
      case 'medium':
        GAME_CONFIG.BASE_SPEED = 15;
        GAME_CONFIG.OBSTACLE_BASE_PROBABILITY = 0.4;
        break;
      case 'hard':
        GAME_CONFIG.BASE_SPEED = 20;
        GAME_CONFIG.OBSTACLE_BASE_PROBABILITY = 0.6;
        break;
    }
  }
}
```

---

## <a name="添加皮膚"></a>🎨 如何添加新的皮膚

### 步驟 1: 準備皮膚資料

```typescript
// src/data/skins.ts (新建文件)
export const SKINS = [
  {
    id: 'orange',
    name: 'Orange Cat',
    price: 0,
    unlocked: true,
    color: 0xffa500,
  },
  {
    id: 'cosmic',
    name: 'Cosmic Cat',
    price: 1000,
    unlocked: false,
    color: 0x9400d3,
    modelPath: '/models/cat-cosmic.glb',  // 可選：自訂模型
  },
];
```

### 步驟 2: 實現皮膚切換

```typescript
// src/entities/Player.ts
export class Player {
  private currentSkin: string = 'orange';

  changeSkin(skinId: string): void {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin || !skin.unlocked) return;

    this.currentSkin = skinId;
    this.updateMeshColor(skin.color);

    // 如果有自訂模型，載入它
    if (skin.modelPath) {
      this.loadCustomModel(skin.modelPath);
    }
  }

  private updateMeshColor(color: number): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.set(color);
      }
    });
  }
}
```

### 步驟 3: 持久化皮膚選擇

```typescript
// src/systems/SaveSystem.ts (新建文件)
export class SaveSystem {
  static saveCurrentSkin(skinId: string): void {
    localStorage.setItem('cat-runrun-skin', skinId);
  }

  static loadCurrentSkin(): string {
    return localStorage.getItem('cat-runrun-skin') || 'orange';
  }

  static unlockSkin(skinId: string): void {
    const unlocked = this.getUnlockedSkins();
    if (!unlocked.includes(skinId)) {
      unlocked.push(skinId);
      localStorage.setItem('cat-runrun-unlocked', JSON.stringify(unlocked));
    }
  }

  static getUnlockedSkins(): string[] {
    const stored = localStorage.getItem('cat-runrun-unlocked');
    return stored ? JSON.parse(stored) : ['orange'];
  }
}
```

---

## <a name="集成後端"></a>🌐 如何集成後端 API

### 排行榜 API 範例

```typescript
// src/api/leaderboard.ts (新建文件)
export class LeaderboardAPI {
  private static BASE_URL = 'https://your-api.com/api';

  /**
   * 提交分數到排行榜
   */
  static async submitScore(playerName: string, score: number, distance: number): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          score,
          distance,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }

  /**
   * 獲取排行榜
   */
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/leaderboard?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
```

### 在 UIManager 中使用

```typescript
// src/ui/UIManager.ts
private async populateLeaderboard(): Promise<void> {
  const leaderboardList = this.getElement('leaderboard-list');
  leaderboardList.innerHTML = '<p>Loading...</p>';

  try {
    const entries = await LeaderboardAPI.getLeaderboard(10);
    leaderboardList.innerHTML = '';

    entries.forEach(entry => {
      // ... 渲染排行榜項目
    });
  } catch (error) {
    leaderboardList.innerHTML = '<p>Failed to load leaderboard</p>';
  }
}
```

### 後端 API 規格（Node.js + Express 範例）

```javascript
// server/routes/leaderboard.js
const express = require('express');
const router = express.Router();

// 提交分數
router.post('/leaderboard', async (req, res) => {
  try {
    const { playerName, score, distance, timestamp } = req.body;

    // 驗證輸入
    if (!playerName || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 儲存到資料庫
    await db.leaderboard.create({
      playerName,
      score,
      distance,
      timestamp,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 獲取排行榜
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const entries = await db.leaderboard.findAll({
      order: [['score', 'DESC']],
      limit,
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## <a name="性能優化"></a>⚡ 性能優化建議

### 1. 減少 Draw Calls

```typescript
// src/scenes/GameScene.ts
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

// 合併地面段落
private mergeGroundSegments(): void {
  const geometries: THREE.BufferGeometry[] = [];

  this.segments.forEach(segment => {
    segment.traverse(child => {
      if (child instanceof THREE.Mesh && child.name === 'ground') {
        geometries.push(child.geometry);
      }
    });
  });

  const mergedGeometry = mergeBufferGeometries(geometries);
  const mergedMesh = new THREE.Mesh(mergedGeometry, groundMaterial);
  this.scene.add(mergedMesh);
}
```

### 2. 使用 Instancing

```typescript
// 對於大量相同物件（如金幣）
import { InstancedMesh } from 'three';

const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
const instancedCoins = new InstancedMesh(coinGeometry, coinMaterial, 100);

// 設置每個實例的位置
const matrix = new THREE.Matrix4();
for (let i = 0; i < 100; i++) {
  matrix.setPosition(x, y, z);
  instancedCoins.setMatrixAt(i, matrix);
}
```

### 3. LOD (Level of Detail)

```typescript
import { LOD } from 'three';

const lod = new LOD();

// 高細節模型（近距離）
const highDetail = createHighDetailCat();
lod.addLevel(highDetail, 0);

// 中細節模型（中距離）
const mediumDetail = createMediumDetailCat();
lod.addLevel(mediumDetail, 20);

// 低細節模型（遠距離）
const lowDetail = createLowDetailCat();
lod.addLevel(lowDetail, 50);

scene.add(lod);
```

### 4. 紋理優化

```typescript
// 使用紋理壓縮
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('path/to/basis/');
ktx2Loader.detectSupport(renderer);

ktx2Loader.load('texture.ktx2', (texture) => {
  material.map = texture;
});
```

### 5. 性能監控

```typescript
// src/utils/PerformanceMonitor.ts
export class PerformanceMonitor {
  private stats: any;

  constructor() {
    // 可選：使用 stats.js 監控 FPS
    if (import.meta.env.DEV) {
      import('stats.js').then(Stats => {
        this.stats = new Stats.default();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        document.body.appendChild(this.stats.dom);
      });
    }
  }

  begin(): void {
    this.stats?.begin();
  }

  end(): void {
    this.stats?.end();
  }
}

// 在 Game.ts 中使用
private gameLoop = (): void => {
  this.performanceMonitor.begin();

  // ... 遊戲邏輯

  this.performanceMonitor.end();
  this.animationFrameId = requestAnimationFrame(this.gameLoop);
};
```

---

## 🔍 除錯技巧 / Debugging Tips

### 1. 啟用 Three.js 輔助工具

```typescript
// src/scenes/GameScene.ts
if (import.meta.env.DEV) {
  // 軸輔助
  const axesHelper = new THREE.AxesHelper(5);
  this.scene.add(axesHelper);

  // 格線輔助
  const gridHelper = new THREE.GridHelper(50, 50);
  this.scene.add(gridHelper);

  // 碰撞盒輔助
  const boxHelper = new THREE.BoxHelper(this.player.mesh, 0xff0000);
  this.scene.add(boxHelper);
}
```

### 2. 控制台日誌

```typescript
// 在關鍵位置添加日誌
console.log('[Collision] Hit obstacle at lane', lane);
console.log('[Score] Current score:', this.stats.score);
console.log('[LevelGen] Generated segment:', config);
```

### 3. 使用瀏覽器開發工具

- **Performance Tab**: 分析性能瓶頸
- **Memory Tab**: 檢測記憶體洩漏
- **Network Tab**: 檢查資源載入

---

## 📚 進階主題 / Advanced Topics

### 粒子效果系統

```typescript
// src/effects/ParticleSystem.ts
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute } from 'three';

export class ParticleSystem {
  createCoinCollectEffect(position: THREE.Vector3): Points {
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = position.y + Math.random() * 2;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xffd700,
      size: 0.2,
      transparent: true,
    });

    return new Points(geometry, material);
  }
}
```

### 後處理效果

```typescript
// 添加 bloom 效果
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// 在渲染時使用
composer.render();
```

---

**祝開發順利！ / Happy Developing! 🚀**

如有任何問題，請參考：
- [README.md](./README.md) - 專案概述
- [QUICKSTART.md](./QUICKSTART.md) - 快速開始
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 專案總結

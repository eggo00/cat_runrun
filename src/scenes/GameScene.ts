import * as THREE from 'three';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { LevelGenerator } from '../systems/LevelGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ObjectPool } from '../utils/ObjectPool';
import { GAME_CONFIG, COLORS, ObstacleType, CollectibleType } from '../utils/Constants';
import { SegmentConfig } from '../types';

export class GameScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  private player: Player;
  private levelGenerator: LevelGenerator;

  // Object pools
  private obstaclePoolsMap: Map<ObstacleType, ObjectPool<Obstacle>> = new Map();
  private collectiblePoolsMap: Map<CollectibleType, ObjectPool<Collectible>> = new Map();

  // World scrolling
  private worldGroup: THREE.Group;
  private segments: THREE.Group[] = [];
  private currentSpeed: number = GAME_CONFIG.BASE_SPEED;
  private distanceTraveled: number = 0;

  // Callbacks
  private onCollision?: (type: 'obstacle' | 'collectible', object: any) => void;

  constructor(container: HTMLElement) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SKY_TOP);
    this.scene.fog = new THREE.Fog(COLORS.SKY_BOTTOM, 50, 100);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONFIG.CAMERA_NEAR,
      GAME_CONFIG.CAMERA_FAR
    );

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = GAME_CONFIG.ENABLE_SHADOWS;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Setup lights
    this.setupLights();

    // Create world group (for scrolling)
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Create player
    this.player = new Player(this.scene);

    // Position camera
    this.updateCamera();

    // Initialize level generator
    this.levelGenerator = new LevelGenerator();

    // Initialize object pools
    this.initializeObjectPools();

    // Generate initial segments
    this.generateInitialSegments();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLights(): void {
    // Hemisphere light for ambient lighting
    const hemiLight = new THREE.HemisphereLight(COLORS.SKY_TOP, COLORS.GROUND, 0.6);
    this.scene.add(hemiLight);

    // Directional light for shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = GAME_CONFIG.ENABLE_SHADOWS;

    if (GAME_CONFIG.ENABLE_SHADOWS) {
      dirLight.shadow.camera.left = -20;
      dirLight.shadow.camera.right = 20;
      dirLight.shadow.camera.top = 20;
      dirLight.shadow.camera.bottom = -20;
      dirLight.shadow.mapSize.width = GAME_CONFIG.SHADOW_MAP_SIZE;
      dirLight.shadow.mapSize.height = GAME_CONFIG.SHADOW_MAP_SIZE;
    }

    this.scene.add(dirLight);
  }

  private initializeObjectPools(): void {
    // Initialize obstacle pools
    Object.values(ObstacleType).forEach(type => {
      const pool = new ObjectPool<Obstacle>(
        () => {
          const obstacle = new Obstacle(type);
          this.worldGroup.add(obstacle.mesh);
          return obstacle;
        },
        5,
        GAME_CONFIG.MAX_POOL_SIZE
      );
      this.obstaclePoolsMap.set(type, pool);
    });

    // Initialize collectible pools
    Object.values(CollectibleType).forEach(type => {
      const pool = new ObjectPool<Collectible>(
        () => {
          const collectible = new Collectible(type);
          this.worldGroup.add(collectible.mesh);
          return collectible;
        },
        5,
        GAME_CONFIG.MAX_POOL_SIZE
      );
      this.collectiblePoolsMap.set(type, pool);
    });
  }

  private generateInitialSegments(): void {
    for (let i = 0; i < GAME_CONFIG.INITIAL_SEGMENTS; i++) {
      this.generateSegment(i * GAME_CONFIG.SEGMENT_LENGTH);
    }
  }

  private generateSegment(zPosition: number): void {
    const segment = new THREE.Group();
    segment.position.z = zPosition;

    // Create ground for this segment
    const groundGeometry = new THREE.PlaneGeometry(
      GAME_CONFIG.LANE_WIDTH * GAME_CONFIG.LANE_COUNT + 2,
      GAME_CONFIG.SEGMENT_LENGTH
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.GROUND,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = GAME_CONFIG.SEGMENT_LENGTH / 2;
    ground.receiveShadow = GAME_CONFIG.ENABLE_SHADOWS;
    segment.add(ground);

    // Add lane markers
    for (let i = 0; i <= GAME_CONFIG.LANE_COUNT; i++) {
      const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, GAME_CONFIG.SEGMENT_LENGTH);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.x = -GAME_CONFIG.LANE_WIDTH * GAME_CONFIG.LANE_COUNT / 2 + i * GAME_CONFIG.LANE_WIDTH;
      line.position.z = GAME_CONFIG.SEGMENT_LENGTH / 2;
      segment.add(line);
    }

    // Generate segment content
    const config = this.levelGenerator.generateSegment();
    this.populateSegment(segment, config);

    this.worldGroup.add(segment);
    this.segments.push(segment);
  }

  private populateSegment(segment: THREE.Group, config: SegmentConfig): void {
    const baseZ = segment.position.z;

    // Add obstacles
    config.obstacles.forEach(obstacleConfig => {
      const pool = this.obstaclePoolsMap.get(obstacleConfig.type);
      if (pool) {
        const obstacle = pool.acquire();
        obstacle.initialize(obstacleConfig.lane, baseZ + obstacleConfig.position);
      }
    });

    // Add collectibles
    config.collectibles.forEach(collectibleConfig => {
      const pool = this.collectiblePoolsMap.get(collectibleConfig.type);
      if (pool) {
        const collectible = pool.acquire();
        collectible.initialize(collectibleConfig.lane, baseZ + collectibleConfig.position);
      }
    });
  }

  /**
   * Update game scene
   */
  update(deltaTime: number): void {
    // Update player
    this.player.update(deltaTime);

    // Update world scrolling
    this.updateWorldScroll(deltaTime);

    // Update all pooled objects
    this.obstaclePoolsMap.forEach(pool => pool.updateActive(deltaTime));
    this.collectiblePoolsMap.forEach(pool => pool.updateActive(deltaTime));

    // Check collisions
    this.checkCollisions();

    // Update camera
    this.updateCamera();
  }

  private updateWorldScroll(deltaTime: number): void {
    // Move world backward (player moves forward)
    const scrollAmount = this.currentSpeed * deltaTime;
    this.worldGroup.position.z -= scrollAmount;
    this.distanceTraveled += scrollAmount;

    // Check if we need to generate new segments
    const playerZ = this.player.position.z - this.worldGroup.position.z;
    const farthestSegmentZ = this.segments[this.segments.length - 1]?.position.z || 0;

    if (farthestSegmentZ - playerZ < GAME_CONFIG.SEGMENTS_AHEAD * GAME_CONFIG.SEGMENT_LENGTH) {
      this.generateSegment(farthestSegmentZ + GAME_CONFIG.SEGMENT_LENGTH);
    }

    // Remove old segments that are behind the player
    while (this.segments.length > 0) {
      const oldestSegment = this.segments[0];
      if (oldestSegment.position.z < playerZ - GAME_CONFIG.SEGMENT_LENGTH * 2) {
        this.worldGroup.remove(oldestSegment);
        this.segments.shift();

        // Dispose segment
        oldestSegment.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      } else {
        break;
      }
    }

    // Release pooled objects that are too far behind
    this.releaseOldPooledObjects(playerZ);
  }

  private releaseOldPooledObjects(playerZ: number): void {
    this.obstaclePoolsMap.forEach(pool => {
      pool.getActive().forEach(obstacle => {
        if (obstacle.position.z < playerZ - GAME_CONFIG.SEGMENT_LENGTH) {
          pool.release(obstacle);
        }
      });
    });

    this.collectiblePoolsMap.forEach(pool => {
      pool.getActive().forEach(collectible => {
        if (collectible.position.z < playerZ - GAME_CONFIG.SEGMENT_LENGTH) {
          pool.release(collectible);
        }
      });
    });
  }

  private checkCollisions(): void {
    const playerLane = this.player.getLane();
    const playerZ = this.player.position.z;

    // Check obstacle collisions
    this.obstaclePoolsMap.forEach(pool => {
      pool.getActive().forEach(obstacle => {
        if (CollisionSystem.checkLaneCollision(playerLane, playerZ, obstacle.getLane(), obstacle.position.z)) {
          if (CollisionSystem.checkSphereCollision(this.player, obstacle)) {
            this.onCollision?.('obstacle', obstacle);
            pool.release(obstacle);
          }
        }
      });
    });

    // Check collectible collisions
    this.collectiblePoolsMap.forEach(pool => {
      pool.getActive().forEach(collectible => {
        if (CollisionSystem.checkLaneCollision(playerLane, playerZ, collectible.getLane(), collectible.position.z, 2)) {
          if (CollisionSystem.checkSphereCollision(this.player, collectible)) {
            this.onCollision?.('collectible', collectible);
            pool.release(collectible);
          }
        }
      });
    });
  }

  private updateCamera(): void {
    // Follow player with offset
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + GAME_CONFIG.CAMERA_OFFSET_Y;
    this.camera.position.z = this.player.position.z + GAME_CONFIG.CAMERA_OFFSET_Z;

    // Look ahead of player
    this.camera.lookAt(
      this.player.position.x,
      this.player.position.y + 1,
      this.player.position.z + GAME_CONFIG.CAMERA_LOOK_AHEAD
    );
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Set game speed
   */
  setSpeed(speed: number): void {
    this.currentSpeed = speed;
  }

  /**
   * Get player
   */
  getPlayer(): Player {
    return this.player;
  }

  /**
   * Set collision callback
   */
  setCollisionCallback(callback: (type: 'obstacle' | 'collectible', object: any) => void): void {
    this.onCollision = callback;
  }

  /**
   * Render scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Reset scene
   */
  reset(): void {
    // Reset player
    this.player.reset();

    // Clear all pooled objects
    this.obstaclePoolsMap.forEach(pool => pool.releaseAll());
    this.collectiblePoolsMap.forEach(pool => pool.releaseAll());

    // Remove all segments
    this.segments.forEach(segment => {
      this.worldGroup.remove(segment);
    });
    this.segments = [];

    // Reset world position
    this.worldGroup.position.set(0, 0, 0);
    this.distanceTraveled = 0;

    // Reset level generator
    this.levelGenerator.reset();

    // Generate initial segments
    this.generateInitialSegments();

    // Reset speed
    this.currentSpeed = GAME_CONFIG.BASE_SPEED;
  }

  /**
   * Dispose of scene resources
   */
  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    this.player.dispose();
    this.obstaclePoolsMap.forEach(pool => pool.dispose());
    this.collectiblePoolsMap.forEach(pool => pool.dispose());

    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}

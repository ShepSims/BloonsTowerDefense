// Define a waypoint with absolute coordinates
export type Waypoint = { x: number; y: number };

// Define a level as a series of waypoints (as percentages) and a list of mob spawns.
export type LevelDefinition = {
  // The percentages will be converted to absolute waypoints in the game board.
  percentages: { x: number; y: number }[];
  // Each mob spawns at a given time (ms from level start). For now, only "balloon" mobs.
  mobs: MobDefinition[];
};

// Define a mob (for now, always a balloon)
export interface MobDefinition {
  type: "balloon";
  spawnTime: number; // time in ms when this mob should appear
  health: number;
  speed: number;
};

// New level percentage definitions:
export const levelPercentages: { [key: number]: { x: number; y: number }[] } = {
  // Level 1: A very long course that snakes back and forth before exiting.
  1: [
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.3 },
    { x: 0.1, y: 0.3 },
    { x: 0.1, y: 0.5 },
    { x: 0.9, y: 0.5 },
    { x: 0.9, y: 0.7 },
    { x: 0.1, y: 0.7 },
    { x: 0.1, y: 0.9 },
    { x: 0.9, y: 0.9 },
    { x: 1.0, y: 0.9 }, // Exit off-screen to the right.
  ],
  // Level 2: A long horizontal course with slight vertical oscillation.
  2: [
    { x: 0.1, y: 0.5 },
    { x: 0.9, y: 0.5 },
    { x: 0.9, y: 0.52 },
    { x: 0.1, y: 0.52 },
    { x: 0.1, y: 0.54 },
    { x: 0.9, y: 0.54 },
    { x: 0.9, y: 0.56 },
    { x: 0.1, y: 0.56 },
    { x: 0.1, y: 0.58 },
    { x: 0.9, y: 0.58 },
    { x: 1.0, y: 0.58 },
  ],
  // Level 3: A slightly shorter, simpler course.
  3: [
    { x: 0.2, y: 0.4 },
    { x: 0.8, y: 0.4 },
    { x: 0.8, y: 0.6 },
    { x: 0.2, y: 0.6 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
    { x: 1.0, y: 0.8 },
  ],
};

// Define full level definitions that include mob spawns.
// (Mobs can be left unchanged or adjusted as needed.)
export const levelDefinitions: { [key: number]: LevelDefinition } = {
  1: {
    percentages: levelPercentages[1],
    mobs: [
      { type: "balloon", spawnTime: 1000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 2000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 3000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 4000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 5000, health: 1, speed: 2 },
    ],
  },
  2: {
    percentages: levelPercentages[2],
    mobs: [
      { type: "balloon", spawnTime: 1000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 1500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 2000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 2500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 3000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 3500, health: 1, speed: 2 },
    ],
  },
  3: {
    percentages: levelPercentages[3],
    mobs: [
      { type: "balloon", spawnTime: 500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 1000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 1500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 2000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 2500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 3000, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 3500, health: 1, speed: 2 },
      { type: "balloon", spawnTime: 4000, health: 1, speed: 2 },
    ],
  },
};

// Set the current level (1, 2, or 3)
export let currentLevel: number = 1;
// Helper: Given screen dimensions, convert the current level’s percentages to absolute waypoints.
export const getLevelWaypoints = (level: number, width: number, height: number): Waypoint[] => {
  const percentages = levelDefinitions[level]?.percentages;
  if (!percentages) return [];
  return percentages.map(p => ({
    x: p.x * width,
    y: p.y * height,
  }));
};


// Define BalloonType (our mob) with additional health.
export type BalloonType = { 
  x: number; 
  y: number; 
  speed: number; 
  path: Waypoint[];
  currentWaypointIndex: number;
  health: number;
};

// TowerType, ProjectileType, and upgrade types remain the same.
export interface UpgradeTracks {
  range?: number;
  fireSpeed?: number;
  piercing?: number;
}

export type TowerType = {
  id: number;
  x: number;
  y: number;
  range: number; // Detection/shooting range
  fireRate: number;
  projectileSpeed: number;
  piercing: number;
  cost: number;
  upgradeTracks?: UpgradeTracks;
  nextShot?: number;
  showRangeOverlay?: boolean; // NEW: indicates if the range overlay should be drawn
};

export type ProjectileType = { 
  x: number; 
  y: number; 
  dx: number; 
  dy: number; 
};

// Updated moveBalloons: Moves balloons along the computed path.
// Returns an object with the new balloons array and a count of how many exited.
export const moveBalloons = (balloons: BalloonType[]): { newBalloons: BalloonType[]; exited: number } => {
  let exited = 0;
  const newBalloons = balloons
    .map(b => {
      const target = b.path[b.currentWaypointIndex];
      if (!target) return b;
      const dx = target.x - b.x;
      const dy = target.y - b.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 5) {
        // Advance to next waypoint.
        return { ...b, x: target.x, y: target.y, currentWaypointIndex: b.currentWaypointIndex + 1 };
      }
      const ratio = b.speed / distance;
      return { ...b, x: b.x + dx * ratio, y: b.y + dy * ratio };
    })
    .filter(b => {
      if (b.currentWaypointIndex >= b.path.length) {
        exited++;
        return false;
      }
      return true;
    });
  return { newBalloons, exited };
};

// Projectile logic remains unchanged.

export const shootProjectiles = (
  towers: TowerType[],
  balloons: BalloonType[],
  projectiles: ProjectileType[],
  currentTime: number,
): ProjectileType[] => {
  towers.forEach(tower => {
    // Only shoot if it's time (or if nextShot is undefined)
    if (!tower.nextShot || tower.nextShot <= currentTime) {
      // Look for a target.
      balloons.forEach(balloon => {
        const distance = Math.hypot(balloon.x - tower.x, balloon.y - tower.y);
        if (distance < tower.range && !projectiles.some(p => Math.hypot(p.x - tower.x, p.y - tower.y) < 20)) {
          projectiles.push({
            x: tower.x,
            y: tower.y,
            dx: (balloon.x - tower.x) / 10,
            dy: (balloon.y - tower.y) / 10,
          });
        }
      });
      // Set next shot time (cooldown in ms = 1000/fireRate)
      tower.nextShot = currentTime + (1000 / tower.fireRate);
    }
  });
  return projectiles.map(p => ({ ...p, x: p.x + p.dx, y: p.y + p.dy }));
};
// Updated checkCollisions: Accepts an optional callback to call when a balloon is popped.
export const checkCollisions = (
  projectiles: ProjectileType[],
  balloons: BalloonType[],
  setBalloons: React.Dispatch<React.SetStateAction<BalloonType[]>>,
  onBalloonPopped?: () => void
) => {
  return projectiles.filter(projectile => {
    const collisionIndex = balloons.findIndex(
      balloon => Math.hypot(projectile.x - balloon.x, projectile.y - balloon.y) < 15,
    );
    if (collisionIndex >= 0) {
      balloons.splice(collisionIndex, 1);
      setBalloons([...balloons]);
      if (onBalloonPopped) onBalloonPopped();
      return false;
    }
    return true;
  });
};


export const createTower = (x: number, y: number): TowerType => ({
  id: Date.now(),
  x,
  y,
  projectileSpeed: 10,
  fireRate: 1, // Base: 1 shot per second
  range: 150,
  piercing: 0,
  cost: 100,
  upgradeTracks: {
    range: 0,
    fireSpeed: 0,
    piercing: 0,
  },
  nextShot: 0,
});
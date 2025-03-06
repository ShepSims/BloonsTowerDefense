// GameBoard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import Tower from '@/app/(game)/components/Tower';
import Balloon from '@/app/(game)/components/Baloon';
import Projectile from '@/app/(game)/components/Projectile';
import UpgradeModal from '@/app/(game)/components/UpgradeModal';
import {
  moveBalloons,
  shootProjectiles,
  checkCollisions,
  BalloonType,
  TowerType,
  ProjectileType,
  createTower,
  getLevelWaypoints,
  levelDefinitions,
} from '@/app/(game)/_utils/gameLogic';

export default function GameBoard() {
  // Dimensions from layout.
  const [dimensions, setDimensions] = useState({ width: 375, height: 667 });
  // Game state.
  const [balloons, setBalloons] = useState<BalloonType[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileType[]>([]);
  const [towers, setTowers] = useState<TowerType[]>([]);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [placingTower, setPlacingTower] = useState(false);
  const [lives, setLives] = useState<number>(50);
  const [money, setMoney] = useState<number>(500);

  // Control whether the game is running.
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Local level state; levels are defined in levelDefinitions.
  const [level, setLevel] = useState<number>(1);
  // For UI display of elapsed time (ms)
  const [uiElapsedTime, setUiElapsedTime] = useState<number>(0);
  // Level complete flag (shows modal for reset/next level)
  const [levelComplete, setLevelComplete] = useState<boolean>(false);

  // Refs for internal timing without triggering re-renders.
  const elapsedTimeRef = useRef<number>(0);
  const nextMobIndexRef = useRef<number>(0);
  // Keep latest towers in a ref.
  const towersRef = useRef<TowerType[]>(towers);
  useEffect(() => {
    towersRef.current = towers;
  }, [towers]);

  // Get current level definition and absolute waypoints.
  const currentLevelDef = levelDefinitions[level];
  const levelWaypoints = getLevelWaypoints(level, dimensions.width, dimensions.height);

  // onLayout callback for dimensions.
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    console.log("onLayout dimensions:", { width, height });
  };

  // Game loop runs only when isRunning is true.
  useEffect(() => {
    if (!isRunning || !dimensions.width || !dimensions.height || !currentLevelDef) return;

    const intervalId = setInterval(() => {
      // Increase elapsed time.
      elapsedTimeRef.current += 50;
      setUiElapsedTime(elapsedTimeRef.current);

      // Spawn scheduled mobs and move active balloons.
      setBalloons(prevBalloons => {
        let newBalloons = [...prevBalloons];
        // Spawn mobs while the next mob's spawnTime has elapsed.
        while (
          nextMobIndexRef.current < currentLevelDef.mobs.length &&
          currentLevelDef.mobs[nextMobIndexRef.current].spawnTime <= elapsedTimeRef.current
        ) {
          const mob = currentLevelDef.mobs[nextMobIndexRef.current];
          newBalloons.push({
            x: levelWaypoints[0].x,
            y: levelWaypoints[0].y,
            speed: mob.speed,
            path: levelWaypoints,
            currentWaypointIndex: 1,
            health: mob.health,
          });
          nextMobIndexRef.current++;
        }
        // Move balloons along their path.
        const { newBalloons: movedBalloons, exited } = moveBalloons(newBalloons);
        if (exited > 0) {
          setLives(prev => Math.max(0, prev - exited));
        }
        return movedBalloons;
      });

      // Update projectiles.
      setProjectiles(prevProjectiles =>
        shootProjectiles(towersRef.current, balloons, prevProjectiles, uiElapsedTime)
      );
      setProjectiles(prevProjectiles =>
        checkCollisions(prevProjectiles, balloons, setBalloons, () => setMoney(prev => prev + 1))
      );

      // Check level completion: all mobs spawned and no active balloons.
      if (
        nextMobIndexRef.current >= currentLevelDef.mobs.length &&
        balloons.length === 0 &&
        elapsedTimeRef.current > currentLevelDef.mobs[currentLevelDef.mobs.length - 1].spawnTime
      ) {
        setLevelComplete(true);
        setIsRunning(false);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [isRunning, dimensions, currentLevelDef, balloons]);

  // Resets the current level state.
  const resetLevel = () => {
    // Reset refs and state.
    elapsedTimeRef.current = 0;
    nextMobIndexRef.current = 0;
    setUiElapsedTime(0);
    setBalloons([]);
    setProjectiles([]);
    setLevelComplete(false);
    setIsRunning(false);
  };

  // Advances to the next level.
    const nextLevel = () => {
      // Reset internal timers and game state.
      resetLevel();
      // Clear all towers.
      setTowers([]);
      // Reset money.
      setMoney(500);
      // Advance level (looping back if needed).
      setLevel(prev => (prev < Object.keys(levelDefinitions).length ? prev + 1 : 1));
    };
    

  // Render the level complete modal.
  const renderLevelCompleteModal = () => (
    <Modal transparent visible={levelComplete} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Level Complete!</Text>
          <TouchableOpacity style={styles.buyButton} onPress={resetLevel}>
            <Text style={styles.buyButtonText}>Reset Level</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={nextLevel}>
            <Text style={styles.buyButtonText}>Next Level</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {/* Status overlay */}
      <View style={styles.statusOverlay}>
  <Text style={styles.statusText}>Lives: {lives}</Text>
  <Text style={styles.statusText}>Level: {level}</Text>
  <Text style={styles.statusText}>Time: {uiElapsedTime} ms</Text>
  <Text style={styles.statusText}>Money: ${money}</Text>
</View>


      {/* Start/Pause button */}
      <TouchableOpacity
        style={styles.startPauseButton}
        onPress={() => setIsRunning(prev => !prev)}
      >
        <Text style={styles.startPauseButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shopButton} onPress={() => setShopVisible(true)}>
        <Text style={styles.shopButtonText}>Shop</Text>
      </TouchableOpacity>

      <Svg width={dimensions.width} height={dimensions.height}>
        {/* Render the course path */}
        <Polyline
          points={levelWaypoints.map(p => `${p.x},${p.y}`).join(' ')}
          stroke="#00FF00"
          strokeWidth={3}
          fill="none"
        />
        {towers.map((tower, i) => (
          <Tower
            key={`tower-${i}`}
            {...tower}
            onPress={() => {
              // Immediately update the tower to show its range overlay.
              const preview = { ...tower, showRangeOverlay: true };
              setTowers(towers.map(t => (t.id === tower.id ? preview : t)));
              setSelectedTower(preview);
              setModalVisible(true);
            }}
          />
        ))}
        {balloons.map((balloon, i) => (
          <Balloon key={`balloon-${i}`} {...balloon} />
        ))}
        {projectiles.map((proj, i) => (
          <Projectile key={`proj-${i}`} {...proj} />
        ))}
      </Svg>

      {renderLevelCompleteModal()}

      <UpgradeModal
  tower={selectedTower}
  visible={modalVisible}
  onClose={() => {setModalVisible(false);    setTowers(towers.map(t => t.id === selectedTower?.id ? { ...t, showRangeOverlay: false } : t));
}}
  onUpgrade={newTower => {
    setTowers(towers.map(t => (t.id === selectedTower?.id ? newTower : t)));
  }}
  onSell={(towerToSell) => {
    setTowers(towers.filter(t => t.id !== towerToSell.id));
    const refund = Math.floor(towerToSell.cost * 0.75);
    setMoney(prev => prev + refund);
    setSelectedTower(null);
    setModalVisible(false);
  }}
  money={money}
  setMoney={setMoney}
  onPreview={(previewTower) => {
    setTowers(towers.map(t => (t.id === selectedTower?.id ? previewTower : t)));
  }}
  onCancelPreview={(originalTower) => {
    setTowers(towers.map(t => (t.id === selectedTower?.id ? originalTower : t)));
  }}
/>


      <Modal transparent visible={shopVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tower Shop</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => {
                setPlacingTower(true);
                setShopVisible(false);
              }}
            >
              <Text style={styles.buyButtonText}>Buy Tower ($100)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShopVisible(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {placingTower && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.placementOverlay}
          onPress={(event: any) => {
            const { locationX, locationY } = event.nativeEvent;
            const newTower = createTower(locationX, locationY);
            setTowers([...towers, newTower]);
            setPlacingTower(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  startPauseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 30,
    padding: 10,
    backgroundColor: '#0a472e',
    borderRadius: 8,
  },
  startPauseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 20,
    padding: 15,
    backgroundColor: '#8b4513',
    borderRadius: 50,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buyButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#0a472e',
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
  },
  placementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});

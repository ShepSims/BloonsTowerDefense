import React from 'react';
import { Circle, G } from 'react-native-svg';
import { TowerType } from '../_utils/gameLogic';

interface Props extends TowerType {
  onPress?: () => void;
  showRangeOverlay?: boolean;
}

const getFillColor = (fireSpeedLevel: number = 0) => {
  return fireSpeedLevel > 0 ? "#cd853f" : "#8b4513";
};

export default function Tower({ x, y, range, upgradeTracks, onPress, showRangeOverlay }: Props) {
  const rangeLevel = upgradeTracks?.range || 0;
  const fireSpeedLevel = upgradeTracks?.fireSpeed || 0;
  const piercingLevel = upgradeTracks?.piercing || 0;
  
  return (
    <G onPress={onPress}>
      {showRangeOverlay && (
        <Circle 
          cx={x} 
          cy={y} 
          r={range} 
          fill="rgba(211,211,211,1)" 
          stroke="gray"
          strokeDasharray="4,2"
        />
      )}
      {rangeLevel > 0 && (
        <Circle 
          cx={x} 
          cy={y} 
          r={15 + rangeLevel * 10} 
          fill="none" 
          stroke="rgba(255,215,0,0.5)" 
          strokeWidth={2}
        />
      )}
      <Circle 
        cx={x} 
        cy={y} 
        r={15} 
        fill={getFillColor(fireSpeedLevel)} 
        stroke={piercingLevel > 0 ? "#ff4500" : "#000"} 
        strokeWidth={piercingLevel > 0 ? 3 : 1}
      />
    </G>
  );
}

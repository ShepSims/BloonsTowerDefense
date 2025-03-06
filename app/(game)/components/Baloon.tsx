import React from 'react';
import { Circle } from 'react-native-svg';
import { BalloonType } from '../_utils/gameLogic';

export default function Balloon({ x, y, health }: BalloonType) {
  const fillColor = health === 2 ? "#0000FF" : "#ff5555"; // Blue if 2 health, red if 1.
  return <Circle cx={x} cy={y} r={10} fill={fillColor} />;
}
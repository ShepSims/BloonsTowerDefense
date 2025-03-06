import React from 'react';
import { Circle } from 'react-native-svg';
import { BalloonType } from '../_utils/gameLogic';

export default function Balloon({ x, y }: BalloonType) {
  return <Circle cx={x} cy={y} r={10} fill="#ff5555" />;
}

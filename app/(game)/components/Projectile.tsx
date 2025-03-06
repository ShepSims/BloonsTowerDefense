import React from 'react';
import { Circle } from 'react-native-svg';
import { ProjectileType } from '../_utils/gameLogic';

export default function Projectile({ x, y }: ProjectileType) {
  return <Circle cx={x} cy={y} r={4} fill="#ffffff" />;
}

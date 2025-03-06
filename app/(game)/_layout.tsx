import React from 'react';
import { SafeAreaView } from 'react-native';
import GameBoard from './components/GameBoard';

export default function GameScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#113a1f' }}>
      <GameBoard />
    </SafeAreaView>
  );
}

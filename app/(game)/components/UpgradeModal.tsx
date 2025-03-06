import React, { useState, useEffect } from 'react';
import { View, Modal, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TowerType } from '../_utils/gameLogic';

const baseCosts = {
  range: 50,
  fireSpeed: 75,
  piercing: 100,
};

function getUpgradeCost(tower: TowerType, type: 'range' | 'fireSpeed' | 'piercing'): number {
  const level = tower.upgradeTracks?.[type] || 0;
  return baseCosts[type] * (level + 1);
}

function getPreviewTower(tower: TowerType, type: 'range' | 'fireSpeed' | 'piercing'): TowerType {
  switch (type) {
    case 'range':
      return {
        ...tower,
        range: tower.range + 20, // Increase range by 20 per upgrade
        cost: tower.cost + getUpgradeCost(tower, 'range'),
        upgradeTracks: {
          ...tower.upgradeTracks,
          range: (tower.upgradeTracks?.range || 0) + 1,
        },
        showRangeOverlay: true, // Set flag so that Tower shows overlay
      };
    case 'fireSpeed':
      return {
        ...tower,
        projectileSpeed: tower.projectileSpeed + 2,
        fireRate: tower.fireRate + 0.2,
        cost: tower.cost + getUpgradeCost(tower, 'fireSpeed'),
        upgradeTracks: {
          ...tower.upgradeTracks,
          fireSpeed: (tower.upgradeTracks?.fireSpeed || 0) + 1,
        },
      };
    case 'piercing':
      return {
        ...tower,
        piercing: tower.piercing + 1,
        cost: tower.cost + getUpgradeCost(tower, 'piercing'),
        upgradeTracks: {
          ...tower.upgradeTracks,
          piercing: (tower.upgradeTracks?.piercing || 0) + 1,
        },
      };
    default:
      return tower;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (tower: TowerType) => void;
  onSell: (tower: TowerType) => void;
  tower: TowerType | null;
  money: number;
  setMoney: (money: number) => void;
  onPreview: (previewTower: TowerType) => void;
  onCancelPreview: (originalTower: TowerType) => void;
}

export default function UpgradeModal({
  visible,
  onClose,
  onUpgrade,
  onSell,
  tower,
  money,
  setMoney,
  onPreview,
  onCancelPreview,
}: Props) {
  // Store the original tower when modal opens.
  const [originalTower, setOriginalTower] = useState<TowerType | null>(null);
  // Store the current preview tower.
  const [previewTower, setPreviewTower] = useState<TowerType | null>(null);
  // The currently selected upgrade type.
  const [selectedUpgrade, setSelectedUpgrade] = useState<'range' | 'fireSpeed' | 'piercing' | null>(null);

  useEffect(() => {
    if (tower) {
      setOriginalTower(tower);
      setPreviewTower(tower);
      setSelectedUpgrade(null);
    }
  }, [tower]);

  if (!tower || !originalTower || !previewTower) return null;

  const upgradeCost = selectedUpgrade ? getUpgradeCost(originalTower, selectedUpgrade) : 0;

  // When an upgrade option is selected, update previewTower and call onPreview.
  const handlePreview = (upgradeType: 'range' | 'fireSpeed' | 'piercing') => {
    setSelectedUpgrade(upgradeType);
    const newPreview = getPreviewTower(previewTower, upgradeType);
    setPreviewTower(newPreview);
    onPreview(newPreview);
  };

  // When purchasing an upgrade, commit previewTower and then compute the next preview.
  const purchaseUpgrade = () => {
    if (!selectedUpgrade) return;
    if (money >= upgradeCost) {
      const newTower = getPreviewTower(originalTower, selectedUpgrade);
      onUpgrade(newTower);
      setMoney(money - upgradeCost);
      // Update originalTower to the committed tower.
      setOriginalTower(newTower);
      // Compute next preview so that preview remains active.
      const nextPreview = getPreviewTower(newTower, selectedUpgrade);
      setPreviewTower(nextPreview);
      onPreview(nextPreview);
    } else {
      Alert.alert("Insufficient Funds", "You don't have enough money for this upgrade!");
    }
  };

  // Cancel preview: revert the tower on the game board to originalTower.
  const cancelPreview = () => {
    onCancelPreview(originalTower);
    setPreviewTower(originalTower);
    setSelectedUpgrade(null);
  };

  // When closing the modal, ensure we revert any preview (i.e. remove overlays).
  const handleClose = () => {
    cancelPreview();
    onClose();
  };

  const sellTowerHandler = () => {
    const refund = Math.floor(tower.cost * 0.75);
    Alert.alert("Sell Tower", `Sell this tower for $${refund}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Sell", onPress: () => { onSell(tower); setMoney(money + refund); onClose(); } }
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.bottomModal}>
          {selectedUpgrade ? (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>
                {selectedUpgrade.charAt(0).toUpperCase() + selectedUpgrade.slice(1)} Preview Active on Game Board
              </Text>
              <Text style={styles.costText}>Cost: ${upgradeCost}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.purchaseButton} onPress={purchaseUpgrade}>
                  <Text style={styles.buttonText}>Purchase Upgrade</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelPreview}>
                  <Text style={styles.buttonText}>Cancel Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.fullSection}>
              <Text style={styles.modalTitle}>Upgrade Tower</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.optionButton} onPress={() => handlePreview('range')}>
                  <Text style={styles.optionText}>Range</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton} onPress={() => handlePreview('fireSpeed')}>
                  <Text style={styles.optionText}>Fire Speed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton} onPress={() => handlePreview('piercing')}>
                  <Text style={styles.optionText}>Piercing</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sellRow}>
                <TouchableOpacity style={styles.sellButton} onPress={sellTowerHandler}>
                  <Text style={styles.sellButtonText}>Sell Tower</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  fullSection: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: '#0a472e',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  optionText: {
    color: '#fff',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeText: {
    color: '#0a472e',
    fontWeight: 'bold',
  },
  previewSection: {
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  costText: {
    fontSize: 16,
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  purchaseButton: {
    backgroundColor: '#228B22',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#8b0000',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  sellRow: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  sellButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

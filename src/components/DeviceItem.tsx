import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import type { ScaleDevice } from '../types';

interface DeviceItemProps {
  device: ScaleDevice;
  onPress: (device: ScaleDevice) => void;
  isConnecting: boolean;
}

export function DeviceItem({ device, onPress, isConnecting }: DeviceItemProps) {
  const signalStrength = getSignalStrength(device.rssi);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(device)}
      disabled={isConnecting}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>&#x2696;</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{device.name || 'Bilancia sconosciuta'}</Text>
        <Text style={styles.id}>{device.id.slice(0, 17)}</Text>
      </View>
      <View style={styles.signal}>
        <Text style={styles.signalText}>{signalStrength}</Text>
        <Text style={styles.rssi}>{device.rssi} dBm</Text>
      </View>
    </TouchableOpacity>
  );
}

function getSignalStrength(rssi: number | null): string {
  if (rssi === null) return '---';
  if (rssi >= -50) return 'Ottimo';
  if (rssi >= -70) return 'Buono';
  if (rssi >= -85) return 'Debole';
  return 'Scarso';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  id: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  signal: {
    alignItems: 'flex-end',
  },
  signalText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.secondary,
  },
  rssi: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
});

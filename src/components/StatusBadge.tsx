import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import type { ConnectionStatus } from '../types';

const statusConfig: Record<
  ConnectionStatus,
  { label: string; color: string; bgColor: string }
> = {
  disconnected: {
    label: 'Disconnesso',
    color: colors.textSecondary,
    bgColor: colors.surfaceSecondary,
  },
  scanning: {
    label: 'Ricerca...',
    color: colors.accent,
    bgColor: '#FFF8E7',
  },
  connecting: {
    label: 'Connessione...',
    color: colors.primary,
    bgColor: '#EBF4FD',
  },
  connected: {
    label: 'Connesso',
    color: colors.secondary,
    bgColor: '#E8F8F0',
  },
  receiving: {
    label: 'Ricezione dati',
    color: colors.secondary,
    bgColor: '#E8F8F0',
  },
};

interface StatusBadgeProps {
  status: ConnectionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});

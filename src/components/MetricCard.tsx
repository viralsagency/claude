import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon?: string;
  color?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  color = colors.primary,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  indicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});

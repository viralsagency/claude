import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import { MetricCard } from '../components/MetricCard';
import { getMeasurements } from '../storage/MeasurementStorage';
import type { WeightMeasurement } from '../types';

export function HomeScreen({ navigation }: any) {
  const [latest, setLatest] = useState<WeightMeasurement | null>(null);
  const [previous, setPrevious] = useState<WeightMeasurement | null>(null);
  const [totalMeasurements, setTotalMeasurements] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  async function loadData() {
    const measurements = await getMeasurements();
    setTotalMeasurements(measurements.length);
    if (measurements.length > 0) {
      setLatest(measurements[0]);
    }
    if (measurements.length > 1) {
      setPrevious(measurements[1]);
    }
  }

  const weightDiff =
    latest && previous ? (latest.weight - previous.weight).toFixed(1) : null;
  const diffSign = weightDiff && parseFloat(weightDiff) > 0 ? '+' : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>BLE Scale</Text>
      <Text style={styles.subtitle}>Monitor del peso e composizione corporea</Text>

      {latest ? (
        <>
          <View style={styles.mainCard}>
            <Text style={styles.mainLabel}>Ultimo Peso</Text>
            <View style={styles.mainValueRow}>
              <Text style={styles.mainValue}>
                {latest.weight.toFixed(1)}
              </Text>
              <Text style={styles.mainUnit}>{latest.unit}</Text>
            </View>
            {weightDiff && (
              <Text
                style={[
                  styles.diff,
                  {
                    color:
                      parseFloat(weightDiff) > 0
                        ? colors.danger
                        : colors.secondary,
                  },
                ]}
              >
                {diffSign}{weightDiff} {latest.unit} rispetto alla misurazione precedente
              </Text>
            )}
            <Text style={styles.dateText}>
              {new Date(latest.timestamp).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            {latest.bodyFat != null && (
              <MetricCard
                label="Massa Grassa"
                value={latest.bodyFat.toFixed(1)}
                unit="%"
                color={colors.accent}
              />
            )}
            {latest.muscleMass != null && (
              <MetricCard
                label="Massa Muscolare"
                value={latest.muscleMass.toFixed(1)}
                unit="kg"
                color={colors.secondary}
              />
            )}
            {latest.waterPercentage != null && (
              <MetricCard
                label="Acqua Corporea"
                value={latest.waterPercentage.toFixed(1)}
                unit="%"
                color={colors.primary}
              />
            )}
            {latest.bmi != null && (
              <MetricCard
                label="BMI"
                value={latest.bmi.toFixed(1)}
                unit=""
                color={colors.primaryDark}
              />
            )}
            {latest.boneMass != null && (
              <MetricCard
                label="Massa Ossea"
                value={latest.boneMass.toFixed(1)}
                unit="kg"
                color="#8B5CF6"
              />
            )}
            {latest.basalMetabolism != null && (
              <MetricCard
                label="Metab. Basale"
                value={latest.basalMetabolism}
                unit="kcal"
                color="#EC4899"
              />
            )}
          </View>

          <Text style={styles.totalText}>
            {totalMeasurements} misurazioni registrate
          </Text>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>&#x2696;</Text>
          <Text style={styles.emptyTitle}>Nessuna misurazione</Text>
          <Text style={styles.emptyText}>
            Connetti una bilancia BLE per iniziare a registrare il tuo peso e la
            composizione corporea.
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scansione')}
          >
            <Text style={styles.scanButtonText}>Cerca Bilancia</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  mainCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  mainLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  mainValue: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.white,
  },
  mainUnit: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: spacing.sm,
  },
  diff: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  scanButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});

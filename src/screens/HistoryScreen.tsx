import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import {
  getMeasurements,
  deleteMeasurement,
  clearAllMeasurements,
} from '../storage/MeasurementStorage';
import type { WeightMeasurement } from '../types';

export function HistoryScreen({ navigation }: any) {
  const [measurements, setMeasurements] = useState<WeightMeasurement[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = useCallback(async () => {
    const data = await getMeasurements();
    setMeasurements(data);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Elimina', 'Vuoi eliminare questa misurazione?', [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurement(id);
            loadData();
          },
        },
      ]);
    },
    [loadData]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Cancella tutto',
      'Vuoi eliminare tutte le misurazioni? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Cancella tutto',
          style: 'destructive',
          onPress: async () => {
            await clearAllMeasurements();
            loadData();
          },
        },
      ]
    );
  }, [loadData]);

  const renderItem = useCallback(
    ({ item }: { item: WeightMeasurement }) => (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardWeight}>
            {item.weight.toFixed(1)} {item.unit}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(item.timestamp).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.cardMetrics}>
          {item.bodyFat != null && (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.bodyFat.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Grasso</Text>
            </View>
          )}
          {item.muscleMass != null && (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {item.muscleMass.toFixed(1)}
              </Text>
              <Text style={styles.metricLabel}>Muscoli</Text>
            </View>
          )}
          {item.bmi != null && (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.bmi.toFixed(1)}</Text>
              <Text style={styles.metricLabel}>BMI</Text>
            </View>
          )}
          {item.waterPercentage != null && (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {item.waterPercentage.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>Acqua</Text>
            </View>
          )}
          {item.basalMetabolism != null && (
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{item.basalMetabolism}</Text>
              <Text style={styles.metricLabel}>kcal</Text>
            </View>
          )}
        </View>

        {item.deviceName && (
          <Text style={styles.deviceName}>{item.deviceName}</Text>
        )}
      </TouchableOpacity>
    ),
    [handleDelete]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cronologia</Text>
        {measurements.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Cancella tutto</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={measurements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>&#x1F4CA;</Text>
            <Text style={styles.emptyTitle}>Nessuna misurazione</Text>
            <Text style={styles.emptyText}>
              Le misurazioni appariranno qui dopo la connessione con una
              bilancia.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  clearText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardWeight: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  cardMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  deviceName: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
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
    paddingHorizontal: spacing.xl,
  },
});

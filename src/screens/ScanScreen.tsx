import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme';
import { StatusBadge } from '../components/StatusBadge';
import { DeviceItem } from '../components/DeviceItem';
import { useBle } from '../hooks/useBle';
import type { ScaleDevice } from '../types';

export function ScanScreen({ navigation }: any) {
  const {
    devices,
    status,
    lastMeasurement,
    error,
    demoMode,
    startScan,
    stopScan,
    connect,
    disconnect,
    switchToDemo,
  } = useBle();

  const isScanning = status === 'scanning';
  const isConnected = status === 'connected' || status === 'receiving';
  const isConnecting = status === 'connecting';

  const handleScan = useCallback(() => {
    if (isScanning) {
      stopScan();
    } else {
      startScan(false);
    }
  }, [isScanning, startScan, stopScan]);

  const handleScanAll = useCallback(() => {
    startScan(true);
  }, [startScan]);

  const handleDevicePress = useCallback(
    (device: ScaleDevice) => {
      Alert.alert(
        'Connetti',
        `Vuoi connetterti a "${device.name}"?`,
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Connetti',
            onPress: () => connect(device.id),
          },
        ]
      );
    },
    [connect]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scansione BLE</Text>
        <StatusBadge status={status} />
      </View>

      {demoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            MODALITA' DEMO - Dati simulati
          </Text>
        </View>
      )}

      {!demoMode && status === 'disconnected' && devices.length === 0 && (
        <TouchableOpacity style={styles.demoButton} onPress={switchToDemo}>
          <Text style={styles.demoButtonText}>
            Nessuna bilancia? Prova la modalita' demo
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isConnected && lastMeasurement?.weight && (
        <View style={styles.liveCard}>
          <Text style={styles.liveLabel}>Peso in tempo reale</Text>
          <Text style={styles.liveValue}>
            {lastMeasurement.weight.toFixed(1)}{' '}
            <Text style={styles.liveUnit}>{lastMeasurement.unit ?? 'kg'}</Text>
          </Text>
          {lastMeasurement.bodyFat != null && (
            <Text style={styles.liveExtra}>
              Massa grassa: {lastMeasurement.bodyFat.toFixed(1)}%
            </Text>
          )}
        </View>
      )}

      {isConnected ? (
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Text style={styles.disconnectButtonText}>Disconnetti</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={handleScan}
            disabled={isConnecting}
          >
            {isScanning ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : null}
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Ferma Scansione' : 'Cerca Bilance'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanAllButton}
            onPress={handleScanAll}
            disabled={isScanning || isConnecting}
          >
            <Text style={styles.scanAllButtonText}>Cerca Tutti</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Dispositivi trovati ({devices.length})
      </Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceItem
            device={item}
            onPress={handleDevicePress}
            isConnecting={isConnecting}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>
              {isScanning
                ? 'Ricerca in corso...'
                : 'Premi "Cerca Bilance" per iniziare la scansione.\n\nAssicurati che la bilancia sia accesa e in modalità pairing.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  liveCard: {
    backgroundColor: colors.secondary,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  liveLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  liveValue: {
    color: colors.white,
    fontSize: fontSize.hero,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  liveUnit: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  liveExtra: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  scanButtonActive: {
    backgroundColor: colors.accent,
  },
  scanButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  scanAllButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanAllButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  disconnectButton: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disconnectButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyList: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  demoBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  demoBannerText: {
    color: '#856404',
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoButton: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  demoButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { bleService } from '../services/BleService';
import { saveMeasurement } from '../storage/MeasurementStorage';
import type {
  ScaleDevice,
  WeightMeasurement,
  ConnectionStatus,
} from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useBle() {
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMeasurement, setLastMeasurement] =
    useState<Partial<WeightMeasurement> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const devicesRef = useRef<Map<string, ScaleDevice>>(new Map());

  useEffect(() => {
    bleService.setCallbacks({
      onDeviceFound: (device) => {
        devicesRef.current.set(device.id, device);
        setDevices(Array.from(devicesRef.current.values()));
      },
      onMeasurement: async (measurement) => {
        setLastMeasurement(measurement);
        // Auto-save if we have weight data
        if (measurement.weight && measurement.weight > 0) {
          const full: WeightMeasurement = {
            id: generateId(),
            timestamp: measurement.timestamp ?? Date.now(),
            weight: measurement.weight,
            unit: measurement.unit ?? 'kg',
            bmi: measurement.bmi,
            bodyFat: measurement.bodyFat,
            muscleMass: measurement.muscleMass,
            waterPercentage: measurement.waterPercentage,
            boneMass: measurement.boneMass,
            visceralFat: measurement.visceralFat,
            basalMetabolism: measurement.basalMetabolism,
            deviceId: measurement.deviceId ?? '',
            deviceName: measurement.deviceName ?? null,
          };
          await saveMeasurement(full);
        }
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus as ConnectionStatus);
      },
    });

    return () => {
      bleService.destroy();
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      if (apiLevel >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(result).every(
          (v) => v === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS permissions are handled via Info.plist
  }, []);

  const startScan = useCallback(
    async (allDevices = false) => {
      setError(null);
      devicesRef.current.clear();
      setDevices([]);

      try {
        const granted = await requestPermissions();
        if (!granted) {
          setError('Permessi Bluetooth non concessi');
          return;
        }

        await bleService.waitForPoweredOn();

        if (allDevices) {
          bleService.startScanAll();
        } else {
          bleService.startScan();
        }

        // Auto-stop scan after 15 seconds
        setTimeout(() => {
          bleService.stopScan();
        }, 15000);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [requestPermissions]
  );

  const stopScan = useCallback(() => {
    bleService.stopScan();
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    setError(null);
    try {
      await bleService.connectToDevice(deviceId);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await bleService.disconnect();
    setLastMeasurement(null);
  }, []);

  return {
    devices,
    status,
    lastMeasurement,
    error,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
}

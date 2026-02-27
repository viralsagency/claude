import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { mockBleService } from '../services/MockBleService';
import { saveMeasurement } from '../storage/MeasurementStorage';
import type {
  ScaleDevice,
  WeightMeasurement,
  ConnectionStatus,
} from '../types';

// Try to load real BLE service, fall back to mock for Expo Go
let bleServiceInstance: any = mockBleService;
let isUsingMock = true;

try {
  const ble = require('../services/BleService');
  bleServiceInstance = ble.bleService;
  isUsingMock = false;
} catch {
  console.log('[BLE] Modulo nativo non disponibile, uso modalità demo');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useBle() {
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMeasurement, setLastMeasurement] =
    useState<Partial<WeightMeasurement> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(isUsingMock);
  const devicesRef = useRef<Map<string, ScaleDevice>>(new Map());
  const serviceRef = useRef(bleServiceInstance);

  const switchToDemo = useCallback(() => {
    serviceRef.current.disconnect?.();
    serviceRef.current = mockBleService;
    setDemoMode(true);
    setDevices([]);
    setLastMeasurement(null);
    setStatus('disconnected');
    setupCallbacks(mockBleService);
  }, []);

  function setupCallbacks(service: any) {
    service.setCallbacks({
      onDeviceFound: (device: ScaleDevice) => {
        devicesRef.current.set(device.id, device);
        setDevices(Array.from(devicesRef.current.values()));
      },
      onMeasurement: async (measurement: Partial<WeightMeasurement>) => {
        setLastMeasurement(measurement);
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
      onStatusChange: (newStatus: string) => {
        setStatus(newStatus as ConnectionStatus);
      },
    });
  }

  useEffect(() => {
    setupCallbacks(serviceRef.current);
    return () => {
      serviceRef.current.destroy?.();
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (demoMode) return true;
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
    return true;
  }, [demoMode]);

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

        if (!demoMode) {
          await serviceRef.current.waitForPoweredOn();
        }

        if (allDevices) {
          serviceRef.current.startScanAll();
        } else {
          serviceRef.current.startScan();
        }

        if (!demoMode) {
          setTimeout(() => {
            serviceRef.current.stopScan();
          }, 15000);
        }
      } catch (err: any) {
        setError(err.message);
      }
    },
    [requestPermissions, demoMode]
  );

  const stopScan = useCallback(() => {
    serviceRef.current.stopScan();
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    setError(null);
    try {
      await serviceRef.current.connectToDevice(deviceId);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await serviceRef.current.disconnect();
    setLastMeasurement(null);
  }, []);

  return {
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
  };
}

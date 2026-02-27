import type { ScaleDevice, WeightMeasurement } from '../types';

type MeasurementCallback = (measurement: Partial<WeightMeasurement>) => void;
type DeviceCallback = (device: ScaleDevice) => void;
type StatusCallback = (status: string) => void;

const MOCK_DEVICES: ScaleDevice[] = [
  {
    id: 'mock-xiaomi-001',
    name: 'Mi Body Composition Scale 2',
    rssi: -52,
    isConnectable: true,
  },
  {
    id: 'mock-renpho-002',
    name: 'RENPHO ES-CS20M',
    rssi: -68,
    isConnectable: true,
  },
  {
    id: 'mock-eufy-003',
    name: 'eufy Smart Scale P2',
    rssi: -74,
    isConnectable: true,
  },
];

function randomInRange(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

class MockBleService {
  private onMeasurement: MeasurementCallback | null = null;
  private onDeviceFound: DeviceCallback | null = null;
  private onStatusChange: StatusCallback | null = null;
  private connected = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  setCallbacks(callbacks: {
    onMeasurement?: MeasurementCallback;
    onDeviceFound?: DeviceCallback;
    onStatusChange?: StatusCallback;
  }) {
    this.onMeasurement = callbacks.onMeasurement ?? null;
    this.onDeviceFound = callbacks.onDeviceFound ?? null;
    this.onStatusChange = callbacks.onStatusChange ?? null;
  }

  startScan() {
    this.onStatusChange?.('scanning');

    // Simulate devices appearing one by one
    MOCK_DEVICES.forEach((device, i) => {
      setTimeout(() => {
        this.onDeviceFound?.(device);
      }, 800 + i * 1200);
    });

    // Auto-stop after 5s
    setTimeout(() => {
      this.onStatusChange?.('disconnected');
    }, 5000);
  }

  startScanAll() {
    this.startScan();
  }

  stopScan() {
    this.onStatusChange?.('disconnected');
  }

  async connectToDevice(deviceId: string): Promise<void> {
    this.onStatusChange?.('connecting');

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.connected = true;
    this.onStatusChange?.('connected');

    // Simulate weight stabilization (3 readings, then stable)
    const baseWeight = randomInRange(65, 85);
    let readingCount = 0;

    this.interval = setInterval(() => {
      readingCount++;
      const fluctuation = readingCount < 3 ? randomInRange(-0.5, 0.5) : 0;
      const weight = parseFloat((baseWeight + fluctuation).toFixed(1));

      const measurement: Partial<WeightMeasurement> = {
        weight,
        unit: 'kg',
        deviceId,
        deviceName:
          MOCK_DEVICES.find((d) => d.id === deviceId)?.name ?? 'Demo Scale',
        timestamp: Date.now(),
      };

      // After stabilization, add body composition data
      if (readingCount >= 3) {
        measurement.bodyFat = randomInRange(18, 28);
        measurement.muscleMass = randomInRange(28, 42);
        measurement.waterPercentage = randomInRange(50, 65);
        measurement.bmi = randomInRange(20, 27);
        measurement.boneMass = randomInRange(2.5, 3.5);
        measurement.basalMetabolism = Math.round(randomInRange(1400, 1900, 0));
        measurement.visceralFat = randomInRange(4, 12, 0);
      }

      this.onStatusChange?.('receiving');
      this.onMeasurement?.(measurement);

      // Stop after 5 readings
      if (readingCount >= 5 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }, 2000);
  }

  async disconnect(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.connected = false;
    this.onStatusChange?.('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  destroy() {
    this.disconnect();
  }
}

export const mockBleService = new MockBleService();

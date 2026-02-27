import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import type { ScaleDevice, WeightMeasurement } from '../types';

// Standard BLE UUIDs for scale services
const WEIGHT_SCALE_SERVICE = '0000181d-0000-1000-8000-00805f9b34fb';
const BODY_COMPOSITION_SERVICE = '0000181b-0000-1000-8000-00805f9b34fb';
const WEIGHT_MEASUREMENT_CHAR = '00002a9d-0000-1000-8000-00805f9b34fb';
const BODY_COMPOSITION_MEASUREMENT_CHAR = '00002a9c-0000-1000-8000-00805f9b34fb';

// Common proprietary scale services (Xiaomi/Huami, Yunmai, etc.)
const XIAOMI_SCALE_SERVICE = '0000181d-0000-1000-8000-00805f9b34fb';
const GENERIC_WEIGHT_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
const GENERIC_WEIGHT_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';

type MeasurementCallback = (measurement: Partial<WeightMeasurement>) => void;
type DeviceCallback = (device: ScaleDevice) => void;
type StatusCallback = (status: string) => void;

class BleService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private onMeasurement: MeasurementCallback | null = null;
  private onDeviceFound: DeviceCallback | null = null;
  private onStatusChange: StatusCallback | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  setCallbacks(callbacks: {
    onMeasurement?: MeasurementCallback;
    onDeviceFound?: DeviceCallback;
    onStatusChange?: StatusCallback;
  }) {
    this.onMeasurement = callbacks.onMeasurement ?? null;
    this.onDeviceFound = callbacks.onDeviceFound ?? null;
    this.onStatusChange = callbacks.onStatusChange ?? null;
  }

  async checkBleState(): Promise<State> {
    return this.manager.state();
  }

  async waitForPoweredOn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscription = this.manager.onStateChange((state) => {
        if (state === State.PoweredOn) {
          subscription.remove();
          resolve();
        } else if (state === State.Unsupported) {
          subscription.remove();
          reject(new Error('BLE non supportato su questo dispositivo'));
        }
      }, true);
    });
  }

  startScan() {
    this.onStatusChange?.('scanning');

    this.manager.startDeviceScan(
      [WEIGHT_SCALE_SERVICE, BODY_COMPOSITION_SERVICE, GENERIC_WEIGHT_SERVICE],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('Errore scansione BLE:', error.message);
          return;
        }
        if (device && (device.name || device.localName)) {
          const scaleDevice: ScaleDevice = {
            id: device.id,
            name: device.name || device.localName,
            rssi: device.rssi,
            isConnectable: device.isConnectable ?? true,
          };
          this.onDeviceFound?.(scaleDevice);
        }
      }
    );
  }

  // Scan without service filter to find all nearby devices
  startScanAll() {
    this.onStatusChange?.('scanning');

    this.manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('Errore scansione BLE:', error.message);
          return;
        }
        if (device && (device.name || device.localName)) {
          const name = (device.name || device.localName || '').toLowerCase();
          // Filter for likely scale devices by name
          const scaleKeywords = [
            'scale', 'bilancia', 'weight', 'body', 'mi scale',
            'yunmai', 'eufy', 'renpho', 'withings', 'fitindex',
            'arboleaf', 'etekcity', 'greater goods', 'wyze',
            'garmin', 'omron', 'tanita', 'qardio',
          ];
          const isLikelyScale = scaleKeywords.some((kw) => name.includes(kw));

          if (isLikelyScale) {
            const scaleDevice: ScaleDevice = {
              id: device.id,
              name: device.name || device.localName,
              rssi: device.rssi,
              isConnectable: device.isConnectable ?? true,
            };
            this.onDeviceFound?.(scaleDevice);
          }
        }
      }
    );
  }

  stopScan() {
    this.manager.stopDeviceScan();
    this.onStatusChange?.('disconnected');
  }

  async connectToDevice(deviceId: string): Promise<void> {
    this.onStatusChange?.('connecting');

    try {
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });

      this.connectedDevice = device;

      // Monitor disconnection
      device.onDisconnected((_error) => {
        this.connectedDevice = null;
        this.onStatusChange?.('disconnected');
      });

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      this.onStatusChange?.('connected');

      // Subscribe to measurements
      await this.subscribeToMeasurements(device);
    } catch (error: any) {
      this.connectedDevice = null;
      this.onStatusChange?.('disconnected');
      throw new Error(`Connessione fallita: ${error.message}`);
    }
  }

  private async subscribeToMeasurements(device: Device): Promise<void> {
    const services = await device.services();

    for (const service of services) {
      const uuid = service.uuid.toLowerCase();

      if (uuid === WEIGHT_SCALE_SERVICE) {
        await this.subscribeToWeightScale(device, service.uuid);
      }

      if (uuid === BODY_COMPOSITION_SERVICE) {
        await this.subscribeToBodyComposition(device, service.uuid);
      }

      // Generic weight service (common in cheap scales)
      if (uuid === GENERIC_WEIGHT_SERVICE) {
        await this.subscribeToGenericWeight(device, service.uuid);
      }
    }

    this.onStatusChange?.('receiving');
  }

  private async subscribeToWeightScale(
    device: Device,
    serviceUuid: string
  ): Promise<void> {
    device.monitorCharacteristicForService(
      serviceUuid,
      WEIGHT_MEASUREMENT_CHAR,
      (error: any, characteristic: Characteristic | null) => {
        if (error) {
          console.warn('Errore lettura peso:', error.message);
          return;
        }
        if (characteristic?.value) {
          const measurement = this.parseWeightMeasurement(
            characteristic.value,
            device.id,
            device.name
          );
          this.onMeasurement?.(measurement);
        }
      }
    );
  }

  private async subscribeToBodyComposition(
    device: Device,
    serviceUuid: string
  ): Promise<void> {
    device.monitorCharacteristicForService(
      serviceUuid,
      BODY_COMPOSITION_MEASUREMENT_CHAR,
      (error: any, characteristic: Characteristic | null) => {
        if (error) {
          console.warn('Errore lettura composizione corporea:', error.message);
          return;
        }
        if (characteristic?.value) {
          const measurement = this.parseBodyCompositionMeasurement(
            characteristic.value,
            device.id,
            device.name
          );
          this.onMeasurement?.(measurement);
        }
      }
    );
  }

  private async subscribeToGenericWeight(
    device: Device,
    serviceUuid: string
  ): Promise<void> {
    device.monitorCharacteristicForService(
      serviceUuid,
      GENERIC_WEIGHT_CHAR,
      (error: any, characteristic: Characteristic | null) => {
        if (error) {
          console.warn('Errore lettura generica:', error.message);
          return;
        }
        if (characteristic?.value) {
          const measurement = this.parseGenericWeight(
            characteristic.value,
            device.id,
            device.name
          );
          this.onMeasurement?.(measurement);
        }
      }
    );
  }

  /**
   * Parse standard Weight Measurement (0x2A9D) per Bluetooth SIG spec.
   *
   * Byte layout:
   * [0]     Flags
   *         bit 0: 0 = SI (kg), 1 = Imperial (lbs)
   *         bit 1: Time Stamp present
   *         bit 2: User ID present
   *         bit 3: BMI and Height present
   * [1-2]   Weight (uint16, resolution 0.005 kg or 0.01 lbs)
   * [3-9]   Time stamp (optional, 7 bytes)
   * [...]   User ID (optional, 1 byte)
   * [...]   BMI (optional, uint16, resolution 0.1)
   * [...]   Height (optional, uint16, resolution 0.001 m or 0.1 in)
   */
  private parseWeightMeasurement(
    base64Value: string,
    deviceId: string,
    deviceName: string | null
  ): Partial<WeightMeasurement> {
    const data = Buffer.from(base64Value, 'base64');
    const flags = data.readUInt8(0);

    const isImperial = (flags & 0x01) !== 0;
    const hasTimestamp = (flags & 0x02) !== 0;
    const hasUserId = (flags & 0x04) !== 0;
    const hasBMI = (flags & 0x08) !== 0;

    const rawWeight = data.readUInt16LE(1);
    const weight = isImperial ? rawWeight * 0.01 : rawWeight * 0.005;
    const unit = isImperial ? 'lbs' : 'kg';

    let offset = 3;
    if (hasTimestamp) offset += 7;
    if (hasUserId) offset += 1;

    let bmi: number | undefined;
    if (hasBMI && offset + 2 <= data.length) {
      bmi = data.readUInt16LE(offset) * 0.1;
    }

    return {
      weight,
      unit: unit as 'kg' | 'lbs',
      bmi,
      deviceId,
      deviceName,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse Body Composition Measurement (0x2A9C) per Bluetooth SIG spec.
   *
   * Flags (uint16):
   *   bit 0: Measurement Units (0=SI, 1=Imperial)
   *   bit 1: Time Stamp present
   *   bit 2: User ID present
   *   bit 3: Basal Metabolism present
   *   bit 4: Muscle Percentage present
   *   bit 5: Muscle Mass present
   *   bit 6: Fat Free Mass present
   *   bit 7: Soft Lean Mass present
   *   bit 8: Body Water Mass present
   *   bit 9: Impedance present
   *   bit 10: Weight present
   *   bit 11: Height present
   *   bit 12: Multiple Packet Measurement
   */
  private parseBodyCompositionMeasurement(
    base64Value: string,
    deviceId: string,
    deviceName: string | null
  ): Partial<WeightMeasurement> {
    const data = Buffer.from(base64Value, 'base64');

    if (data.length < 4) {
      return { deviceId, deviceName, timestamp: Date.now() };
    }

    const flags = data.readUInt16LE(0);
    const isImperial = (flags & 0x0001) !== 0;

    // Body fat percentage is always present (mandatory field)
    const bodyFatRaw = data.readUInt16LE(2);
    const bodyFat = bodyFatRaw * 0.1;

    let offset = 4;
    const result: Partial<WeightMeasurement> = {
      bodyFat,
      deviceId,
      deviceName,
      timestamp: Date.now(),
      unit: isImperial ? 'lbs' : 'kg',
    };

    // Time stamp
    if (flags & 0x0002) offset += 7;
    // User ID
    if (flags & 0x0004) offset += 1;
    // Basal Metabolism
    if (flags & 0x0008) {
      if (offset + 2 <= data.length) {
        result.basalMetabolism = data.readUInt16LE(offset);
      }
      offset += 2;
    }
    // Muscle Percentage
    if (flags & 0x0010) {
      // skip muscle percentage (we use muscle mass instead)
      offset += 2;
    }
    // Muscle Mass
    if (flags & 0x0020) {
      if (offset + 2 <= data.length) {
        const raw = data.readUInt16LE(offset);
        result.muscleMass = isImperial ? raw * 0.01 : raw * 0.005;
      }
      offset += 2;
    }
    // Fat Free Mass
    if (flags & 0x0040) offset += 2;
    // Soft Lean Mass
    if (flags & 0x0080) offset += 2;
    // Body Water Mass
    if (flags & 0x0100) {
      if (offset + 2 <= data.length) {
        const raw = data.readUInt16LE(offset);
        const waterMass = isImperial ? raw * 0.01 : raw * 0.005;
        // We store as percentage if weight is known later
        result.waterPercentage = waterMass;
      }
      offset += 2;
    }
    // Impedance
    if (flags & 0x0200) offset += 2;
    // Weight
    if (flags & 0x0400) {
      if (offset + 2 <= data.length) {
        const raw = data.readUInt16LE(offset);
        result.weight = isImperial ? raw * 0.01 : raw * 0.005;
      }
      offset += 2;
    }

    return result;
  }

  /**
   * Parse generic weight data from non-standard scales.
   * Many cheap BLE scales send weight as a simple uint16 in 0.1kg or 0.01kg units.
   */
  private parseGenericWeight(
    base64Value: string,
    deviceId: string,
    deviceName: string | null
  ): Partial<WeightMeasurement> {
    const data = Buffer.from(base64Value, 'base64');

    let weight = 0;
    if (data.length >= 2) {
      const raw = data.readUInt16LE(0);
      // Heuristic: if value > 3000, it's likely in 0.01kg units
      // otherwise in 0.1kg units
      weight = raw > 3000 ? raw * 0.01 : raw * 0.1;
    }

    return {
      weight,
      unit: 'kg',
      deviceId,
      deviceName,
      timestamp: Date.now(),
    };
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch {
        // Ignore disconnection errors
      }
      this.connectedDevice = null;
    }
    this.onStatusChange?.('disconnected');
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  destroy() {
    this.disconnect();
    this.manager.destroy();
  }
}

export const bleService = new BleService();
export default BleService;

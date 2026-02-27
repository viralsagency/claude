export interface ScaleDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnectable: boolean;
}

export interface WeightMeasurement {
  id: string;
  timestamp: number;
  weight: number; // kg
  unit: 'kg' | 'lbs';
  bmi?: number;
  bodyFat?: number; // percentage
  muscleMass?: number; // kg
  waterPercentage?: number; // percentage
  boneMass?: number; // kg
  visceralFat?: number;
  basalMetabolism?: number; // kcal
  deviceId: string;
  deviceName: string | null;
}

export interface UserProfile {
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
}

export type ConnectionStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'receiving';

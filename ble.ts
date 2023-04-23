import { BleManager, Device, Service } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import BluetoothConnectionManager from './BluetoothConnectionManager';

let bleManager: BleManager | null = null;

/**
 * Returns the global instance of BleManager
 * @returns BleManager - The global instance of BleManager
 */
export function getBleManagerInstance(): BleManager {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
}

interface BleServiceNames {
  [uuid: string]: string;
}

const BLE_SERVICE_NAMES: BleServiceNames = {
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
  '00001816-0000-1000-8000-00805f9b34fb': 'Cycling Speed and Cadence',
  '00001818-0000-1000-8000-00805f9b34fb': 'Cycling Power',
  '0000fe59-0000-1000-8000-00805f9b34fb': 'Environmental Sensing',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
  '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate'
};

export enum SupportedBleServices {
  Battery = '180f',
  HeartRate = '180d',
  CyclingPower = '1818',
  CyclingSpeedAndCadence = '1816'
}

const SERVICE_UUIDS = Object.values(SupportedBleServices); // Array of ServiceUUIDs to scan for

/**
 * Scans for BLE devices with specific ServiceUUIDs and returns a list of devices with no duplicates
 * @param scanTime - The duration of time in seconds to scan for devices
 * @returns Promise<Array<Device>> - A promise that resolves with an array of Device objects
 */
export async function scanForDevices(scanTime: number): Promise<Array<Device>> {
  const bleManager = getBleManagerInstance(); // Get the global instance of BleManager
  const devices: Array<Device> = []; // Initialize an empty array to hold discovered devices
  try {
    bleManager.startDeviceScan(SERVICE_UUIDS, null, (error, device) => {
      // Handle any errors that occur during scanning
      if (error) {
        console.log(`Error scanning for devices: ${error}`);
        return;
      }

      // Check if the device has already been discovered
      const index = devices.findIndex((d) => d.id === device?.id);
      if (index === -1) {
        // If the device has not been discovered, add it to the list of devices
        devices.push(device!);
      } else {
        // If the device has already been discovered, update its properties
        devices[index] = device!;
      }
    });

    // Wait for the specified scan time
    await new Promise((resolve) => setTimeout(resolve, scanTime * 1000));

    // Stop scanning for devices
    bleManager.stopDeviceScan();

    // Return the list of discovered devices with no duplicates
    return [...new Set(devices)];
  } catch (error) {
    console.log(`Error scanning for devices: ${error}`);
  }

  return [];
}

export function getServiceUuids(services: Service[]): string[] {
  const uuids = services.map((service) => service.uuid);
  return uuids
}

export function getServiceNames(serviceUUIDs: string[]): string[] {
  const serviceNames: string[] = [];

  for (const uuid of serviceUUIDs) {
    const serviceName = BLE_SERVICE_NAMES[uuid];
    if (serviceName && serviceName !== 'Unknown Service') {
      serviceNames.push(serviceName);
    }
  }

  return serviceNames;
}

export interface MonitorConfiguration {
  serviceUUID: string;
  characteristicUUID: string;
  onDataReceived?: (data: number) => void;
  onError?: (error: Error) => void;
}

export async function connectAndMonitor(
  device: Device,
  monitorConfigurations: MonitorConfiguration[],
  onDeviceConnected?: (device: Device) => void,
  onDeviceDisconnected?: (device: Device) => void,
): Promise<BluetoothConnectionManager> {
  const connectionManager = new BluetoothConnectionManager(device, 5000, onDeviceConnected, onDeviceDisconnected);

  for (const config of monitorConfigurations) {
    connectionManager.addOnReconnectCallback(async () => {
      await monitorCharacteristic(
        device,
        config.serviceUUID,
        config.characteristicUUID,
        config.onDataReceived,
        config.onError,
      );
    });
  }

  await connectionManager.startMonitoringConnection();
  return connectionManager;
}

async function monitorCharacteristic(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string,
  onDataReceived?: (data: any) => void,
  onError?: (error: Error) => void,
) {
  try {
    const connectionState = await device.isConnected();
    if (!connectionState) {
      console.log('Device is not connected');
      return;
    }

    await device.discoverAllServicesAndCharacteristics();
    const services = await device.services();

    // Find the full Service
    const theService = services.find((service) =>
      service.uuid.includes(serviceUUID),
    );

    if (!theService) {
      throw new Error(`${serviceUUID} not found.`);
    }

    const characteristics = await device.characteristicsForService(
      theService.uuid,
    );

    // Find the full Characteristic
    const theCharacteristic = characteristics.find(
      (characteristic) => characteristic.uuid.includes(characteristicUUID),
    );

    if (!theCharacteristic) {
      throw new Error(`${characteristicUUID} Characteristic not found.`);
    }
    // Start notifications on our characteristic and service.
    device.monitorCharacteristicForService(
      theService.uuid,
      theCharacteristic.uuid,
      (error, characteristic) => {
        if (error) {
          if (onError) {
            onError(error);
          } else {
            console.error(`Error monitoring characteristic ${characteristicUUID}:`, error);
          }
          return;
        }

        if (!characteristic || !characteristic.value) {
          return;
        }

        if (onDataReceived) {
          onDataReceived(characteristic.value);
        }
      },
    );

  } catch (error) {
    throw error;
  }
}


export function parseHeartRateData(value: any): number {
  const data = Buffer.from(value, 'base64'); // Convert base64 value to a Buffer

  const flags = data.readUInt8(0);
  const is16Bit = (flags & (1 << 0)) !== 0; // Check if the heart rate value format is 16-bit

  let heartRate = 0;
  if (is16Bit) {
    heartRate = data.readUInt16LE(1); // Read heart rate as a 16-bit value
  } else {
    heartRate = data.readUInt8(1); // Read heart rate as an 8-bit value
  }
  return heartRate
}
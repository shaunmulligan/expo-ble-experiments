import { BleManager, Device, Service } from 'react-native-ble-plx';
import {
  getBleManagerInstance,
  scanForDevices,
  getServiceUuids,
  getServiceNames,
  SupportedBleServices,
} from './ble';

const mockStartDeviceScan = jest.fn();
const mockStopDeviceScan = jest.fn();

jest.mock('react-native-ble-plx', () => {
  return {
    BleManager: jest.fn().mockImplementation(() => {
      return {
        startDeviceScan: mockStartDeviceScan,
        stopDeviceScan: mockStopDeviceScan,
      };
    }),
  };
});

const mockDevice1: Device = {
  id: '00:00:00:00:00:00',
} as Device;

const mockDevice2: Device = {
  id: '11:11:11:11:11:11',
} as Device;

const mockDevice3: Device = {
  id: '22:22:22:22:22:22',
} as Device;

describe('ble.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getBleManagerInstance should return a single instance of BleManager', () => {
    const instance1 = getBleManagerInstance();
    const instance2 = getBleManagerInstance();
    expect(instance1).toBe(instance2);
  });

  test('scanForDevices should call startDeviceScan and stopDeviceScan', async () => {
    const bleManager = getBleManagerInstance();
    await scanForDevices(1);
    expect(bleManager.startDeviceScan).toHaveBeenCalledTimes(1);
    expect(bleManager.stopDeviceScan).toHaveBeenCalledTimes(1);
  });

  test('scanForDevices should return a list of devices', async () => {
    mockStartDeviceScan.mockImplementation((_serviceUUIDs, _options, callback) => {
      setTimeout(() => {
        callback(null, mockDevice1);
        callback(null, mockDevice2);
        callback(null, mockDevice3);
      }, 100);
    });

    const devices = await scanForDevices(1);
    expect(devices).toEqual([mockDevice1, mockDevice2, mockDevice3]);
  });

  test('scanForDevices should not return duplicate devices', async () => {
    mockStartDeviceScan.mockImplementation((_serviceUUIDs, _options, callback) => {
      setTimeout(() => {
        callback(null, mockDevice1);
        callback(null, mockDevice2);
        callback(null, mockDevice1); // Duplicate device
      }, 100);
    });

    const devices = await scanForDevices(1);
    expect(devices).toEqual([mockDevice1, mockDevice2]);
  });

  test('scanForDevices should return an empty array if there is an error during scanning', async () => {
    mockStartDeviceScan.mockImplementation((_serviceUUIDs, _options, callback) => {
      setTimeout(() => {
        callback(new Error('Error during scanning'), null);
      }, 100);
    });

    const devices = await scanForDevices(1);
    expect(devices).toEqual([]);
  });

  test('scanForDevices should return an empty array if the scanning process throws an exception', async () => {
    mockStartDeviceScan.mockImplementation(() => {
      throw new Error('Error during scanning');
    });

    const devices = await scanForDevices(1);
    expect(devices).toEqual([]);
  });

  test('getServiceUuids should return an array of UUIDs', () => {
    const services: Service[] = [
      { uuid: SupportedBleServices.Battery },
      { uuid: SupportedBleServices.HeartRate },
    ] as Service[];

    const expectedUuids = [
      SupportedBleServices.Battery,
      SupportedBleServices.HeartRate,
    ];
    expect(getServiceUuids(services)).toEqual(expectedUuids);
  });

  test('getServiceNames should return an array of service names', () => {
    const serviceUUIDs = [
      '00001800-0000-1000-8000-00805f9b34fb',
      '0000180d-0000-1000-8000-00805f9b34fb',
      'unknown-uuid',
    ];
    const expectedServiceNames = ['Generic Access', 'Heart Rate'];
    expect(getServiceNames(serviceUUIDs)).toEqual(expectedServiceNames);
  });
});




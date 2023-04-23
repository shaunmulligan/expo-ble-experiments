/**
 * Sample BLE React Native App
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text
} from 'react-native';
import { scanForDevices, getBleManagerInstance, monitorHeartRate, connectAndMonitor, SupportedBleServices, MonitorConfiguration, parseHeartRateData } from './ble';
import { BleError, Device } from 'react-native-ble-plx';
import DeviceList from './components/DevicesList';

const manager = getBleManagerInstance();

const App = () => {
  const [devices, setDevices] = useState<Array<Device>>([]);
  const [pairedIds, setPairedIds] = useState<string[]>([]);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  useEffect(() => {
    const subscription = manager.onStateChange(async (state) => {
      if (state === 'PoweredOn') {
        try {
          const foundDevices = await scanForDevices(5);
          console.log('found devices: ', foundDevices);
          setDevices(foundDevices);
        } catch (error) {
          console.log(error);
        }
        subscription.remove();
      }
    }, true);
    return () => {
      devices.forEach(async device => {
        await device.cancelConnection();
      });
      subscription.remove()
    };
  }, [manager]);
  
  const handleDisconnect = (error: BleError | null, device: Device) => {
    // Write the heart rate value to a database or perform other actions
    console.log(`${device.id} was disconnected`);
    manager.cancelTransaction('HRM-transatctions');

    // Remove the device.id from the connectedIds list
      setConnectedIds((prevConnectedIds) =>
      prevConnectedIds.filter((id) => id !== device.id)
    );
  };

  const handleHeartRate = (heartRate: any) => {
    // Write the heart rate value to a database or perform other actions
    console.log('Received Heart Rate:', parseHeartRateData(heartRate));
  };

  function handleHrError(error: Error) {
    // Handle the error, e.g., show a message or log it
    console.error('Error in monitorHeartRate:', error);
  }

  const handleAddDevice = async (device: Device) => {
    try {
      const monitorConfigurations: MonitorConfiguration[] = [
        {
          serviceUUID: SupportedBleServices.HeartRate,
          characteristicUUID: '2a37', // Heart Rate Measurement Characteristic
          onDataReceived: handleHeartRate,
          onError: handleHrError,
        },
      ];
      const connectionManager = await connectAndMonitor(device, monitorConfigurations);

    } catch (error) {
      console.error(error);
      await device.cancelConnection();
    }
  };

  return (
    <>
      <SafeAreaView>
        <Text>Discovered Devices:</Text>
        <DeviceList devices={devices} pairedIds={pairedIds} connectedIds={connectedIds} onAddDevice={handleAddDevice}/>
      </SafeAreaView>
    </>
  );
};

export default App;



/**
 * Sample BLE React Native App
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  SafeAreaView,
  Text
} from 'react-native';
import { scanForDevices, getBleManagerInstance, connectAndMonitor, SupportedBleServices, MonitorConfiguration, parseHeartRateData } from './ble';
import { BleError, Device } from 'react-native-ble-plx';
import DeviceList from './components/DevicesList';
import BluetoothConnectionManager from './BluetoothConnectionManager';

const manager = getBleManagerInstance();

const App = () => {
  const [devices, setDevices] = useState<Array<Device>>([]);
  const [pairedIds, setPairedIds] = useState<string[]>([]);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [connectionManagers, setConnectionManagers] = useState<{ [deviceId: string]: BluetoothConnectionManager }>({});

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
  
  const scan = async () => {
    try {
      const foundDevices = await scanForDevices(5);
      console.log('found devices: ', foundDevices);
      setDevices(foundDevices);
    } catch (error) {
      console.log(error);
    }
  }

  const handleConnects = (device: Device) => {
    console.log(`${device.id} was connected`);
    setConnectedIds((prevConnectedIds) => [...prevConnectedIds, device.id]);
    // once we are connected, write into DB and update paired.
    setPairedIds((prevConnectedIds) => [...prevConnectedIds, device.id]);
  }

  const handleDisconnect = (device: Device) => {
    // Write the heart rate value to a database or perform other actions
    console.log(`${device.id} was disconnected`);

    // Remove the device.id from the connectedIds list
    setConnectedIds((prevConnectedIds) =>
      prevConnectedIds.filter((id) => id !== device.id)
    );
  };

  const handleRemove = async (device: Device) => {
    // Remove the device.id from the pairedIds list
    setPairedIds((prevPairedIds) => prevPairedIds.filter((id) => id !== device.id));
    await device.cancelConnection();
  
    // Call stopMonitoringConnection for the corresponding BluetoothConnectionManager
    const connectionManager = connectionManagers[device.id];
    if (connectionManager) {
      connectionManager.stopMonitoringConnection();
  
      // Remove the BluetoothConnectionManager instance from the state
      setConnectionManagers((prevState) => {
        const newState = { ...prevState };
        delete newState[device.id];
        return newState;
      });
    }
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
      const connectionManager = await connectAndMonitor(device, monitorConfigurations, handleConnects, handleDisconnect);
  
      // Store the BluetoothConnectionManager instance in the state
      setConnectionManagers((prevState) => ({ ...prevState, [device.id]: connectionManager }));
  
    } catch (error) {
      console.error(error);
      await device.cancelConnection();
    }
  };

  return (
    <>
      <SafeAreaView>
        <Text>Discovered Devices:</Text>
        <DeviceList devices={devices} pairedIds={pairedIds} connectedIds={connectedIds} onAddDevice={handleAddDevice} onRemoveDevice={handleRemove}/>
        <Button title='Scan' onPress={scan} />
      </SafeAreaView>
    </>
  );
};

export default App;



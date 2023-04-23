/**
 * Sample BLE React Native App
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  StatusBar,
  View,
  FlatList,
} from 'react-native';
import { scanForDevices, getBleManagerInstance, getServiceUuids, getServiceNames } from './ble';
import { Device } from 'react-native-ble-plx';
import DeviceList from './components/DevicesList';

const manager = getBleManagerInstance();

const App = () => {
  const [devices, setDevices] = useState<Array<Device>>([]);

  const paired = ["F1:01:52:E2:90:FA"];
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
    return () => subscription.remove();
  }, [manager]);

  const handleAddDevice = (device: Device) => {
    console.log('Add device:', device);
    // setPairedIds([...pairedIds, device.id]);
  };

  const renderItem = ({ item }: { item: Device }) => (
    <View>
      <Text>{item.name || 'Unknown device'} - {item.id}</Text>
    </View>
  );

  return (
    <>
      <SafeAreaView>
        <Text>Discovered Devices:</Text>
        <DeviceList devices={devices} pairedIds={paired} onAddDevice={handleAddDevice}/>
      </SafeAreaView>
    </>
  );
};

export default App;
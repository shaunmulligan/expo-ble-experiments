/**
 * Sample BLE React Native App
 */

import React, { useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  StatusBar,
} from 'react-native';
import { scanForDevices, getBleManagerInstance, getServiceUuids, getServiceNames } from './ble';

const manager = getBleManagerInstance();

const App = () => {
  useEffect(() => {
    const subscription = manager.onStateChange(async (state) => {
        if (state === 'PoweredOn') {
          try {
            const devices = await scanForDevices(5);
            console.log('found devices: ', devices);
            const device = await devices[0].connect();
            console.log('First device: ', device);
            await device.discoverAllServicesAndCharacteristics();
            const services = await device.services();
            const serviceUuids = getServiceUuids(services);
            console.log(serviceUuids);
            console.log(getServiceNames(serviceUuids))
            await device.cancelConnection();
          } catch (error) {
            console.log(error)
          }
            subscription.remove();
        }
    }, true);
    return () => subscription.remove();
  }, [manager]);

  return (
    <>
      <StatusBar />
      <SafeAreaView>
        <Text>testing...</Text>
      </SafeAreaView>
    </>
  );
};


export default App;

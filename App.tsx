import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import BleApp from './BleApp'

export default function App() {
  return (
    <>
      <StatusBar hidden={true}/>
      <SafeAreaView>
      <Text>My App - with bluetooth!</Text>
      <StatusBar style="auto" />
      <BleApp />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

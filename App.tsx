import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BleApp from './BleApp'

export default function App() {
  return (
    <View style={styles.container}>
      <Text>My App - with bluetooth!</Text>
      <StatusBar style="auto" />
      <BleApp />
    </View>
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

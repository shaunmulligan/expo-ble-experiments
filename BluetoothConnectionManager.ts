import { Device } from 'react-native-ble-plx';

type CallbackFunction = () => void | Promise<void>;

class BluetoothConnectionManager {
  private device: Device;
  private checkInterval: number;
  private connectionInterval: NodeJS.Timeout | null;
  private onReconnectCallbacks: CallbackFunction[];

  constructor(device: Device, checkInterval: number = 5000) {
    this.device = device;
    this.checkInterval = checkInterval;
    this.connectionInterval = null;
    this.onReconnectCallbacks = [];
  }

  public addOnReconnectCallback(callback: CallbackFunction): void {
    this.onReconnectCallbacks.push(callback);
  }

  public async startMonitoringConnection(): Promise<void> {
    if (this.connectionInterval) {
      console.log('Already monitoring connection');
      return;
    }

    this.connectionInterval = setInterval(async () => {
      try {
        const isConnected = await this.device.isConnected();
        if (!isConnected) {
          console.log('Device is not connected. Attempting to reconnect...');
          await this.connectToDevice();
        }
      } catch (error) {
        console.error('Error while checking device connection:', error);
      }
    }, this.checkInterval);
  }

  public stopMonitoringConnection(): void {
    if (this.connectionInterval) {
      clearInterval(this.connectionInterval);
      this.connectionInterval = null;
    }
  }

  private async connectToDevice(): Promise<void> {
    try {
      await this.device.connect();
      console.log('Device reconnected successfully');
      await this.runOnReconnectCallbacks();
    } catch (error) {
      console.error('Error while reconnecting to the device:', error);
    }
  }

  private async runOnReconnectCallbacks(): Promise<void> {
    for (const callback of this.onReconnectCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('Error while executing onReconnect callback:', error);
      }
    }
  }
}

export default BluetoothConnectionManager;

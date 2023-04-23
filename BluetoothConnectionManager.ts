import { Device } from 'react-native-ble-plx';

type CallbackFunction = () => void | Promise<void>;

class BluetoothConnectionManager {
  private device: Device;
  private checkInterval: number;
  private connectionInterval: NodeJS.Timeout | null;
  private onReconnectCallbacks: CallbackFunction[];

  constructor(device: Device, 
    checkInterval: number = 5000, 
    private onDeviceConnected?: (device: Device) => void,
    private onDeviceDisconnected?: (device: Device) => void,
  ) {
    this.device = device;
    this.checkInterval = checkInterval;
    this.connectionInterval = null;
    this.onReconnectCallbacks = [];
    this.device.onDisconnected((error, disconnectedDevice) => {
        if (disconnectedDevice) {
          this.handleDeviceDisconnected(disconnectedDevice);
        }
      });
  }

  public addOnReconnectCallback(callback: CallbackFunction): void {
    this.onReconnectCallbacks.push(callback);
  }

  public async startMonitoringConnection(): Promise<void> {
    if (this.connectionInterval) {
      console.log('Already monitoring connection');
      return;
    }

    // First, attempt to connect to the device
    try {
        console.log('Attempting initial connection...');
        await this.connectToDevice();
    } catch (error) {
        console.error('Error during initial connection:', error);
    }

    // Then, start the interval to monitor the connection
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
      if (this.onDeviceConnected) {
        this.onDeviceConnected(this.device);
      }
      await this.runOnReconnectCallbacks();
    } catch (error) {
      console.error('Error while reconnecting to the device:', error);
    }
  }

    // handle device disconnection
    private async handleDeviceDisconnected(disconnectedDevice: Device): Promise<void> {
        if (this.onDeviceDisconnected) {
          this.onDeviceDisconnected(disconnectedDevice);
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

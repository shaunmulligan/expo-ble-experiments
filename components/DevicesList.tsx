import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/Ionicons'; // Make sure to install react-native-vector-icons

interface DeviceListProps {
  devices: Device[];
  pairedIds: string[];
  connectedIds: string[];
  onAddDevice?: (device: Device) => void;
  onRemoveDevice?: (device: Device) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  pairedIds,
  connectedIds,
  onAddDevice,
  onRemoveDevice,
}) => {
  const renderItem = ({ item }: { item: Device }) => {
    const isPaired = pairedIds.includes(item.id);
    const isConnected = connectedIds.includes(item.id);

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Icon
          name="bluetooth"
          size={24}
          color={isConnected ? 'blue' : 'grey'} // Color based on connected state
        />
        <Text style={{ marginLeft: 10 }}>{item.name || 'Unknown device'}</Text>
        <TouchableOpacity
          onPress={() => (isPaired ? onRemoveDevice?.(item) : onAddDevice?.(item))}
          style={{ marginLeft: 10 }}
        >
          {isPaired ? (
            // Render trash can icon for paired devices
            <Icon name="trash" size={24} color="red" />
          ) : (
            // Render add icon for unpaired devices
            <Icon name="add-circle-outline" size={24} color="blue" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={devices}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default DeviceList;

import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/Ionicons'; // Import the Ionicons component

interface DeviceListProps {
  devices: Device[];
  pairedIds: string[];
  onAddDevice?: (device: Device) => void; // Optional callback for handling add device action
}

const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  pairedIds,
  onAddDevice,
}) => {
  const renderItem = ({ item }: { item: Device }) => {
    const isPaired = pairedIds.includes(item.id);
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>
          {item.name || 'Unknown device'} - {item.id}
        </Text>
        {!isPaired && onAddDevice && (
          <TouchableOpacity onPress={() => onAddDevice(item)} style={{ marginLeft: 10 }}>
            <Icon name="add-circle-outline" size={24} color="blue" />
          </TouchableOpacity>
        )}
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

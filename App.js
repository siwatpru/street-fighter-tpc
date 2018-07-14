import React from 'react';
import {StyleSheet, Text, View, TextInput, Button} from 'react-native';
import {Accelerometer, Gyroscope} from 'react-native-sensors';
import DeviceInfo from 'react-native-device-info';
import io from 'socket.io-client';

const INTERVAL = 10;

export default class App extends React.Component {
  state = {name: DeviceInfo.getModel(), recordState: 'idle', server: 'http://192.168.180.200:3000'};
  accelerationObservable = null;
  gyroscopeObservable = null;
  lastAccelTime = 0;
  lastGypoTime = 0;
  socket = null;

  onStopButtonPress() {
    socket.disconnect()
    accelerationObservable.stop()
    gyroscopeObservable.stop()
    this.setState({recordState: 'idle'})
  }

  onStartButtonPress() {
    this.setState({recordState: 'recording'})
    socket = io(this.state.server);
    socket.on('connect', () => {
      console.log('connected to socket.io server');
      socket.emit('config', {name: this.state.name})
    });

    new Accelerometer({updateInterval: INTERVAL})
      .then(observable => {
        accelerationObservable = observable;
        accelerationObservable.subscribe(data => {
          const {timestamp, x, y, z} = data;
          const {name} = this.state;
          if (timestamp > this.lastAccelTime) {
            socket.emit('data', {type: 'accel', timestamp, x, y, z});
            this.lastAccelTime = timestamp;
          }
        });
      })
      .catch(error => {
        console.log('The Accelerometer is not available');
      });
    new Gyroscope({updateInterval: INTERVAL})
      .then(observable => {
        gyroscopeObservable = observable;
        gyroscopeObservable.subscribe(data => {
          const {timestamp, x, y, z} = data;
          const {name} = this.state;
          if (timestamp > this.lastGypoTime) {
            socket.emit('data', {type: 'gyro', timestamp, x, y, z});
            this.lastGypoTime = timestamp;
          }
        });
      })
      .catch(error => {
        console.log('The Gyroscope is not available');
      });
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{height: 100}}
          value={this.state.server}
          onChangeText={server => this.setState({server})}
        />
        <TextInput
          style={{height: 100}}
          value={this.state.name}
          onChangeText={name => this.setState({name})}
        />
        <Text>{this.state.recordState}</Text>
        {this.state.recordState == 'idle' ? (
          <Button
            onPress={this.onStartButtonPress.bind(this)}
            title="start"
            color="#841584"
          />
        ) : (
          <Button
            onPress={this.onStopButtonPress.bind(this)}
            title="Stop"
            color="#841584"
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

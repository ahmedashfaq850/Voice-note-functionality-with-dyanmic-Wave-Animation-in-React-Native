import { useState } from "react";
import {
  View,
  StyleSheet,
  Button,
  FlatList,
  Text,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import AudioList from "@/components/AudioList";

export interface Memos {
  uri: string;
  metering: number[];
}

export default function index() {
  const [recording, setRecording] = useState<Recording>();
  const [memos, setMemos] = useState<Memos[]>([]);
  const [audioMetering, setAudioMetering] = useState<number[]>([]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100
      );
      setRecording(recording);
      console.log("Recording started");

      recording.setOnRecordingStatusUpdate((status) => {
        console.log(status.metering);
        if (status.metering) {
          setAudioMetering((currValue) => [
            ...currValue,
            status.metering || -100,
          ]);
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);

    if (uri) {
      setMemos((existingMemos) => [
        { uri, metering: audioMetering },
        ...existingMemos,
      ]);
      setAudioMetering([]);
    }
  }

  const AnimatedStyle = useAnimatedStyle(() => ({
    width: withTiming(recording ? 40 : 65),
    height: withTiming(recording ? 40 : 65),
    borderRadius: withTiming(recording ? 5 : 50),
  }));

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: 30 }}>
      <View style={styles.container}>
        <FlatList
          style={styles.listView}
          data={memos}
          renderItem={({ item }) => <AudioList memo={item} />}
        />

        <View style={styles.footer}>
          <Pressable
            style={styles.Button}
            onPress={recording ? stopRecording : startRecording}
          >
            <Animated.View
              style={[styles.underCircle, AnimatedStyle]}
            ></Animated.View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    height: 150,
  },
  Button: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: "gray",
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  underCircle: {
    backgroundColor: "orange",
  },
  listView: {
    flex: 1,
    paddingTop: 20,
  },
});

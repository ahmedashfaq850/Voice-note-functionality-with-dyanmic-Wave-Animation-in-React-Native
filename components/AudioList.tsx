import { Image, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { Memos } from "@/app";
import {
  Extrapolate,
  Extrapolation,
  interpolate,
} from "react-native-reanimated";
const playIcon = require("../assets/playIcon.png");
const pauseIcon = require("../assets/pauseIcon.png");

const AudioList = ({ memo }: { memo: Memos }) => {
  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();
  const [progress, setProgress] = useState(0);

  async function loadSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync(
      { uri: memo.uri },
      { progressUpdateIntervalMillis: 1000 / 60 },
      onPlayBackStatusUpdate
    );
    setSound(sound);
  }

  useEffect(() => {
    loadSound();
  }, [memo]);

  const onPlayBackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);

    if (status.isLoaded) {
      const currentPos = status.positionMillis || 0;
      const totalDuration = status.durationMillis || 1;
      setProgress((currentPos / totalDuration) * 95);

      if (status.didJustFinish) {
        setProgress(0);
        console.log("Finished");
      } else {
        console.log("Playing");
      }
    }
  };

  async function playSound() {
    if (!sound) {
      return;
    }
    console.log("Playing Sound");
    if (status?.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    } else {
      if (status?.isLoaded && status?.didJustFinish) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const convertMillisecondsToMinSec = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const isPlaying = status?.isLoaded && status.isPlaying;

  const currentLength = memo.metering.length;
  const criteriaValue = 30;
  if (currentLength < criteriaValue) {
    const dummyValue = -55;
    const prependCount = Math.floor((criteriaValue - currentLength) / 2);
    const prependArray = Array(prependCount).fill(dummyValue);
    const appendArray = Array(
      criteriaValue - currentLength - prependCount
    ).fill(dummyValue);
    memo.metering = [...prependArray, ...memo.metering, ...appendArray];
  }

  if (currentLength > 70) {
    memo.metering = memo.metering.slice(0, 70);
  }

  return (
    <View style={styles.listItem}>
      <TouchableOpacity onPress={playSound}>
        <Image
          source={isPlaying ? pauseIcon : playIcon}
          style={{ width: 50, height: 40 }}
        />
      </TouchableOpacity>
      <View style={styles.playbackContainer}>
        {/* <View style={styles.playBackBackground} /> */}
        <View style={styles.waves}>
          {memo.metering.map((db, index) => (
            <View
              key={index}
              style={[
                styles.waveItem,
                {
                  height: interpolate(db, [-60, 0], [5, 40]),
                },
              ]}
            />
          ))}
        </View>
        <View style={[styles.playBackIndicator, { left: `${progress}%` }]} />
        <Text style={styles.duration}>
          {!isPlaying &&
            convertMillisecondsToMinSec(
              (status?.isLoaded && status?.durationMillis) || 0
            )}
          {isPlaying &&
            convertMillisecondsToMinSec(
              (status?.isLoaded && status?.positionMillis) || 0
            )}
        </Text>
      </View>
    </View>
  );
};

export default AudioList;

const styles = StyleSheet.create({
  listItem: {
    padding: 10,
    height: 85,
    marginBottom: 10,
    justifyContent: "center",
    marginHorizontal: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  playbackContainer: {
    flex: 1,
    height: 30,
    justifyContent: "center",
  },
  playBackBackground: {
    backgroundColor: "lightgray",
    height: 4,
    borderRadius: 5,
  },
  playBackIndicator: {
    backgroundColor: "blue",
    width: 10,
    aspectRatio: 1,
    borderRadius: 50,
    position: "absolute",
  },
  duration: {
    position: "absolute",
    right: 0,
    color: "gray",
    bottom: -25,
  },
  waves: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveItem: {
    backgroundColor: "gainsboro",
    flex: 1,
    height: 30,
    borderRadius: 20,
  },
});

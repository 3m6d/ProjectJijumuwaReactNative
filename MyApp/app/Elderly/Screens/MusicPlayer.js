import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Volume, Volume1, Volume2, ChevronLeft, Music } from 'react-native-feather';
import Slider from '@react-native-community/slider';
import { fetchMusicList, playMusic, pauseMusic, resumeMusic, stopMusic, setVolume, initializePlayer } from '../Services/VoiceService';

const { width } = Dimensions.get('window');

const MusicPlayer = ({ navigation }) => {
  const [musicList, setMusicList] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolumeLevel] = useState(0.7);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const positionInterval = useRef(null);

  useEffect(() => {
    const setup = async () => {
      try {
        console.log('Starting MusicPlayer setup...');
        await initializePlayer();
        setIsPlayerReady(true);
        await loadMusicList();
      } catch (error) {
        console.error('MusicPlayer setup error:', error);
      }
    };
    setup();

    return () => {
      stopMusic();
      if (positionInterval.current) clearInterval(positionInterval.current);
    };
  }, []);

  const loadMusicList = async () => {
    if (!isPlayerReady) return;
    try {
      const music = await fetchMusicList();
      setMusicList(music);
      if (music.length > 0 && !currentTrack) setCurrentTrack(music[0]);
    } catch (error) {
      console.error('Error loading music list:', error);
    }
  };

  const updatePosition = async () => {
    if (positionInterval.current) clearInterval(positionInterval.current);
    positionInterval.current = setInterval(async () => {
      try {
        const pos = await TrackPlayer.getPosition();
        const dur = await TrackPlayer.getDuration();
        setPosition(pos);
        setDuration(dur);
        if (pos >= dur && dur > 0) {
          clearInterval(positionInterval.current);
          setIsPlaying(false);
          setPosition(0);
        }
      } catch (error) {
        console.error('Position update error:', error);
      }
    }, 1000);
  };

  const handlePlayPause = async () => {
    if (!isPlayerReady || !currentTrack) {
      console.log('Player not ready or no track selected');
      return;
    }
    if (isPlaying) {
      await pauseMusic();
      setIsPlaying(false);
      if (positionInterval.current) clearInterval(positionInterval.current);
    } else {
      if (position > 0) {
        await resumeMusic();
      } else {
        const { duration: trackDuration } = await playMusic(currentTrack.file_path);
        setDuration(trackDuration);
      }
      setIsPlaying(true);
      updatePosition();
    }
  };

  const handlePrevious = async () => {
    if (!isPlayerReady || !currentTrack || musicList.length === 0) return;
    const currentIndex = musicList.findIndex((track) => track.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : musicList.length - 1;

    await stopMusic();
    setPosition(0);
    setCurrentTrack(musicList[prevIndex]);
    if (isPlaying) {
      const { duration: trackDuration } = await playMusic(musicList[prevIndex].file_path);
      setDuration(trackDuration);
      updatePosition();
    }
  };

  const handleNext = async () => {
    if (!isPlayerReady || !currentTrack || musicList.length === 0) return;
    const currentIndex = musicList.findIndex((track) => track.id === currentTrack.id);
    const nextIndex = currentIndex < musicList.length - 1 ? currentIndex + 1 : 0;

    await stopMusic();
    setPosition(0);
    setCurrentTrack(musicList[nextIndex]);
    if (isPlaying) {
      const { duration: trackDuration } = await playMusic(musicList[nextIndex].file_path);
      setDuration(trackDuration);
      updatePosition();
    }
  };

  const handleSelectTrack = async (track) => {
    if (!isPlayerReady) return;
    if (currentTrack && track.id === currentTrack.id) {
      handlePlayPause();
      return;
    }
    await stopMusic();
    setPosition(0);
    setCurrentTrack(track);
    const { duration: trackDuration } = await playMusic(track.file_path);
    setDuration(trackDuration);
    setIsPlaying(true);
    updatePosition();
  };

  const handleVolumeChange = async (value) => {
    if (!isPlayerReady) return;
    setVolumeLevel(value);
    await setVolume(value);
  };

  const seekTo = async (value) => {
    if (!isPlayerReady) return;
    await TrackPlayer.seekTo(value);
    setPosition(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderVolumeIcon = () => {
    if (volume === 0) return <Volume width={24} height={24} color="#2E3A59" />;
    else if (volume < 0.5) return <Volume1 width={24} height={24} color="#2E3A59" />;
    else return <Volume2 width={24} height={24} color="#2E3A59" />;
  };

  const renderTrackItem = ({ item }) => {
    const isActive = currentTrack && item.id === currentTrack.id;
    return (
      <TouchableOpacity
        style={[styles.trackItem, isActive && styles.activeTrackItem]}
        onPress={() => handleSelectTrack(item)}
      >
        <Image source={{ uri: item.file_path }} style={styles.trackArtwork} />
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isActive && styles.activeTrackTitle]}>{item.title}</Text>
          <Text style={styles.trackArtist}>{item.artist || 'Unknown'}</Text>
        </View>
        {isActive && isPlaying && (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingText}>Playing</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!isPlayerReady) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading player...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft width={24} height={24} color="#2E3A59" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>संगीत</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.playerContainer}>
        {currentTrack ? (
          <>
            <Image source={{ uri: currentTrack.file_path }} style={styles.albumArt} />
            <Text style={styles.songTitle}>{currentTrack.title}</Text>
            <Text style={styles.artistName}>{currentTrack.artist || 'Unknown'}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                onSlidingComplete={seekTo}
                minimumTrackTintColor="#4A90E2"
                maximumTrackTintColor="#D8D8D8"
                thumbTintColor="#4A90E2"
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
                <SkipBack width={30} height={30} color="#2E3A59" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
                {isPlaying ? <Pause width={40} height={40} color="#fff" /> : <Play width={40} height={40} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
                <SkipForward width={30} height={30} color="#2E3A59" />
              </TouchableOpacity>
            </View>
            <View style={styles.volumeContainer}>
              {renderVolumeIcon()}
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                minimumTrackTintColor="#4A90E2"
                maximumTrackTintColor="#D8D8D8"
                thumbTintColor="#4A90E2"
                onValueChange={handleVolumeChange}
              />
            </View>
          </>
        ) : (
          <View style={styles.noTrackContainer}>
            <Music width={60} height={60} color="#8F9BB3" />
            <Text style={styles.noTrackText}>No track selected</Text>
          </View>
        )}
      </View>

      <View style={styles.playlistContainer}>
        <Text style={styles.playlistTitle}>भजन र कीर्तन</Text>
        <FlatList
          data={musicList}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.playlist}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E9F0' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2E3A59' },
  playerContainer: { alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 15, margin: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  albumArt: { width: width * 0.6, height: width * 0.6, borderRadius: 10, marginBottom: 20 },
  songTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E3A59', textAlign: 'center', marginBottom: 5 },
  artistName: { fontSize: 18, color: '#8F9BB3', textAlign: 'center', marginBottom: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  timeText: { fontSize: 14, color: '#8F9BB3', width: 40, textAlign: 'center' },
  progressBar: { flex: 1, height: 40 },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 },
  controlButton: { padding: 10 },
  playPauseButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginHorizontal: 30 },
  volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  volumeSlider: { flex: 1, height: 40, marginLeft: 10 },
  noTrackContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  noTrackText: { fontSize: 18, color: '#8F9BB3', marginTop: 10 },
  playlistContainer: { flex: 1, padding: 15 },
  playlistTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E3A59', marginBottom: 15 },
  playlist: { paddingBottom: 20 },
  trackItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  activeTrackItem: { backgroundColor: '#F0F7FF', borderLeftWidth: 5, borderLeftColor: '#4A90E2' },
  trackArtwork: { width: 60, height: 60, borderRadius: 5, marginRight: 15 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E3A59', marginBottom: 5 },
  activeTrackTitle: { color: '#4A90E2' },
  trackArtist: { fontSize: 14, color: '#8F9BB3' },
  playingIndicator: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  playingText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default MusicPlayer;
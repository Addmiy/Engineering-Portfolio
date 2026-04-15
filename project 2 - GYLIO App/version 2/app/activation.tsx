import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEvent, useEventListener } from 'expo';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { theme } from '../constants/theme';
import { saveLessonForVideo } from '../services/lessonService';
import { getAlarmSettingsWithDefaults } from '../services/storageService';
import { getPlayableVideoForTrait } from '../services/videoService';
import type { PlayableVideo } from '../types';

function ActivationPlayer({ video }: { video: PlayableVideo }) {
  const completingRef = useRef(false);
  const player = useVideoPlayer(video.videoUrl, (instance) => {
    instance.loop = false;
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  async function complete() {
    if (completingRef.current) {
      return;
    }

    completingRef.current = true;
    await saveLessonForVideo(video);
    router.replace('/');
  }

  useEventListener(player, 'playToEnd', complete);

  function replay() {
    completingRef.current = false;
    player.currentTime = 0;
    player.play();
  }

  return (
    <View style={styles.playerShell}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
      />
      <View style={styles.scrim} />
      <View style={styles.topBar}>
        <Text style={styles.trait}>{video.trait}</Text>
        <Pressable onPress={complete} hitSlop={12}>
          <Text style={styles.controlText}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.bottomBar}>
        <View style={styles.videoMeta}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoStatus}>{status === 'loading' ? 'Loading' : 'Morning activation'}</Text>
        </View>
        <View style={styles.controls}>
          <Pressable onPress={replay} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
            <Text style={styles.outlineButtonText}>Replay</Text>
          </Pressable>
          <Pressable onPress={complete} style={({ pressed }) => [styles.solidButton, pressed && styles.pressed]}>
            <Text style={styles.solidButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ActivationScreen() {
  const [video, setVideo] = useState<PlayableVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVideo() {
      try {
        const settings = await getAlarmSettingsWithDefaults();
        const selectedVideo = await getPlayableVideoForTrait(settings.selectedTrait);
        if (mounted) {
          setVideo(selectedVideo);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the morning video.');
        }
      }
    }

    loadVideo();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Video library unavailable.</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.solidButton, pressed && styles.pressed]}>
          <Text style={styles.solidButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.text} />
        <Text style={styles.loadingText}>Preparing your morning.</Text>
      </View>
    );
  }

  return <ActivationPlayer video={video} />;
}

const styles = StyleSheet.create({
  playerShell: {
    flex: 1,
    backgroundColor: '#000000'
  },
  video: {
    ...StyleSheet.absoluteFillObject
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)'
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl
  },
  trait: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase'
  },
  controlText: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 14
  },
  bottomBar: {
    marginTop: 'auto',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl
  },
  videoMeta: {
    marginBottom: theme.spacing.lg
  },
  videoTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 34
  },
  videoStatus: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 14,
    marginTop: theme.spacing.sm
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  outlineButton: {
    alignItems: 'center',
    borderColor: 'rgba(247,247,242,0.42)',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50
  },
  solidButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: theme.spacing.xl
  },
  outlineButtonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 14,
    fontWeight: '700'
  },
  solidButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.brand,
    fontSize: 14,
    fontWeight: '800'
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    marginTop: theme.spacing.md
  },
  errorTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.brand,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  errorBody: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.72
  }
});

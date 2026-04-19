import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import {
  FadeInView,
  MetaPill,
  OutlineIcon,
  PrimaryButton,
  SecondaryButton,
  Surface,
  textStyles
} from '../components/Primitives';
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
      <LinearGradient
        colors={['rgba(13,14,16,0.82)', 'rgba(13,14,16,0.20)', 'rgba(13,14,16,0.90)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <FadeInView delay={80} style={styles.topBar}>
        <MetaPill>{video.trait}</MetaPill>
        <Pressable onPress={complete} hitSlop={12} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </FadeInView>

      <FadeInView delay={160} style={styles.centerMeta}>
        <View style={styles.videoIcon}>
          <OutlineIcon name="video" color={theme.colors.text72} />
        </View>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoStatus}>{status === 'loading' ? 'Loading video' : 'Morning activation'}</Text>
      </FadeInView>

      <FadeInView delay={220} style={styles.bottomBar}>
        <View style={styles.controls}>
          <SecondaryButton label="Replay" icon="play" onPress={replay} style={styles.controlButton} />
          <PrimaryButton label="Continue" icon="check" onPress={complete} style={styles.controlButton} />
        </View>
      </FadeInView>
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
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.backgroundDeep]}
          style={StyleSheet.absoluteFill}
        />
        <FadeInView style={styles.errorContent}>
          <Surface gradient style={styles.errorSurface}>
            <View style={styles.errorIcon}>
              <OutlineIcon name="video" color={theme.colors.warning} />
            </View>
            <Text style={styles.errorTitle}>Video library unavailable.</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <PrimaryButton label="Continue" icon="check" onPress={() => router.replace('/')} />
          </Surface>
        </FadeInView>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.backgroundDeep]}
          style={StyleSheet.absoluteFill}
        />
        <FadeInView style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loadingText}>Preparing your morning.</Text>
        </FadeInView>
      </View>
    );
  }

  return <ActivationPlayer video={video} />;
}

const styles = StyleSheet.create({
  playerShell: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep
  },
  video: {
    ...StyleSheet.absoluteFillObject
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl
  },
  skipButton: {
    backgroundColor: 'rgba(236,239,241,0.06)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  skipText: {
    ...textStyles.caption,
    color: theme.colors.text72
  },
  centerMeta: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
    top: '38%'
  },
  videoIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,239,241,0.08)',
    borderRadius: theme.radius.md,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  videoTitle: {
    ...textStyles.display,
    textAlign: 'center'
  },
  videoStatus: {
    ...textStyles.body,
    textAlign: 'center'
  },
  bottomBar: {
    marginTop: 'auto',
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.xs
  },
  controlButton: {
    flex: 1
  },
  centered: {
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundDeep,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md
  },
  loadingCard: {
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  loadingText: {
    ...textStyles.body
  },
  errorContent: {
    width: '100%'
  },
  errorSurface: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm
  },
  errorIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(200,174,106,0.14)',
    borderRadius: theme.radius.md,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  errorTitle: {
    ...textStyles.title
  },
  errorBody: {
    ...textStyles.body
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  }
});

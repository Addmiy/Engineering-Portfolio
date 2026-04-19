import type { PlayableVideo, RemoteVideo } from '../types';
import { assertSupabaseConfigured, supabase } from './supabase';

const VIDEO_BUCKET = 'gylio-videos';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;

function pickRandomVideo(videos: RemoteVideo[]) {
  return videos[Math.floor(Math.random() * videos.length)];
}

async function assertVideoUrlReachable(videoUrl: string, videoPath: string) {
  const response = await fetch(videoUrl, {
    headers: {
      Range: 'bytes=0-0'
    }
  });

  if (response.ok || response.status === 206) {
    return;
  }

  throw new Error(`Video asset ${videoPath} is not available.`);
}

export async function fetchVideosByTrait(trait: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('trait', trait)
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RemoteVideo[];
}

export async function createPlayableVideoUrl(videoPath: string) {
  assertSupabaseConfigured();

  const { data: publicData } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath);
  if (publicData?.publicUrl) {
    try {
      await assertVideoUrlReachable(publicData.publicUrl, videoPath);
      return publicData.publicUrl;
    } catch {
      // Fall through to signed URLs for private buckets or stricter storage policies.
    }
  }

  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(videoPath, SIGNED_URL_TTL_SECONDS);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  throw new Error(error?.message || `Could not create a playable URL for ${videoPath}.`);
}

export async function getPlayableVideoForTrait(trait: string): Promise<PlayableVideo> {
  const videos = await fetchVideosByTrait(trait);
  const selected = pickRandomVideo(videos);

  if (!selected) {
    throw new Error(`No active videos were found for ${trait}.`);
  }

  const videoUrl = await createPlayableVideoUrl(selected.video_path);
  return { ...selected, videoUrl };
}

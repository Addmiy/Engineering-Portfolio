import { todayKey } from '../lib/date';
import type { DailyLesson, RemoteVideo } from '../types';
import { getDailyLesson, saveDailyLesson } from './storageService';

export function lessonFromVideo(video: RemoteVideo, date = todayKey()): DailyLesson {
  return {
    date,
    videoId: video.id,
    trait: video.trait,
    lessonTitle: video.lesson_title,
    lessonText: video.lesson_text,
    appliedTodayText: video.applied_today_text ?? undefined
  };
}

export async function saveLessonForVideo(video: RemoteVideo) {
  const lesson = lessonFromVideo(video);
  await saveDailyLesson(lesson);
  return lesson;
}

export async function getTodayLesson() {
  return getDailyLesson(todayKey());
}

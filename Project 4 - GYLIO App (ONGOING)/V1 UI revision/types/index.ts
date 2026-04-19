export type AlarmSettings = {
  time: string;
  enabled: boolean;
  selectedTrait: string;
};

export type DailyLesson = {
  date: string;
  videoId: string;
  trait: string;
  lessonTitle: string;
  lessonText: string;
  appliedTodayText?: string;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  date: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  content: string;
};

export type RemoteVideo = {
  id: string;
  title: string;
  trait: string;
  lesson_title: string;
  lesson_text: string;
  applied_today_text?: string | null;
  video_path: string;
  duration_seconds?: number | null;
  thumbnail_path?: string | null;
  is_active: boolean;
  created_at: string;
};

export type PlayableVideo = RemoteVideo & {
  videoUrl: string;
};

export type TraitOption = {
  label: string;
  value: string;
};

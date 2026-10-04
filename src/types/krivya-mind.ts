export interface MoodLog {
  id: string;
  date: string;
  mood: number;
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export interface KrivyaMindSettings {
  language: string;
  accessibilityMode: 'detailed' | 'short';
}

export interface RelationshipData {
  messages: number;
  pokes: number;
  memories: number;
  streak: number;
  loveScore: number;
  weekRange: string;
  partner1Name: string;
  partner2Name: string;
  partner1Image?: string | null;
  partner2Image?: string | null;
  customStory?: string; // Optional field for user context or customized narratives
}

export interface AISummary {
  title: string;
  subtitle: string;
  story: string;
  achievement: string;
  insight: string;
}

export interface WrappedResponse {
  data: RelationshipData;
  aiSummary: AISummary;
  theme: string;
}

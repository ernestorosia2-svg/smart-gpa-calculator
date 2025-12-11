export interface Course {
  id: string;
  name: string;
  credit: number;
  score: number;
  isPlanned?: boolean;
}

export interface ScoreDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ImportResult {
  courses: Omit<Course, 'id' | 'isPlanned'>[];
}
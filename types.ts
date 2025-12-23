// Fix: Implemented the missing type definitions for the application.
export interface Newsletter {
  id: string;
  sender: string;
  email: string;
  priority: number;
}

export enum ModelStatus {
  Running = 'Running',
  Idle = 'Idle',
  NotDownloaded = 'Not Downloaded',
}

export interface LocalModel {
  id: string;
  name: string;
  size: string;
  status: ModelStatus;
  isActive: boolean;
}

export interface SummaryPreferences {
  frequency: 'Daily' | 'Weekly';
  time: string;
  notifications: boolean;
}

export enum Screen {
  Home = 'Home',
  Dashboard = 'Dashboard',
  ModelManagement = 'ModelManagement',
  Settings = 'Settings',
  About = 'About',
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  linkedIn: string;
  x_post: string;
  branding_tag: string;
  action_suggestion: string;
  score: number;
  date_iso: string;
  sender_email: string;
  processed_at: string;
}
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskActivity {
  id: string;
  action: string;
  details: string;
  userEmail: string;
  timestamp: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'url';
  uploadedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  activities: TaskActivity[];
  attachments: TaskAttachment[];
}

export interface User {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

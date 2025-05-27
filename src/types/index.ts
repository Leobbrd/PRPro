// Shared type definitions
import { 
  UserRole, 
  ProjectStatus, 
  EventStatus, 
  FileCategory, 
  ApprovalStatus,
  ScheduleSlotStatus,
  NotificationType 
} from '@prisma/client'

// User types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  adminProjects?: Project[]
  uploadedFiles?: File[]
}

// Project types
export interface Project {
  id: string
  name: string
  description?: string
  uniqueUrl: string
  adminId: string
  status: ProjectStatus
  settings: ProjectSettings
  createdAt: string
  updatedAt: string
  admin?: User
  events?: Event[]
  files?: File[]
  scheduleSlots?: ScheduleSlot[]
  _count?: {
    files: number
    events: number
    scheduleSlots?: number
  }
}

export interface ProjectSettings {
  scheduleAdjustmentEnabled: boolean
  autoApproval: boolean
  deadlineNotifications: boolean
}

// Event types
export interface Event {
  id: string
  projectId: string
  title: string
  description?: string
  eventDate: string
  venue: string
  capacity: number
  requirements?: string
  status: EventStatus
  createdAt: string
  updatedAt: string
  project?: Project
}

// File types
export interface File {
  id: string
  projectId: string
  uploadedById: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  category: FileCategory
  approvalStatus: ApprovalStatus
  approvalComment?: string
  createdAt: string
  updatedAt: string
  project?: Project
  uploadedBy?: User
}

// Schedule types
export interface ScheduleSlot {
  id: string
  projectId: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  status: ScheduleSlotStatus
  createdAt: string
  updatedAt: string
  project?: Project
  bookings?: Booking[]
}

export interface Booking {
  id: string
  scheduleSlotId: string
  userId: string
  notes?: string
  createdAt: string
  updatedAt: string
  scheduleSlot?: ScheduleSlot
  user?: User
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: any
  createdAt: string
  user?: User
}

// API response types
export interface APIResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: PaginationMeta
}

// Auth types
export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

// Form types
export interface CreateProjectForm {
  name: string
  description?: string
}

export interface UpdateProjectForm extends Partial<CreateProjectForm> {
  status?: ProjectStatus
  settings?: Partial<ProjectSettings>
}

export interface CreateEventForm {
  title: string
  description?: string
  eventDate: string
  venue: string
  capacity: number
  requirements?: string
}

export interface FileUploadForm {
  projectId: string
  category: FileCategory
  file: File
}

// Query parameters
export interface ProjectsQuery {
  page?: number
  limit?: number
  status?: ProjectStatus
}

export interface FilesQuery {
  page?: number
  limit?: number
  category?: FileCategory
  status?: ApprovalStatus
}

// Constants
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
  ADMIN: 'ADMIN' as const,
  USER: 'USER' as const,
  GUEST: 'GUEST' as const,
}

export const PROJECT_STATUS = {
  DRAFT: 'DRAFT' as const,
  ACTIVE: 'ACTIVE' as const,
  COMPLETED: 'COMPLETED' as const,
  ARCHIVED: 'ARCHIVED' as const,
}

export const FILE_CATEGORIES = {
  OFFICIAL_MATERIALS: 'OFFICIAL_MATERIALS' as const,
  PRESS_RELEASE: 'PRESS_RELEASE' as const,
  IMAGES: 'IMAGES' as const,
  VIDEOS: 'VIDEOS' as const,
  DOCUMENTS: 'DOCUMENTS' as const,
  PROPOSALS: 'PROPOSALS' as const,
}

export const APPROVAL_STATUS = {
  DRAFT: 'DRAFT' as const,
  SUBMITTED: 'SUBMITTED' as const,
  UNDER_REVIEW: 'UNDER_REVIEW' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  REVISION_REQUESTED: 'REVISION_REQUESTED' as const,
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
import { UserRole } from '@prisma/client'

export enum Permission {
  // User management
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  VIEW_ALL_USERS = 'view_all_users',
  
  // Project management
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  VIEW_ALL_PROJECTS = 'view_all_projects',
  MANAGE_PROJECT_MEMBERS = 'manage_project_members',
  
  // File management
  UPLOAD_FILE = 'upload_file',
  APPROVE_FILE = 'approve_file',
  DELETE_FILE = 'delete_file',
  VIEW_ALL_FILES = 'view_all_files',
  
  // Schedule management
  CREATE_SCHEDULE = 'create_schedule',
  UPDATE_SCHEDULE = 'update_schedule',
  DELETE_SCHEDULE = 'delete_schedule',
  MANAGE_BOOKINGS = 'manage_bookings',
  
  // System administration
  SYSTEM_CONFIG = 'system_config',
  VIEW_LOGS = 'view_logs',
  MANAGE_NOTIFICATIONS = 'manage_notifications',
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.CREATE_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.VIEW_ALL_PROJECTS,
    Permission.MANAGE_PROJECT_MEMBERS,
    Permission.UPLOAD_FILE,
    Permission.APPROVE_FILE,
    Permission.DELETE_FILE,
    Permission.VIEW_ALL_FILES,
    Permission.CREATE_SCHEDULE,
    Permission.UPDATE_SCHEDULE,
    Permission.DELETE_SCHEDULE,
    Permission.MANAGE_BOOKINGS,
    Permission.SYSTEM_CONFIG,
    Permission.VIEW_LOGS,
    Permission.MANAGE_NOTIFICATIONS,
  ],
  
  [UserRole.ADMIN]: [
    // Admin can manage projects and users but not system config
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.CREATE_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.VIEW_ALL_PROJECTS,
    Permission.MANAGE_PROJECT_MEMBERS,
    Permission.UPLOAD_FILE,
    Permission.APPROVE_FILE,
    Permission.DELETE_FILE,
    Permission.VIEW_ALL_FILES,
    Permission.CREATE_SCHEDULE,
    Permission.UPDATE_SCHEDULE,
    Permission.DELETE_SCHEDULE,
    Permission.MANAGE_BOOKINGS,
    Permission.MANAGE_NOTIFICATIONS,
  ],
  
  [UserRole.USER]: [
    // Regular user can only manage their own content
    Permission.CREATE_PROJECT,
    Permission.UPDATE_PROJECT, // Only their own projects
    Permission.UPLOAD_FILE,
    Permission.CREATE_SCHEDULE, // Only for their projects
    Permission.UPDATE_SCHEDULE, // Only for their projects
  ],
  
  [UserRole.GUEST]: [
    // Guest can only view
  ],
}

export class PermissionService {
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  }

  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  static canAccessResource(
    userRole: UserRole,
    resourceOwnerId: string,
    currentUserId: string,
    adminPermission: Permission
  ): boolean {
    // Owner can always access their own resources
    if (resourceOwnerId === currentUserId) {
      return true
    }

    // Check if user has admin permission to access others' resources
    return this.hasPermission(userRole, adminPermission)
  }

  static getPermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || []
  }

  static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
  }

  static isSuperAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.SUPER_ADMIN
  }
}

// Middleware helper for checking permissions
export function requirePermission(permission: Permission) {
  return (userRole: UserRole): boolean => {
    return PermissionService.hasPermission(userRole, permission)
  }
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (userRole: UserRole): boolean => {
    return PermissionService.hasAnyPermission(userRole, permissions)
  }
}

export function requireAllPermissions(...permissions: Permission[]) {
  return (userRole: UserRole): boolean => {
    return PermissionService.hasAllPermissions(userRole, permissions)
  }
}
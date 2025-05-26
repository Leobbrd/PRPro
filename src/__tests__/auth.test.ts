import { AuthService } from '@/lib/auth'
import { PermissionService, Permission } from '@/lib/permissions'
import { UserRole } from '@prisma/client'

// Mock JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key'

describe('AuthService', () => {
  describe('Password hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await AuthService.hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(20)
    })

    it('should verify password correctly', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await AuthService.hashPassword(password)
      
      const isValid = await AuthService.verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
      
      const isInvalid = await AuthService.verifyPassword('wrongPassword', hashedPassword)
      expect(isInvalid).toBe(false)
    })
  })

  describe('JWT Token management', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'USER' as const,
    }

    it('should generate access token', () => {
      const token = AuthService.generateAccessToken(testPayload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should generate refresh token', () => {
      const token = AuthService.generateRefreshToken(testPayload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should verify token correctly', () => {
      const token = AuthService.generateAccessToken(testPayload)
      const payload = AuthService.verifyToken(token)
      
      expect(payload).toBeDefined()
      expect(payload?.userId).toBe(testPayload.userId)
      expect(payload?.email).toBe(testPayload.email)
      expect(payload?.role).toBe(testPayload.role)
    })

    it('should return null for invalid token', () => {
      const payload = AuthService.verifyToken('invalid-token')
      expect(payload).toBeNull()
    })
  })
})

describe('PermissionService', () => {
  describe('Role permissions', () => {
    it('should allow SUPER_ADMIN all permissions', () => {
      const role = UserRole.SUPER_ADMIN
      expect(PermissionService.hasPermission(role, Permission.CREATE_USER)).toBe(true)
      expect(PermissionService.hasPermission(role, Permission.SYSTEM_CONFIG)).toBe(true)
      expect(PermissionService.hasPermission(role, Permission.DELETE_PROJECT)).toBe(true)
    })

    it('should restrict ADMIN from system config', () => {
      const role = UserRole.ADMIN
      expect(PermissionService.hasPermission(role, Permission.CREATE_USER)).toBe(true)
      expect(PermissionService.hasPermission(role, Permission.SYSTEM_CONFIG)).toBe(false)
      expect(PermissionService.hasPermission(role, Permission.DELETE_PROJECT)).toBe(true)
    })

    it('should restrict USER to basic permissions', () => {
      const role = UserRole.USER
      expect(PermissionService.hasPermission(role, Permission.CREATE_PROJECT)).toBe(true)
      expect(PermissionService.hasPermission(role, Permission.CREATE_USER)).toBe(false)
      expect(PermissionService.hasPermission(role, Permission.DELETE_PROJECT)).toBe(false)
    })

    it('should restrict GUEST to no permissions', () => {
      const role = UserRole.GUEST
      expect(PermissionService.hasPermission(role, Permission.CREATE_PROJECT)).toBe(false)
      expect(PermissionService.hasPermission(role, Permission.UPLOAD_FILE)).toBe(false)
    })
  })

  describe('Permission checks', () => {
    it('should check if user is admin', () => {
      expect(PermissionService.isAdmin(UserRole.SUPER_ADMIN)).toBe(true)
      expect(PermissionService.isAdmin(UserRole.ADMIN)).toBe(true)
      expect(PermissionService.isAdmin(UserRole.USER)).toBe(false)
      expect(PermissionService.isAdmin(UserRole.GUEST)).toBe(false)
    })

    it('should check resource access', () => {
      const ownerId = 'owner-id'
      const currentUserId = 'current-user-id'
      const adminUserId = 'admin-user-id'

      // Owner can access their own resource
      expect(PermissionService.canAccessResource(
        UserRole.USER,
        ownerId,
        ownerId,
        Permission.VIEW_ALL_PROJECTS
      )).toBe(true)

      // Non-owner without admin permission cannot access
      expect(PermissionService.canAccessResource(
        UserRole.USER,
        ownerId,
        currentUserId,
        Permission.VIEW_ALL_PROJECTS
      )).toBe(false)

      // Admin can access others' resources
      expect(PermissionService.canAccessResource(
        UserRole.ADMIN,
        ownerId,
        adminUserId,
        Permission.VIEW_ALL_PROJECTS
      )).toBe(true)
    })
  })
})
/**
 * 用户系统类型定义
 * 用于支持用户认证、会话管理和API配置隔离
 */

/**
 * 用户接口
 */
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

/**
 * 用户认证信息
 */
export interface UserAuth {
  email: string
  password: string
}

/**
 * 用户注册信息
 */
export interface UserRegistration extends UserAuth {
  username: string
  confirmPassword: string
}

/**
 * 用户会话信息
 */
export interface UserSession {
  userId: string
  email: string
  username: string
  token: string
  expiresAt: Date
}

/**
 * 用户API配置
 * 为每个用户独立存储API配置
 */
export interface UserApiConfig {
  id: string
  userId: string
  provider: string
  name: string
  description: string
  apiKey: string
  apiBase?: string
  model?: string
  serviceProvider?: string
  isActive: boolean
  isConfigured: boolean
  lastTested?: Date
  testStatus?: 'success' | 'error' | 'pending'
  testMessage?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 登录表单数据
 */
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

/**
 * 注册表单数据
 */
export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

/**
 * 认证状态
 */
export interface AuthState {
  user: User | null
  session: UserSession | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

/**
 * 用户配置概览
 */
export interface UserConfigOverview {
  userId: string
  totalConfigs: number
  activeConfigs: number
  configuredProviders: string[]
  lastUpdated: Date
}

/**
 * API配置导入/导出（用户版本）
 */
export interface UserApiConfigExport {
  userId: string
  version: string
  timestamp: Date
  configs: Array<{
    provider: string
    name: string
    apiBase?: string
    model?: string
    serviceProvider?: string
    hasApiKey: boolean
  }>
}

/**
 * 用户设置
 */
export interface UserSettings {
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  emailNotifications: boolean
  autoSaveConfigs: boolean
  sessionTimeout: number // 分钟
  createdAt: Date
  updatedAt: Date
}

/**
 * 默认用户设置
 */
export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  theme: 'system',
  language: 'zh',
  emailNotifications: true,
  autoSaveConfigs: true,
  sessionTimeout: 30 * 24 * 60 // 30天
}

/**
 * 验证规则
 */
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址'
  },
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
    message: '用户名只能包含字母、数字、下划线和中文字符'
  },
  password: {
    minLength: 6,
    maxLength: 50,
    pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
    message: '密码必须包含字母和数字，长度6-50位'
  }
}

/**
 * API错误代码
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

/**
 * API响应接口
 */
export interface AuthResponse {
  success: boolean
  data?: any
  error?: {
    code: AuthErrorCode
    message: string
    details?: any
  }
  timestamp: Date
}
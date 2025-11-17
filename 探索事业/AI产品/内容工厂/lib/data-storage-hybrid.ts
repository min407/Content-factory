/**
 * 混合数据存储服务
 * 根据环境自动选择存储方案：本地使用文件存储，Vercel使用内存存储
 */

import { User, UserSession } from '@/types/user'
import { ApiConfig } from '@/types/api-config'

// 检查是否在Vercel环境
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1'
}

// 动态导入存储模块
async function getStorage() {
  if (isVercelEnvironment()) {
    // Vercel环境使用内存存储
    const { UserStorage, PasswordStorage, SessionStorage, UserConfigStorage, initializeStorage } = await import('./vercel-data-storage')
    return { UserStorage, PasswordStorage, SessionStorage, UserConfigStorage, initializeStorage }
  } else {
    // 本地环境使用文件存储
    const { UserStorage, PasswordStorage, SessionStorage, UserConfigStorage, initializeStorage } = await import('./data-storage')
    return { UserStorage, PasswordStorage, SessionStorage, UserConfigStorage, initializeStorage }
  }
}

// 导出存储类（异步）
export class HybridUserStorage {
  static async getUsers() {
    const { UserStorage } = await getStorage()
    return UserStorage.getUsers()
  }

  static async saveUsers(users: User[]) {
    const { UserStorage } = await getStorage()
    return UserStorage.saveUsers(users)
  }

  static async findUser(email: string) {
    const { UserStorage } = await getStorage()
    return UserStorage.findUser(email)
  }

  static async addUser(user: User) {
    const { UserStorage } = await getStorage()
    return UserStorage.addUser(user)
  }

  static async updateUser(userId: string, updates: Partial<User>) {
    const { UserStorage } = await getStorage()
    return UserStorage.updateUser(userId, updates)
  }
}

export class HybridPasswordStorage {
  static async getPasswords() {
    const { PasswordStorage } = await getStorage()
    return PasswordStorage.getPasswords()
  }

  static async savePasswords(passwords: Record<string, string>) {
    const { PasswordStorage } = await getStorage()
    return PasswordStorage.savePasswords(passwords)
  }

  static async setPassword(userId: string, password: string) {
    const { PasswordStorage } = await getStorage()
    return PasswordStorage.setPassword(userId, password)
  }

  static async verifyPassword(userId: string, password: string) {
    const { PasswordStorage } = await getStorage()
    return PasswordStorage.verifyPassword(userId, password)
  }
}

export class HybridSessionStorage {
  static async getSessions() {
    const { SessionStorage } = await getStorage()
    return SessionStorage.getSessions()
  }

  static async saveSessions(sessions: UserSession[]) {
    const { SessionStorage } = await getStorage()
    return SessionStorage.saveSessions(sessions)
  }

  static async getSession(token: string) {
    const { SessionStorage } = await getStorage()
    return SessionStorage.getSession(token)
  }

  static async createSession(session: UserSession) {
    const { SessionStorage } = await getStorage()
    return SessionStorage.createSession(session)
  }

  static async deleteSession(token: string) {
    const { SessionStorage } = await getStorage()
    return SessionStorage.deleteSession(token)
  }

  static async cleanupExpiredSessions() {
    const { SessionStorage } = await getStorage()
    return SessionStorage.cleanupExpiredSessions()
  }
}

export class HybridUserConfigStorage {
  static async getUserConfigs(userId: string) {
    const { UserConfigStorage } = await getStorage()
    return UserConfigStorage.getUserConfigs(userId)
  }

  static async saveUserConfigs(userId: string, configs: ApiConfig[]) {
    const { UserConfigStorage } = await getStorage()
    return UserConfigStorage.saveUserConfigs(userId, configs)
  }

  static async updateConfig(userId: string, config: ApiConfig) {
    const { UserConfigStorage } = await getStorage()
    return UserConfigStorage.updateConfig(userId, config)
  }

  static async deleteConfig(userId: string, provider: string) {
    const { UserConfigStorage } = await getStorage()
    return UserConfigStorage.deleteConfig(userId, provider)
  }
}

export async function initializeStorage(): Promise<void> {
  const { initializeStorage } = await getStorage()
  return initializeStorage()
}

// 为了兼容性，导出原始类名
export const UserStorage = HybridUserStorage
export const PasswordStorage = HybridPasswordStorage
export const SessionStorage = HybridSessionStorage
export const UserConfigStorage = HybridUserConfigStorage
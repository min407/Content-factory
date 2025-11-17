/**
 * 数据持久化服务
 * 使用JSON文件存储用户数据，确保服务器重启后数据不丢失
 */

import fs from 'fs/promises'
import path from 'path'
import { User, UserSession } from '@/types/user'
import { ApiConfig } from '@/types/api-config'

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json')
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.json')
const USER_CONFIGS_FILE = path.join(DATA_DIR, 'user-configs.json')

interface StorageData {
  users: User[]
  sessions: UserSession[]
  passwords: Record<string, string>
  userConfigs: Record<string, ApiConfig[]>
}

/**
 * 确保数据目录存在
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    console.log('📁 创建数据目录:', DATA_DIR)
  }
}

/**
 * 从文件读取数据
 */
async function readDataFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      // 文件不存在，返回默认值并创建文件
      await writeDataFile(filePath, defaultValue)
      return defaultValue
    }
    console.error(`❌ 读取数据文件失败: ${filePath}`, error)
    return defaultValue
  }
}

/**
 * 写入数据到文件
 */
async function writeDataFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`❌ 写入数据文件失败: ${filePath}`, error)
    throw error
  }
}

/**
 * 用户数据存储服务
 */
export class UserStorage {
  /**
   * 获取所有用户
   */
  static async getUsers(): Promise<User[]> {
    return await readDataFile(USERS_FILE, [])
  }

  /**
   * 保存用户列表
   */
  static async saveUsers(users: User[]): Promise<void> {
    await writeDataFile(USERS_FILE, users)
    console.log(`💾 保存 ${users.length} 个用户数据`)
  }

  /**
   * 查找用户
   */
  static async findUser(email: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(user => user.email === email) || null
  }

  /**
   * 添加用户
   */
  static async addUser(user: User): Promise<void> {
    const users = await this.getUsers()
    const existingUser = users.find(u => u.email === user.email)

    if (existingUser) {
      throw new Error('用户已存在')
    }

    users.push(user)
    await this.saveUsers(users)
    console.log('✅ 新用户注册成功:', user.email)
  }

  /**
   * 更新用户
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const users = await this.getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error('用户不存在')
    }

    users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() }
    await this.saveUsers(users)
    console.log('✅ 用户数据更新成功:', userId)
  }
}

/**
 * 密码存储服务
 */
export class PasswordStorage {
  /**
   * 获取所有密码
   */
  static async getPasswords(): Promise<Record<string, string>> {
    return await readDataFile(PASSWORDS_FILE, {})
  }

  /**
   * 保存密码映射
   */
  static async savePasswords(passwords: Record<string, string>): Promise<void> {
    await writeDataFile(PASSWORDS_FILE, passwords)
  }

  /**
   * 设置用户密码
   */
  static async setPassword(userId: string, password: string): Promise<void> {
    const passwords = await this.getPasswords()
    passwords[userId] = password // 实际应用中应存储密码哈希
    await this.savePasswords(passwords)
    console.log('🔐 设置用户密码成功:', userId)
  }

  /**
   * 验证用户密码
   */
  static async verifyPassword(userId: string, password: string): Promise<boolean> {
    const passwords = await this.getPasswords()
    const storedPassword = passwords[userId]
    return storedPassword === password // 简化比较，生产环境应使用密码哈希
  }
}

/**
 * 会话存储服务
 */
export class SessionStorage {
  /**
   * 获取所有会话
   */
  static async getSessions(): Promise<UserSession[]> {
    return await readDataFile(SESSIONS_FILE, [])
  }

  /**
   * 保存会话列表
   */
  static async saveSessions(sessions: UserSession[]): Promise<void> {
    await writeDataFile(SESSIONS_FILE, sessions)
  }

  /**
   * 获取用户会话
   */
  static async getSession(token: string): Promise<UserSession | null> {
    const sessions = await this.getSessions()
    const session = sessions.find(s => s.token === token)

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session
  }

  /**
   * 创建会话
   */
  static async createSession(session: UserSession): Promise<void> {
    const sessions = await this.getSessions()

    // 删除该用户的旧会话
    const filteredSessions = sessions.filter(s => s.userId !== session.userId)
    filteredSessions.push(session)

    await this.saveSessions(filteredSessions)
    console.log('✅ 创建会话成功:', session.token.substring(0, 20) + '...')
  }

  /**
   * 删除会话
   */
  static async deleteSession(token: string): Promise<void> {
    const sessions = await this.getSessions()
    const filteredSessions = sessions.filter(s => s.token !== token)
    await this.saveSessions(filteredSessions)
    console.log('🗑️ 删除会话成功:', token.substring(0, 20) + '...')
  }

  /**
   * 清理过期会话
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const sessions = await this.getSessions()
    const now = new Date()
    const validSessions = sessions.filter(s => s.expiresAt > now)

    if (validSessions.length < sessions.length) {
      await this.saveSessions(validSessions)
      console.log(`🧹 清理 ${sessions.length - validSessions.length} 个过期会话`)
    }
  }
}

/**
 * 用户API配置存储服务
 */
export class UserConfigStorage {
  /**
   * 获取用户API配置
   */
  static async getUserConfigs(userId: string): Promise<ApiConfig[]> {
    const allConfigs = await readDataFile(USER_CONFIGS_FILE, {} as Record<string, ApiConfig[]>)
    return allConfigs[userId] || []
  }

  /**
   * 保存用户API配置
   */
  static async saveUserConfigs(userId: string, configs: ApiConfig[]): Promise<void> {
    const allConfigs = await readDataFile(USER_CONFIGS_FILE, {} as Record<string, ApiConfig[]>)
    allConfigs[userId] = configs
    await writeDataFile(USER_CONFIGS_FILE, allConfigs)
    console.log(`💾 保存用户 ${userId} 的 ${configs.length} 个API配置`)
  }

  /**
   * 更新单个API配置
   */
  static async updateConfig(userId: string, config: ApiConfig): Promise<void> {
    const configs = await this.getUserConfigs(userId)
    const existingIndex = configs.findIndex(c => c.provider === config.provider)

    if (existingIndex >= 0) {
      configs[existingIndex] = { ...config, updatedAt: new Date() }
    } else {
      configs.push(config)
    }

    await this.saveUserConfigs(userId, configs)
    console.log(`✅ 更新用户 ${userId} 的API配置: ${config.provider}`)
  }

  /**
   * 删除API配置
   */
  static async deleteConfig(userId: string, provider: string): Promise<void> {
    const configs = await this.getUserConfigs(userId)
    const filteredConfigs = configs.filter(c => c.provider !== provider)
    await this.saveUserConfigs(userId, filteredConfigs)
    console.log(`🗑️ 删除用户 ${userId} 的API配置: ${provider}`)
  }
}

/**
 * 数据初始化
 */
export async function initializeStorage(): Promise<void> {
  await ensureDataDir()
  console.log('🗄️ 数据存储系统初始化完成')
}
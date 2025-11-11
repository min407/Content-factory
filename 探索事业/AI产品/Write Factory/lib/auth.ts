// 用户类型定义
export interface User {
  id: string
  username: string
  email: string
  apiKey?: string
  createdAt: number
  lastLoginAt?: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// 用户管理工具类
export class UserManager {
  private static readonly STORAGE_KEY = 'content_factory_user'
  private static readonly USERS_KEY = 'content_factory_users'

  // 获取当前用户
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }

  // 保存认证状态
  static saveCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
  }

  // 退出登录
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // 获取所有用户
  static getAllUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  // 保存所有用户
  private static saveAllUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  // 查找用户（用户名或邮箱）
  static findUser(usernameOrEmail: string): User | null {
    const users = this.getAllUsers()
    return users.find(user =>
      user.username === usernameOrEmail ||
      user.email === usernameOrEmail
    ) || null
  }

  // 简单密码哈希（实际项目中应使用更安全的方法）
  private static hashPassword(password: string): string {
    return btoa(password + 'salt_simple_hash') // 简单哈希，仅用于演示
  }

  // 验证密码
  private static verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword
  }

  // 注册用户
  static register(username: string, email: string, password: string): { success: boolean; error?: string } {
    // 检查用户名和邮箱是否已存在
    if (this.findUser(username)) {
      return { success: false, error: '用户名已存在' }
    }

    if (this.findUser(email)) {
      return { success: false, error: '邮箱已被注册' }
    }

    // 创建新用户
    const users = this.getAllUsers()
    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      createdAt: Date.now(),
    }

    // 保存用户信息（包含哈希密码）
    users.push({
      ...newUser,
      passwordHash: this.hashPassword(password) // 临时存储，实际保存时会去掉
    } as any)

    this.saveAllUsers(users)

    // 自动登录
    this.saveCurrentUser(newUser)

    return { success: true }
  }

  // 登录
  static login(usernameOrEmail: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers()
    const foundUser = users.find(user =>
      (user.username === usernameOrEmail || user.email === usernameOrEmail) &&
      'passwordHash' in user
    )

    if (!foundUser) {
      return { success: false, error: '用户不存在' }
    }

    const userWithPassword = foundUser as User & { passwordHash: string }

    if (!this.verifyPassword(password, userWithPassword.passwordHash)) {
      return { success: false, error: '密码错误' }
    }

    // 移除密码哈希，创建干净的用户对象
    const cleanUser: User = {
      id: userWithPassword.id,
      username: userWithPassword.username,
      email: userWithPassword.email,
      apiKey: userWithPassword.apiKey,
      createdAt: userWithPassword.createdAt,
      lastLoginAt: Date.now()
    }

    this.saveCurrentUser(cleanUser)

    return { success: true, user: cleanUser }
  }

  // 更新用户API Key
  static updateApiKey(apiKey: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    // 更新当前用户
    user.apiKey = apiKey
    this.saveCurrentUser(user)

    // 更新用户列表中的对应记录
    const users = this.getAllUsers()
    const userIndex = users.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex].apiKey = apiKey
      this.saveAllUsers(users)
    }

    return true
  }

  // 获取用户API Key
  static getUserApiKey(): string | undefined {
    const user = this.getCurrentUser()
    return user?.apiKey || undefined
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  // 初始化默认用户（如果没有任何用户）
  static initializeDefaultUser(): void {
    const users = this.getAllUsers()
    if (users.length === 0) {
      // 创建默认演示用户
      this.register('demo', 'demo@example.com', '123456')
    }
  }
}
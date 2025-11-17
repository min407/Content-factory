import { NextRequest, NextResponse } from 'next/server'
import { UserRegistration, User, AuthResponse, AuthErrorCode, VALIDATION_RULES } from '@/types/user'
import { UserStorage, PasswordStorage, SessionStorage, initializeStorage } from '@/lib/data-storage'

/**
 * 生成用户ID
 */
function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 生成会话令牌
 */
function generateSessionToken(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)
}

/**
 * 验证注册数据
 */
async function validateRegistration(data: UserRegistration): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []
  const users = await UserStorage.getUsers()

  // 验证邮箱
  if (!data.email) {
    errors.push('邮箱不能为空')
  } else if (!VALIDATION_RULES.email.pattern.test(data.email)) {
    errors.push(VALIDATION_RULES.email.message)
  }

  // 验证密码
  if (!data.password) {
    errors.push('密码不能为空')
  } else if (data.password.length < VALIDATION_RULES.password.minLength) {
    errors.push('密码长度不能少于' + VALIDATION_RULES.password.minLength + '位')
  }

  // 验证用户名
  if (!data.username) {
    errors.push('用户名不能为空')
  } else if (data.username.length < 2) {
    errors.push('用户名长度不能少于2位')
  } else if (data.username.length > 20) {
    errors.push('用户名长度不能超过20位')
  }

  // 检查邮箱是否已存在
  if (users.some(user => user.email === data.email)) {
    errors.push('该邮箱已被注册')
  }

  // 检查用户名是否已存在
  if (users.some(user => user.username === data.username)) {
    errors.push('该用户名已被使用')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 创建新用户
 */
async function createUser(data: UserRegistration): Promise<User> {
  const now = new Date()
  const user: User = {
    id: generateUserId(),
    email: data.email,
    username: data.username,
    createdAt: now,
    updatedAt: now,
    isActive: true
  }

  await UserStorage.addUser(user)
  return user
}

/**
 * POST /api/auth/register - 用户注册
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [注册接口] 收到用户注册请求')

    // 确保数据存储已初始化
    await initializeStorage()

    const body: UserRegistration = await request.json()
    console.log('📝 [注册接口] 注册数据:', {
      email: body.email,
      username: body.username,
      hasPassword: !!body.password
    })

    // 验证请求数据
    const validation = await validateRegistration(body)
    if (!validation.isValid) {
      console.log('❌ [注册接口] 数据验证失败:', validation.errors)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.VALIDATION_ERROR,
          message: validation.errors.join('; ')
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 400 })
    }

    // 创建用户
    const user = await createUser(body)

    // 保存密码（实际应用中应存储密码哈希）
    await PasswordStorage.setPassword(user.id, body.password)
    console.log('🔐 [注册接口] 用户密码保存成功')

    // 创建会话（注册后自动登录）
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天

    const session = {
      userId: user.id,
      email: user.email,
      username: user.username,
      token: sessionToken,
      expiresAt
    }

    await SessionStorage.createSession(session)
    console.log('✅ [注册接口] 创建会话成功:', sessionToken.substring(0, 20) + '...')

    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
        },
        session: {
          token: sessionToken,
          expiresAt
        }
      },
      timestamp: new Date()
    }

    // 创建响应
    const nextResponse = NextResponse.json(response)

    // 设置HTTP-only的session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30天
    }

    nextResponse.cookies.set('session_token', sessionToken, cookieOptions)

    console.log('🍪 [注册接口] 设置会话Cookie')

    return nextResponse

  } catch (error) {
    console.error('❌ [注册接口] 服务器错误:', error)

    const response: AuthResponse = {
      success: false,
      error: {
        code: AuthErrorCode.SERVER_ERROR,
        message: '服务器内部错误，请稍后重试'
      },
      timestamp: new Date()
    }

    return NextResponse.json(response, { status: 500 })
  }
}
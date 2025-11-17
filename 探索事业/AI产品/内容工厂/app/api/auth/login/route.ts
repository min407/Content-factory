import { NextRequest, NextResponse } from 'next/server'
import { LoginFormData, User, UserSession, AuthResponse, AuthErrorCode, VALIDATION_RULES } from '@/types/user'
import { UserStorage, PasswordStorage, SessionStorage, initializeStorage } from '@/lib/data-storage'

/**
 * 生成会话令牌
 */
function generateSessionToken(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 18)
}

/**
 * 验证登录数据
 */
function validateLogin(data: LoginFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

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

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * POST /api/auth/login - 用户登录
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [登录接口] 收到登录请求')

    // 确保数据存储已初始化
    await initializeStorage()

    // 清理过期会话
    await SessionStorage.cleanupExpiredSessions()

    const body: LoginFormData = await request.json()
    console.log('🔐 [登录接口] 登录数据:', {
      email: body.email,
      hasPassword: !!body.password,
      rememberMe: body.rememberMe
    })

    // 验证请求数据
    const validation = validateLogin(body)
    if (!validation.isValid) {
      console.log('❌ [登录接口] 数据验证失败:', validation.errors)

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

    // 查找用户
    const user = await UserStorage.findUser(body.email)
    if (!user) {
      console.log('❌ [登录接口] 用户不存在:', body.email)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: '用户不存在，请检查邮箱地址'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 404 })
    }

    // 验证密码（简化版本，生产环境应使用密码哈希）
    const isPasswordValid = await PasswordStorage.verifyPassword(user.id, body.password)
    if (!isPasswordValid) {
      console.log('❌ [登录接口] 密码错误:', body.email)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: '密码错误，请重新输入'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 检查用户状态
    if (!user.isActive) {
      console.log('❌ [登录接口] 用户已被禁用:', body.email)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '用户账户已被禁用，请联系管理员'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 403 })
    }

    // 创建会话
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      username: user.username,
      token: sessionToken,
      expiresAt
    }

    await SessionStorage.createSession(session)

    // 更新用户最后登录时间
    await UserStorage.updateUser(user.id, {
      lastLoginAt: new Date()
    })

    console.log('✅ [登录接口] 登录成功:', {
      userId: user.id,
      email: user.email,
      username: user.username,
      sessionToken: session.token.substring(0, 20) + '...'
    })

    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        session: {
          token: session.token,
          expiresAt: session.expiresAt
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
      maxAge: body.rememberMe ? 30 * 24 * 60 * 60 : undefined // 记住我则30天，否则会话cookie
    }

    nextResponse.cookies.set('session_token', session.token, cookieOptions)

    console.log('🍪 [登录接口] 设置会话Cookie:', {
      token: session.token.substring(0, 20) + '...',
      maxAge: cookieOptions.maxAge
    })

    return nextResponse

  } catch (error) {
    console.error('❌ [登录接口] 服务器错误:', error)

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

/**
 * GET /api/auth/login - 检查登录状态
 */
export async function GET(request: NextRequest) {
  try {
    // 获取session token
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '未找到会话令牌'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 验证session
    const session = await SessionStorage.getSession(sessionToken)
    if (!session) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.TOKEN_EXPIRED,
          message: '会话已过期，请重新登录'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 查找用户信息
    const user = await UserStorage.findUser(session.email)
    if (!user || !user.isActive) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: '用户不存在或已被禁用'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 404 })
    }

    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          lastLoginAt: user.lastLoginAt
        },
        session: {
          token: sessionToken,
          expiresAt: session.expiresAt
        }
      },
      timestamp: new Date()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [登录接口] 检查登录状态错误:', error)

    const response: AuthResponse = {
      success: false,
      error: {
        code: AuthErrorCode.SERVER_ERROR,
        message: '服务器内部错误'
      },
      timestamp: new Date()
    }

    return NextResponse.json(response, { status: 500 })
  }
}
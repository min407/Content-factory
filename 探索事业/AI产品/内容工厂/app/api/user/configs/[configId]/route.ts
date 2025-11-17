import { NextRequest, NextResponse } from 'next/server'
import { UserApiConfig, AuthResponse, AuthErrorCode } from '@/types/user'
import { SessionStorage, UserConfigStorage } from '@/lib/vercel-data-storage'

/**
 * 从请求中获取用户信息
 */
async function getUserFromRequest(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value

  if (!sessionToken) {
    return null
  }

  const session = await SessionStorage.getSession(sessionToken)
  if (!session) {
    return null
  }

  return {
    userId: session.userId,
    email: session.email
  }
}

/**
 * 查找用户配置
 */
async function findUserConfig(userId: string, configId: string): Promise<UserApiConfig | null> {
  const configs = await UserConfigStorage.getUserConfigs(userId)
  const config = configs.find(config => config.id === configId)
  if (!config) return null

  // 转换为UserApiConfig类型
  return {
    ...config,
    userId,
    createdAt: config.createdAt || new Date().toISOString()
  }
}

/**
 * PUT /api/user/configs/[configId] - 更新API配置
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params
    console.log('🔄 [配置API] 更新API配置:', configId)

    const user = await getUserFromRequest(request)
    if (!user) {
      console.log('❌ [配置API] 用户未认证')

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '用户未登录或会话已过期'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 获取更新数据
    const updateData = await request.json()
    console.log('📝 [配置API] 更新数据:', {
      configId: configId,
      ...updateData,
      hasApiKey: !!updateData.apiKey,
      hasApiBase: !!updateData.apiBase,
      hasModel: !!updateData.model
    })

    // 验证必要字段
    if (!updateData.provider || !updateData.name) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.VALIDATION_ERROR,
          message: '配置数据不完整'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 400 })
    }

    // 更新配置
    const configData = {
      id: configId,
      ...updateData,
      updatedAt: new Date(),
      isConfigured: !!updateData.apiKey?.trim(),
      isActive: updateData.isActive !== undefined ? updateData.isActive : true
    }

    await UserConfigStorage.updateConfig(user.userId, configData)

    console.log('✅ [配置API] 配置更新成功:', {
      configId: configId,
      provider: configData.provider,
      name: configData.name
    })

    const response: AuthResponse = {
      success: true,
      data: {
        message: '配置更新成功',
        config: {
          ...configData,
          hasApiKey: !!configData.apiKey
        }
      },
      timestamp: new Date()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [配置API] 更新配置失败:', error)

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

/**
 * DELETE /api/user/configs/[configId] - 删除API配置
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params
    console.log('🗑️ [配置API] 删除API配置:', configId)

    const user = await getUserFromRequest(request)
    if (!user) {
      console.log('❌ [配置API] 用户未认证')

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '用户未登录或会话已过期'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 查找配置
    const config = await findUserConfig(user.userId, configId)
    if (!config) {
      console.log('❌ [配置API] 配置不存在:', configId)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: '配置不存在'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 404 })
    }

    // 删除配置
    await UserConfigStorage.deleteConfig(user.userId, config.provider as string)

    console.log('✅ [配置API] 配置删除成功:', {
      configId: configId,
      provider: config.provider,
      name: config.name
    })

    const response: AuthResponse = {
      success: true,
      data: {
        message: '配置删除成功'
      },
      timestamp: new Date()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [配置API] 删除配置失败:', error)

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

/**
 * GET /api/user/configs/[configId] - 获取单个API配置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params
    console.log('📋 [配置API] 获取单个API配置:', configId)

    const user = await getUserFromRequest(request)
    if (!user) {
      console.log('❌ [配置API] 用户未认证')

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '用户未登录或会话已过期'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    // 查找配置
    const config = await findUserConfig(user.userId, configId)
    if (!config) {
      console.log('❌ [配置API] 配置不存在:', configId)

      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: '配置不存在'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 404 })
    }

    console.log('✅ [配置API] 配置获取成功:', {
      configId: config.id,
      provider: config.provider,
      name: config.name
    })

    const response: AuthResponse = {
      success: true,
      data: {
        config: {
          id: config.id,
          provider: config.provider,
          name: config.name,
          description: config.description,
          apiBase: config.apiBase,
          model: config.model,
          serviceProvider: config.serviceProvider,
          isActive: config.isActive,
          isConfigured: config.isConfigured,
          lastTested: config.lastTested,
          testStatus: config.testStatus,
          testMessage: config.testMessage,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
          hasApiKey: !!config.apiKey
          // 注意：不返回实际的API密钥
        }
      },
      timestamp: new Date()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [配置API] 获取配置失败:', error)

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
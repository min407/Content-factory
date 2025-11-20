import { NextRequest, NextResponse } from 'next/server'
import { UserApiConfig, AuthResponse, AuthErrorCode } from '@/types/user'
import { ApiConfig } from '@/types/api-config'
import { SessionStorage, UserConfigStorage } from '@/lib/data-storage'

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
 * GET /api/user/configs - 获取用户API配置
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [用户配置API] 获取用户API配置')

    const user = await getUserFromRequest(request)
    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '未授权访问，请先登录'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    const configs = await UserConfigStorage.getUserConfigs(user.userId)
    console.log(`📋 [用户配置API] 获取用户 ${user.userId} 的 ${configs.length} 个配置`)

    return NextResponse.json({
      success: true,
      data: {
        configs: configs
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('❌ [用户配置API] 获取配置失败:', error)

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
 * POST /api/user/configs - 保存用户API配置
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💾 [用户配置API] 保存用户API配置')

    const user = await getUserFromRequest(request)
    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '未授权访问，请先登录'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    const body: ApiConfig = await request.json()
    console.log('💾 [用户配置API] 配置数据:', {
      provider: body.provider,
      name: body.name,
      apiKey: body.apiKey ? `${body.apiKey.substring(0, 8)}...` : 'undefined',
      apiBase: body.apiBase,
      model: body.model,
      userId: user.userId
    })

    // 验证配置数据
    if (!body.provider || !body.name || !body.apiKey) {
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

    // 保存配置
    const configData = {
      ...body,
      isConfigured: !!body.apiKey?.trim(),
      isActive: body.isActive !== undefined ? body.isActive : true,
      updatedAt: new Date()
    }

    await UserConfigStorage.updateConfig(user.userId, configData)

    console.log(`✅ [用户配置API] 用户 ${user.userId} 配置保存成功: ${body.provider}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'API配置保存成功',
        config: body
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('❌ [用户配置API] 保存配置失败:', error)

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
 * DELETE /api/user/configs - 删除用户API配置
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [用户配置API] 删除用户API配置')

    const user = await getUserFromRequest(request)
    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: '未授权访问，请先登录'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 401 })
    }

    const url = new URL(request.url)
    const provider = url.searchParams.get('provider')

    if (!provider) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: AuthErrorCode.VALIDATION_ERROR,
          message: '缺少provider参数'
        },
        timestamp: new Date()
      }

      return NextResponse.json(response, { status: 400 })
    }

    // 删除配置
    await UserConfigStorage.deleteConfig(user.userId, provider)
    console.log(`✅ [用户配置API] 用户 ${user.userId} 配置删除成功: ${provider}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'API配置删除成功'
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('❌ [用户配置API] 删除配置失败:', error)

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
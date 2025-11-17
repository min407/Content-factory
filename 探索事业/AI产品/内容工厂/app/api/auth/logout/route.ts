import { NextRequest, NextResponse } from 'next/server'
import { AuthResponse, AuthErrorCode } from '@/types/user'
import { SessionStorage } from '@/lib/vercel-data-storage'

/**
 * POST /api/auth/logout - 用户登出
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 [登出接口] 收到登出请求')

    // 获取session token
    const sessionToken = request.cookies.get('session_token')?.value

    if (sessionToken) {
      // 从session存储中删除
      await SessionStorage.deleteSession(sessionToken)
      console.log('✅ [登出接口] 会话已删除:', sessionToken.substring(0, 20) + '...')
    } else {
      console.log('⚠️ [登出接口] 未找到session token')
    }

    // 创建响应并清除cookie
    const response: AuthResponse = {
      success: true,
      data: {
        message: '登出成功'
      },
      timestamp: new Date()
    }

    const nextResponse = NextResponse.json(response)

    // 清除session cookie
    nextResponse.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // 立即过期
    })

    console.log('🧹 [登出接口] 已清除session cookie')

    return nextResponse

  } catch (error) {
    console.error('❌ [登出接口] 服务器错误:', error)

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
 * GET /api/auth/logout - 检查登出状态
 */
export async function GET() {
  const response: AuthResponse = {
    success: true,
    data: {
      message: '登出接口可用'
    },
    timestamp: new Date()
  }

  return NextResponse.json(response)
}
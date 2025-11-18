/**
 * 用户认证辅助工具
 * 从请求中提取用户信息
 */

import { SessionStorage } from '@/lib/data-storage-hybrid'

/**
 * 从请求中获取用户信息
 * @param request NextRequest对象
 * @returns 用户信息对象或null
 */
export async function getUserFromRequest(request: Request): Promise<{ userId: string; email: string } | null> {
  // 对于API路由，需要从cookies中获取session token
  const cookieHeader = request.headers.get('cookie')
  const sessionToken = cookieHeader
    ?.split(';')
    .find(cookie => cookie.trim().startsWith('session_token='))
    ?.split('=')[1]

  if (!sessionToken) {
    console.log('❌ [用户认证] 未找到session token')
    return null
  }

  try {
    const session = await SessionStorage.getSession(sessionToken)
    if (!session) {
      console.log('❌ [用户认证] session不存在或已过期')
      return null
    }

    console.log('✅ [用户认证] 用户认证成功:', {
      userId: session.userId,
      email: session.email
    })

    return {
      userId: session.userId,
      email: session.email
    }
  } catch (error) {
    console.error('❌ [用户认证] 获取用户信息失败:', error)
    return null
  }
}

/**
 * 获取默认用户ID（用于向后兼容）
 * @returns 默认用户ID
 */
export function getDefaultUserId(): string {
  return 'user_1' // 使用Vercel存储中的默认用户ID
}
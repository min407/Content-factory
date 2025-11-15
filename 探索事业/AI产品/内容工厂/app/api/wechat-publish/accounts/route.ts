import { NextRequest, NextResponse } from 'next/server'
import { getWechatAccounts } from '@/lib/wechat-publish'

/**
 * 获取公众号列表API
 * GET /api/wechat-publish/accounts
 */
export async function GET() {
  try {
    console.log('开始获取公众号列表...')

    const accounts = await getWechatAccounts()

    console.log(`成功获取 ${accounts.length} 个公众号`)

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        total: accounts.length
      },
      message: `获取到 ${accounts.length} 个公众号`
    })
  } catch (error) {
    console.error('获取公众号列表失败:', error)

    // 根据错误类型返回不同的状态码
    let statusCode = 500
    let errorMessage = '获取公众号列表失败'

    if (error instanceof Error) {
      if (error.message.includes('HTTP error! status: 401')) {
        statusCode = 401
        errorMessage = 'API密钥无效或已过期'
      } else if (error.message.includes('HTTP error! status: 403')) {
        statusCode = 403
        errorMessage = 'API访问被拒绝'
      } else if (error.message.includes('HTTP error! status: 429')) {
        statusCode = 429
        errorMessage = '请求频率过高，请稍后重试'
      } else if (error.message.includes('HTTP error!')) {
        statusCode = 502
        errorMessage = '外部API服务不可用'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: statusCode }
    )
  }
}

/**
 * 预留POST方法用于刷新公众号列表
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    error: '方法不支持',
    message: '请使用GET方法获取公众号列表'
  }, { status: 405 })
}
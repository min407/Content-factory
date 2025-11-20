import { NextRequest, NextResponse } from 'next/server'
import { ApiConfig, ApiProvider } from '@/types/api-config'

/**
 * API配置管理API路由
 * GET - 获取所有配置
 * POST - 保存配置
 */

// 临时存储配置（生产环境应该使用数据库）
let apiConfigs: ApiConfig[] = []

/**
 * 获取所有API配置
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        configs: apiConfigs,
        total: apiConfigs.length
      }
    })
  } catch (error) {
    console.error('获取API配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取API配置失败'
      },
      { status: 500 }
    )
  }
}

/**
 * 保存API配置
 */
export async function POST(request: NextRequest) {
  try {
    const config: ApiConfig = await request.json()

    // 验证配置
    if (!config.provider || !config.name) {
      return NextResponse.json(
        {
          success: false,
          error: '配置信息不完整'
        },
        { status: 400 }
      )
    }

    // 查找是否已存在相同provider的配置
    const existingIndex = apiConfigs.findIndex(c => c.provider === config.provider)

    if (existingIndex >= 0) {
      // 更新现有配置
      apiConfigs[existingIndex] = {
        ...config,
        updatedAt: new Date(),
        id: apiConfigs[existingIndex].id
      }
    } else {
      // 添加新配置
      const newConfig: ApiConfig = {
        ...config,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      apiConfigs.push(newConfig)
    }

    console.log('API配置保存成功:', config.provider)

    return NextResponse.json({
      success: true,
      data: config,
      message: '配置保存成功'
    })
  } catch (error) {
    console.error('保存API配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '保存配置失败'
      },
      { status: 500 }
    )
  }
}
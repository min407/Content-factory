import { NextRequest, NextResponse } from 'next/server'

/**
 * 单个API配置管理路由
 * DELETE - 删除指定ID的配置
 */

// 临时存储配置（与主路由共享）
// 实际项目中应该使用数据库
let apiConfigs: any[] = []

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id

    if (!configId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少配置ID'
        },
        { status: 400 }
      )
    }

    // 查找并删除配置
    const initialLength = apiConfigs.length
    apiConfigs = apiConfigs.filter(config => config.id !== configId)

    if (apiConfigs.length < initialLength) {
      console.log('API配置删除成功:', configId)
      return NextResponse.json({
        success: true,
        message: '配置删除成功'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '配置不存在'
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('删除API配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '删除配置失败'
      },
      { status: 500 }
    )
  }
}
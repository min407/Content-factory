import { NextRequest, NextResponse } from 'next/server'
import { generateArticleCover } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { title, content, templateId } = await request.json()

    console.log('封面生成请求:', { title: title.substring(0, 50), contentLength: content.length, templateId })

    if (!title || !content) {
      return NextResponse.json(
        { error: '文章标题和内容不能为空' },
        { status: 400 }
      )
    }

    // 生成文章封面
    const cover = await generateArticleCover(title, content, templateId)

    console.log('封面生成结果:', cover ? '成功' : '失败', cover?.url?.substring(0, 100))

    if (!cover) {
      return NextResponse.json(
        { error: '封面生成失败，请重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cover,
      message: '封面生成成功'
    })

  } catch (error) {
    console.error('封面生成API错误:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '封面生成失败',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
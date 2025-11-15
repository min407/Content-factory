import { NextRequest, NextResponse } from 'next/server'
import { DraftManager } from '@/lib/content-management'

// 获取所有草稿（暂时返回空数组，因为草稿存储在客户端localStorage）
export async function GET() {
  try {
    // 注意：草稿数据存储在客户端localStorage中，服务器端无法直接访问
    // 这里可以后续集成数据库或session存储
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      message: '草稿数据存储在客户端，请查看发布管理页面'
    })
  } catch (error) {
    console.error('获取草稿失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取草稿失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建或更新草稿
export async function POST(request: NextRequest) {
  try {
    const draftData = await request.json()

    // 如果没有ID，创建新草稿
    if (!draftData.id) {
      const draft = await DraftManager.saveToDraft({
        id: Date.now().toString(),
        title: draftData.title,
        content: draftData.content,
        images: draftData.images || [],
        topicId: draftData.topicId,
        wordCount: draftData.wordCount || 0,
        readingTime: draftData.readingTime || 0,
        createdAt: new Date(),
        parameters: draftData.parameters
      } as any)

      return NextResponse.json({
        success: true,
        data: draft,
        message: '草稿创建成功'
      })
    } else {
      // 更新现有草稿
      const updated = DraftManager.updateDraft(draftData.id, draftData)

      if (!updated) {
        return NextResponse.json(
          {
            success: false,
            error: '草稿不存在'
          },
          { status: 404 }
        )
      }

      const updatedDraft = DraftManager.getDraft(draftData.id)

      return NextResponse.json({
        success: true,
        data: updatedDraft,
        message: '草稿更新成功'
      })
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '保存草稿失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 删除草稿
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('id')

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少草稿ID'
        },
        { status: 400 }
      )
    }

    const deleted = DraftManager.deleteDraft(draftId)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '草稿不存在'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '草稿删除成功'
    })
  } catch (error) {
    console.error('删除草稿失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '删除草稿失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
'use client'

import { useState } from 'react'
import {
  PenTool,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronRight,
  RefreshCw,
  Save,
  Send,
  Eye,
  Wand2,
  Settings,
  Hash,
  Type,
  AlignLeft,
  Palette,
  Target,
  BookOpen,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'

// 模拟的选题数据
const mockTopics = [
  { id: 1, title: 'AI工具成为内容创作新趋势', source: '洞察报告', confidence: 92 },
  { id: 2, title: '私域运营仍是热门话题', source: '洞察报告', confidence: 88 },
  { id: 3, title: '个人IP打造需求旺盛', source: '洞察报告', confidence: 85 },
  { id: 4, title: '实战案例类内容更受欢迎', source: '洞察报告', confidence: 90 },
  { id: 5, title: '视频化内容需求增长', source: '洞察报告', confidence: 82 }
]

// 模拟生成的文章
const mockGeneratedArticle = {
  title: '2024年AI工具如何革新内容创作：从ChatGPT到Midjourney的实战应用指南',
  content: `在数字化浪潮席卷全球的今天，人工智能正在以前所未有的速度改变着内容创作的方式。从文字生成到图像创作，从视频剪辑到音频处理，AI工具已经深入到内容创作的每一个环节。

## 一、AI工具带来的创作革命

过去，内容创作者需要花费大量时间在基础工作上：搜集资料、整理思路、撰写初稿、反复修改。而现在，借助AI工具，这些流程可以被大幅优化。

### 1. ChatGPT：文字创作的得力助手

ChatGPT不仅仅是一个聊天机器人，更是内容创作者的智能助理。它可以帮助你：
- **快速生成创意**：输入主题，获得多个创意方向
- **优化文章结构**：让文章逻辑更清晰，层次更分明
- **润色文字表达**：提升文章的专业度和可读性

### 2. Midjourney：视觉内容的创新工具

配图是提升文章吸引力的重要元素，Midjourney让每个人都能成为"设计师"：
- **独特的视觉风格**：生成与众不同的配图
- **高效的创作流程**：几分钟完成传统设计需要几小时的工作
- **无限的创意可能**：突破传统设计的局限

## 二、实战案例分享

让我们通过一个真实案例，看看AI工具如何在实际创作中发挥作用。

### 案例背景
某自媒体博主需要在一周内产出5篇高质量的营销类文章，每篇不少于2000字，且需要配有原创图片。

### 解决方案
1. **选题策划**：使用ChatGPT分析热点话题，生成选题矩阵
2. **内容创作**：结合AI建议和个人经验，快速完成初稿
3. **视觉设计**：用Midjourney生成独特的配图
4. **整体优化**：通过AI工具检查语法、优化表达

### 实施效果
- 创作效率提升300%
- 文章平均阅读量增长150%
- 读者互动率提升80%

## 三、如何正确使用AI工具

虽然AI工具功能强大，但要发挥其最大价值，还需要掌握正确的使用方法。

### 1. 保持创作主体性
AI是工具而非替代品，创作者的思想和观点才是内容的灵魂。

### 2. 注重内容质量把控
AI生成的内容需要人工审核和优化，确保准确性和价值性。

### 3. 建立个人风格
在使用AI工具的同时，要保持自己的创作风格和特色。

## 四、未来展望

随着技术的不断进步，AI工具在内容创作领域的应用将更加深入和广泛。我们可以期待：
- 更智能的创作辅助
- 更个性化的内容推荐
- 更高效的创作流程

作为内容创作者，我们要做的是拥抱变化，善用工具，在AI时代找到属于自己的创作之道。`,
  images: [
    'https://source.unsplash.com/800x600/?artificial,intelligence',
    'https://source.unsplash.com/800x600/?technology,future',
    'https://source.unsplash.com/800x600/?creative,design'
  ],
  wordCount: 1856,
  readingTime: 8
}

export default function CreatePage() {
  const [selectedSource, setSelectedSource] = useState<'insights' | 'custom'>('insights')
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [contentLength, setContentLength] = useState('1000-1500')
  const [writingStyle, setWritingStyle] = useState('professional')
  const [imageCount, setImageCount] = useState('3')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    if (selectedSource === 'insights' && selectedTopics.length === 0) return
    if (selectedSource === 'custom' && !customTopic) return

    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowPreview(true)
    }, 3000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mockGeneratedArticle.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    // 模拟保存到发布管理
    alert('文章已保存到发布管理')
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">内容创作</h1>
        <p className="text-gray-500 mt-1">基于AI智能生成高质量文章，自动配图，一键发布</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：创作设置 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 选题来源 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              选题来源
            </h2>
            <div className="space-y-3">
              <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="source"
                  value="insights"
                  checked={selectedSource === 'insights'}
                  onChange={(e) => setSelectedSource(e.target.value as 'insights' | 'custom')}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">从洞察报告选择</p>
                  <p className="text-sm text-gray-500">基于分析结果创作</p>
                </div>
              </label>
              <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="source"
                  value="custom"
                  checked={selectedSource === 'custom'}
                  onChange={(e) => setSelectedSource(e.target.value as 'insights' | 'custom')}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">自定义输入</p>
                  <p className="text-sm text-gray-500">输入自己的选题</p>
                </div>
              </label>
            </div>
          </div>

          {/* 选题列表或自定义输入 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-500" />
              {selectedSource === 'insights' ? '可用选题' : '自定义选题'}
            </h2>
            {selectedSource === 'insights' ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockTopics.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTopics([...selectedTopics, topic.id])
                        } else {
                          setSelectedTopics(selectedTopics.filter(id => id !== topic.id))
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{topic.title}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">{topic.source}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-blue-600">置信度 {topic.confidence}%</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="请输入您的选题内容..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            )}
          </div>

          {/* 创作参数 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-500" />
              创作参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlignLeft className="w-4 h-4 inline mr-1" />
                  文章长度
                </label>
                <select
                  value={contentLength}
                  onChange={(e) => setContentLength(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="500-800">500-800字</option>
                  <option value="800-1200">800-1200字</option>
                  <option value="1000-1500">1000-1500字</option>
                  <option value="1500-2000">1500-2000字</option>
                  <option value="2000+">2000字以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  写作风格
                </label>
                <select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="professional">专业严谨</option>
                  <option value="casual">轻松活泼</option>
                  <option value="storytelling">故事叙述</option>
                  <option value="educational">教育科普</option>
                  <option value="emotional">情感共鸣</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  图片数量
                </label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">不插入图片</option>
                  <option value="1">1张</option>
                  <option value="2">2张</option>
                  <option value="3">3张</option>
                  <option value="5">5张</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (selectedSource === 'insights' ? selectedTopics.length === 0 : !customTopic)}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  开始创作
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 h-full">
            {!showPreview && !isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无内容</h3>
                <p className="text-gray-500 max-w-sm">
                  选择选题并设置参数后，点击"开始创作"生成文章
                </p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full p-12">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">AI正在创作中</h3>
                <p className="text-gray-500">请稍候，正在为您生成优质内容...</p>
                <div className="mt-6 space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    分析选题要点...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    生成文章大纲...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    撰写正文内容...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    插入相关图片...
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* 预览头部 */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">文章预览</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Type className="w-4 h-4" />
                      <span>{mockGeneratedArticle.wordCount}字</span>
                      <span className="text-gray-300">•</span>
                      <BookOpen className="w-4 h-4" />
                      <span>约{mockGeneratedArticle.readingTime}分钟</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1.5 text-green-500" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1.5" />
                          复制
                        </>
                      )}
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      重新生成
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      保存草稿
                    </button>
                  </div>
                </div>

                {/* 预览内容 */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    {mockGeneratedArticle.title}
                  </h1>

                  <div className="prose prose-lg max-w-none">
                    {mockGeneratedArticle.content.split('\n\n').map((paragraph, index) => {
                      // 检查是否是标题
                      if (paragraph.startsWith('##')) {
                        const level = paragraph.match(/^#+/)?.[0].length || 2
                        const text = paragraph.replace(/^#+\s/, '')
                        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements
                        return (
                          <HeadingTag key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">
                            {text}
                          </HeadingTag>
                        )
                      }

                      // 检查是否是列表项
                      if (paragraph.startsWith('- ')) {
                        const items = paragraph.split('\n').map(item => item.replace(/^- /, ''))
                        return (
                          <ul key={index} className="list-disc list-inside space-y-2 my-4 text-gray-700">
                            {items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )
                      }

                      // 插入图片（在适当位置）
                      if (index === 3 && mockGeneratedArticle.images[0]) {
                        return (
                          <div key={`img-${index}`}>
                            <p className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>
                            <img
                              src={mockGeneratedArticle.images[0]}
                              alt="配图"
                              className="w-full rounded-lg mb-4"
                            />
                          </div>
                        )
                      }

                      // 普通段落
                      return (
                        <p key={index} className="text-gray-700 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      )
                    })}
                  </div>
                </div>

                {/* 预览底部操作 */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    生成时间：{new Date().toLocaleString('zh-CN')}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/publish"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      发布管理
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
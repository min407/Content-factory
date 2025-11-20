'use client'

/**
 * 用户注册页面
 */

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { RegisterFormData, VALIDATION_RULES } from '@/types/user'

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const validateForm = (): boolean => {
    const errors: string[] = []

    // 验证邮箱
    if (!formData.email) {
      errors.push('邮箱不能为空')
    } else if (!VALIDATION_RULES.email.pattern.test(formData.email)) {
      errors.push(VALIDATION_RULES.email.message)
    }

    // 验证用户名
    if (!formData.username) {
      errors.push('用户名不能为空')
    } else if (formData.username.length < VALIDATION_RULES.username.minLength ||
               formData.username.length > VALIDATION_RULES.username.maxLength) {
      errors.push(`用户名长度必须在${VALIDATION_RULES.username.minLength}-${VALIDATION_RULES.username.maxLength}位之间`)
    } else if (!VALIDATION_RULES.username.pattern.test(formData.username)) {
      errors.push(VALIDATION_RULES.username.message)
    }

    // 验证密码
    if (!formData.password) {
      errors.push('密码不能为空')
    } else if (formData.password.length < VALIDATION_RULES.password.minLength ||
               formData.password.length > VALIDATION_RULES.password.maxLength) {
      errors.push(`密码长度必须在${VALIDATION_RULES.password.minLength}-${VALIDATION_RULES.password.maxLength}位之间`)
    } else if (!VALIDATION_RULES.password.pattern.test(formData.password)) {
      errors.push(VALIDATION_RULES.password.message)
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      errors.push('两次输入的密码不一致')
    }

    // 验证服务条款
    if (!formData.agreeToTerms) {
      errors.push('请同意服务条款和隐私政策')
    }

    if (errors.length > 0) {
      setError(errors.join('; '))
      return false
    }

    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await register(formData)

      if (result.success) {
        console.log('✅ [注册页面] 注册成功，跳转到首页')
        router.push('/')
      } else {
        setError(result.message)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册内容工厂
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请输入用户名"
              />
              <p className="mt-1 text-xs text-gray-500">
                {VALIDATION_RULES.username.minLength}-{VALIDATION_RULES.username.maxLength}位，支持中英文、数字、下划线
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请输入密码"
              />
              <p className="mt-1 text-xs text-gray-500">
                {VALIDATION_RULES.password.minLength}-{VALIDATION_RULES.password.maxLength}位，必须包含字母和数字
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请再次输入密码"
              />
            </div>

            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                我已阅读并同意{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  服务条款
                </Link>
                {' '}和{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  隐私政策
                </Link>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  注册中...
                </>
              ) : (
                '注册账户'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              返回首页
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
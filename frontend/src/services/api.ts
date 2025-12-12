import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// API错误类型
interface APIError {
  error: string
  code?: string
  details?: string
}

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // AI请求可能需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<APIError>) => {
    // 处理401未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 只在非聊天页面跳转
      if (!window.location.pathname.includes('/chat')) {
        window.location.href = '/admin'
      }
    }

    // 提取错误信息
    const errorMessage = error.response?.data?.error 
      || error.message 
      || '请求失败，请稍后重试'

    return Promise.reject(new Error(errorMessage))
  }
)

// API封装对象
const api = {
  // GET请求
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config)
  },

  // POST请求
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config)
  },

  // PUT请求
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config)
  },

  // DELETE请求
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config)
  },
}

export default api

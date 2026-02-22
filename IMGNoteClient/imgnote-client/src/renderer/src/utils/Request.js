import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '../utils/Message'
import router from '@/router'
const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const responseTypeJson = 'json'
let loading = null
const instance = axios.create({
  withCredentials: true,
  baseURL: (import.meta.env.PROD ? import.meta.env.VITE_DOMAIN : '') + '/api',
  timeout: 10 * 1000
})

//请求前拦截器
instance.interceptors.request.use(
  (config) => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: '加载中......',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
    return config
  },
  (error) => {
    if (error.config.showLoading && loading) {
      loading.close()
    }
    Message.error('请求发送失败')
    return Promise.reject('系统处理失败')
  }
)
//请求后拦截器
instance.interceptors.response.use(
  async (response) => {
    const { showLoading, errorCallback, showError = true, responseType } = response.config
    if (showLoading && loading) {
      loading.close()
    }
    const responseData = response.data
    if (responseType === 'arraybuffer' || responseType === 'blob') {
      return responseData
    }
    //正常请求
    if (responseData.code === 200) {
      return responseData
    } else if (responseData.code === 401) {
      return responseData
    } else if (responseData.code === 402) {
      return responseData
    } else if (responseData.code === 406) {
      return responseData
    } else if (responseData.code === 410) {
      return responseData
    } else {
      //其他错误
      if (errorCallback) {
        errorCallback(responseData)
      }
      return Promise.reject({ showError: showError, msg: responseData.info })
    }
  },
  (error) => {
    if (error.config.showLoading && loading) {
      loading.close()
    }
    return Promise.reject({ showError: true, msg: '系统故障' })
  }
)

const request = (config) => {
  const {
    url,
    params,
    dataType,
    showLoading = true,
    responseType = responseTypeJson,
    showError = true
  } = config
  let contentType = contentTypeForm
  let formData = new FormData() // 创建form对象
  for (let key in params) {
    formData.append(key, params[key] === undefined ? '' : params[key])
  }
  if (dataType != null && dataType === 'json') {
    contentType = contentTypeJson
  }
  let userInfoJson = localStorage.getItem('userInfo')
  const token = userInfoJson ? JSON.parse(userInfoJson).token : ''
  let headers = {
    'Content-Type': contentType,
    'X-Requested-With': 'XMLHttpRequest',
    token: token
  }
  const postConfig = {
    onUploadProgress: (event) => {
      if (config.uploadProgressCallback) {
        config.uploadProgressCallback(event)
      }
    },
    responseType: responseType,
    headers: headers,
    showLoading: showLoading,
    errorCallback: config.errorCallback,
    showError: showError
  }
  if (config.timeout != null) postConfig.timeout = config.timeout
  return instance.post(url, formData, postConfig).catch((error) => {
    if (error.showError) {
      Message.error(error.msg)
    }
    return null
  })
}

/** 以 JSON 请求体发送，Content-Type: application/json，供后端不支持 form-data 的接口使用 */
const requestJson = (config) => {
  const { url, params = {}, showLoading = true, showError = true } = config
  let userInfoJson = localStorage.getItem('userInfo')
  const token = userInfoJson ? JSON.parse(userInfoJson).token : ''
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    token: token
  }
  return instance
    .post(url, params, {
      headers,
      showLoading,
      showError,
      errorCallback: config.errorCallback
    })
    .catch((error) => {
      if (error.showError) {
        Message.error(error.msg)
      }
      return null
    })
}

export { request, requestJson }

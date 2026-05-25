import axios from 'axios'

export const http = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000
})

export function apiGet(url: string, config: any = {}) {
  return http.get(url, config)
}

export function apiPost(url: string, data?: any, config: any = {}) {
  return http.post(url, data, config)
}

export function apiPut(url: string, data?: any, config: any = {}) {
  return http.put(url, data, config)
}

export default http

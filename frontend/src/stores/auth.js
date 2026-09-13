import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('blog_token') || '')
  const username = ref(localStorage.getItem('blog_username') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(user, password) {
    const response = await api.post('/auth/login', {
      username: user,
      password: password
    })
    
    token.value = response.data.token
    username.value = response.data.username
    
    localStorage.setItem('blog_token', token.value)
    localStorage.setItem('blog_username', username.value)
    
    return response.data
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('blog_token')
    localStorage.removeItem('blog_username')
  }

  return {
    token,
    username,
    isLoggedIn,
    login,
    logout
  }
})

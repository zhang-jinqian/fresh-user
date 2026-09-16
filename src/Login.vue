<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">
        <img src="./assets/logo.png" alt="生鲜购">
        <h2>登录账号</h2>
      </div>

      <div class="error-tip" v-if="errorMsg">{{ errorMsg }}</div>

      <div class="form-item">
        <input v-model="phone" type="text" placeholder="请输入手机号" class="input"
          :class="{ error: errorMsg && errorMsg.includes('手机号') }" />
      </div>

      <div class="form-item">
        <input v-model="password" type="password" placeholder="请输入密码" class="input"
          :class="{ error: errorMsg && errorMsg.includes('密码') }" />
      </div>

      <button class="login-btn" @click="login" :disabled="loading">
        <span v-if="!loading">登录</span>
        <span v-if="loading">登录中...</span>
      </button>

      <div class="to-register" @click="$router.push('/register')">
        没有账号？立即注册
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const phone = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// ---------------- 静态用户库（存在 localStorage.users） ----------------
// 默认账号：手机号 / 密码 / 昵称
const DEFAULT_USERS = [
  { phone: '13800138000', password: '123456', name: '小明' },
  { phone: '13900139000', password: '123456', name: '测试员' }
]

const loadUsers = () => {
  const str = localStorage.getItem('users')
  if (!str) {
    localStorage.setItem('users', JSON.stringify(DEFAULT_USERS))
    return DEFAULT_USERS
  }
  try {
    const arr = JSON.parse(str)
    return Array.isArray(arr) ? arr : DEFAULT_USERS
  } catch (e) {
    return DEFAULT_USERS
  }
}

// ---------------- 登录逻辑（静态版） ----------------
const login = () => {
  errorMsg.value = ''

  // 1. 前端校验（规则与原版一致）
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMsg.value = '请输入正确的手机号'
    return
  }
  if (password.value.length < 6 || password.value.length > 16) {
    errorMsg.value = '密码长度需在6-16位之间'
    return
  }

  loading.value = true

  // 2. 模拟网络延迟
  setTimeout(() => {
    const users = loadUsers()
    const user = users.find(
      u => u.phone === phone.value && u.password === password.value
    )

    if (!user) {
      errorMsg.value = '手机号或密码错误'
      loading.value = false
      return
    }

    // 3. 存储登录态（键名与原后端版本保持一致，订单模块可直接用）
    const userInfo = {
      id: user.id || phone.value,   // 无 id 时用手机号兜底
      name: user.name || '用户',
      phone: user.phone
    }

    localStorage.setItem('isLogin', 'true')
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    localStorage.setItem('userId', String(userInfo.id))
    localStorage.setItem('userName', userInfo.name)
    localStorage.setItem('token', 'mock-token-' + Date.now())

    alert('登录成功！')
    loading.value = false

    // 4. 跳转到首页（你需要跳 /cart 或 /order-list 就改这里）
    router.push('/home')
  }, 400)
}

// ---------------- 已登录直接跳首页 ----------------
const checkLoginStatus = () => {
  const isLogin = localStorage.getItem('isLogin') === 'true'
  if (isLogin) {
    router.push('/home')
  }
}

checkLoginStatus()
</script>

<style scoped>
/* 样式完全保留，无任何修改 */
.login-page {
  width: 100%;
  height: 100vh;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Microsoft Yahei", sans-serif;
}

.login-box {
  width: 400px;
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo img {
  width: 50px;
  height: 50px;
}

.logo h2 {
  font-size: 24px;
  color: #ff4d4f;
  margin-top: 10px;
}

/* 错误提示样式 */
.error-tip {
  color: #ff4d4f;
  font-size: 12px;
  text-align: center;
  margin-bottom: 15px;
  min-height: 16px;
}

.form-item {
  margin-bottom: 20px;
}

.input {
  width: 100%;
  height: 44px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0 15px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.input:focus {
  border-color: #ff4d4f;
}

/* 输入框错误状态 */
.input.error {
  border-color: #ff4d4f;
}

.login-btn {
  width: 100%;
  height: 46px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background: #e84240;
}

/* 按钮禁用状态 */
.login-btn:disabled {
  background: #ff8080;
  cursor: not-allowed;
}

.to-register {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.to-register:hover {
  color: #ff4d4f;
}
</style>

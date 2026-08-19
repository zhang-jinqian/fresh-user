<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">
        <img
          src="./assets/logo.png"
          alt="生鲜购">
        <h2>登录账号</h2>
      </div>

      <!-- 新增错误提示 -->
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
import axios from 'axios'

const router = useRouter()

// 响应式数据（样式不变，仅调整逻辑）
const phone = ref('')
const password = ref('')
const loading = ref(false) // 加载状态
const errorMsg = ref('') // 错误提示

// 后端接口地址（根据你的实际路径修改）
const apiUrl = 'http://localhost/cai/api/user_login.php'

// 登录核心逻辑（适配订单系统）
const login = async () => {
  errorMsg.value = ''

  // 1. 前端校验（保留原有规则）
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMsg.value = '请输入正确的手机号'
    return
  }
  if (password.value.length < 6 || password.value.length > 16) {
    errorMsg.value = '密码长度需在6-16位之间'
    return
  }

  try {
    loading.value = true
    // 2. 发送登录请求
    const res = await axios.post(apiUrl, { 
      phone: phone.value, 
      password: password.value 
    })
    
    // 3. 登录成功处理（适配订单系统的存储格式）
    if (res.data.code === 200) {
      // 核心：统一用户信息存储格式，供订单模块使用
      const userInfo = {
        id: res.data.data.userInfo.id,    // 用户ID（订单模块核心）
        name: res.data.data.userInfo.name, // 用户名
        phone: phone.value                // 手机号
      }
      
      // 存储登录态（兼容原有+新增订单模块需要的字段）
      localStorage.setItem('isLogin', 'true')
      localStorage.setItem('userInfo', JSON.stringify(userInfo)) // 订单模块核心依赖
      localStorage.setItem('userId', res.data.data.userInfo.id)  // 兼容原有
      localStorage.setItem('userName', res.data.data.userInfo.name) // 兼容原有
      localStorage.setItem('token', res.data.data.token)         // 令牌

      alert('登录成功！')
      // 登录后跳转到首页（可根据你的需求修改为/cart或/order-list）
      router.push('/home')
    } else {
      // 显示后端返回的业务错误
      errorMsg.value = res.data.msg
    }
  } catch (error) {
    console.error('登录请求失败：', error)
    // 网络错误处理
    if (error.response && error.response.data && error.response.data.msg) {
      errorMsg.value = error.response.data.msg
    } else if (error.message.includes('Network')) {
      errorMsg.value = '网络异常，请检查服务器是否启动'
    } else {
      errorMsg.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

// 额外：页面加载时检查是否已登录，避免重复登录
const checkLoginStatus = () => {
  const isLogin = localStorage.getItem('isLogin') === 'true'
  if (isLogin) {
    router.push('/home')
  }
}

// 初始化检查登录态
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
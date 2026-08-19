<template>
  <div class="register-page">
    <div class="register-box">
      <div class="logo">
        <img
          src="./assets/logo.png"
          alt="生鲜购">
        <h2>注册账号</h2>
      </div>

      <!-- 错误提示 -->
      <div class="error-tip" v-if="errorMsg">{{ errorMsg }}</div>
      <div class="form-item">
        <input v-model="name" type="text" placeholder="请输入昵称" class="input" />
      </div>

      <div class="form-item">
        <input v-model="phone" type="text" placeholder="请输入手机号" class="input"
          :class="{ error: errorMsg && errorMsg.includes('手机号') }" />
      </div>
      <div class="form-item gender-group">
        <span class="gender-label">性别：</span>
        <label class="radio-item">
          <input type="radio" v-model="gender" value="1" /> 男
        </label>
        <label class="radio-item">
          <input type="radio" v-model="gender" value="2" /> 女
        </label>
        <label class="radio-item">
          <input type="radio" v-model="gender" value="0" /> 保密
        </label>
      </div>
      <div class="form-item">
        <input v-model="password" type="password" placeholder="请设置6~16位密码（含数字和字母）" class="input"
          :class="{ error: errorMsg && errorMsg.includes('密码') }" />
      </div>

      <div class="form-item">
        <input v-model="confirmPwd" type="password" placeholder="请确认密码" class="input"
          :class="{ error: errorMsg && errorMsg.includes('密码') }" />
      </div>

      <button class="register-btn" @click="register" :disabled="loading">
        <span v-if="!loading">注册</span>
        <span v-if="loading">注册中...</span>
      </button>

      <div class="to-login" @click="$router.push('/login')">
        已有账号？立即登录
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' // 需先安装：npm install axios

const router = useRouter()

// 响应式数据
const phone = ref('')
const password = ref('')
const confirmPwd = ref('')
const loading = ref(false) // 加载状态
const errorMsg = ref('') // 错误提示
const gender = ref('0')
// API 基础路径（根据实际后端地址修改）
const apiBase = 'http://localhost/cai/api'

// 注册核心逻辑
const register = async () => {
  // 清空之前的错误提示
  errorMsg.value = ''

  // 1. 前端表单校验
  // 手机号校验
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMsg.value = '请输入正确的手机号格式'
    return
  }

  // 密码长度 + 复杂度校验
  if (password.value.length < 6 || password.value.length > 16) {
    errorMsg.value = '密码长度需在6-16位之间'
    return
  }
  if (!/(?=.*[0-9])(?=.*[a-zA-Z])/.test(password.value)) {
    errorMsg.value = '密码需同时包含数字和字母'
    return
  }

  // 确认密码校验
  if (password.value !== confirmPwd.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  // 2. 调用后端注册接口
  try {
    loading.value = true // 开启加载状态
    const response = await axios.post(`${apiBase}/user_register.php`, {
      phone: phone.value,
      password: password.value // 实际项目中建议前端先加密（如md5）再传
    })

    // 3. 处理接口返回结果
    if (response.data.code === 200) {
      // 注册成功
      alert('注册成功！请前往登录')
      router.push('/login') // 修正路由大小写问题
    } else {
      // 后端返回的业务错误（如手机号已存在）
      errorMsg.value = response.data.message || '注册失败，请稍后重试'
    }
  } catch (error) {
    // 网络错误/接口异常处理
    console.error('注册请求失败：', error)
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg.value = error.response.data.message
    } else {
      errorMsg.value = '网络异常，请检查网络后重试'
    }
  } finally {
    loading.value = false // 关闭加载状态
  }
}
</script>

<style scoped>
.register-page {
  width: 100%;
  height: 100vh;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Microsoft Yahei", sans-serif;
}

.register-box {
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
  font-size: 22px;
  color: #333;
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
.gender-group {
  display: flex;
  align-items: center;
  gap: 20px;
}
.gender-label {
  font-size: 14px;
  color: #333;
  margin-right: 10px;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
}
.radio-item input {
  cursor: pointer;
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

/* 错误状态样式 */
.input.error {
  border-color: #ff4d4f;
}

.register-btn {
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

.register-btn:hover {
  background: #e84240;
}

/* 禁用状态样式 */
.register-btn:disabled {
  background: #ff8080;
  cursor: not-allowed;
}

.to-login {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.to-login:hover {
  color: #ff4d4f;
}
</style>
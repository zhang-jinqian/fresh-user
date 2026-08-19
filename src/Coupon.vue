<template>
<HeaderNav></HeaderNav>
  <div class="coupon-page">
    <h2>🎁 我的优惠券</h2>
    <div class="coupon-list">
      <!-- 优惠券卡片 -->
      <div class="coupon-card" v-for="item in couponList" :key="item.id">
        <div class="coupon-left">
          <p class="coupon-value">¥{{ item.discount_value }}</p>
          <p class="coupon-desc" v-if="item.min_amount > 0">
            满{{ item.min_amount }}元可用
          </p>
          <p class="coupon-desc" v-else>
            无门槛使用
          </p>
        </div>
        <div class="coupon-right">
          <h3>{{ item.name }}</h3>
          <p class="coupon-time">
            有效期：{{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
          </p>
          <button 
            class="receive-btn" 
            @click="receiveCoupon(item.id)"
            :disabled="loading"
          >
            {{ loading ? '领取中...' : '立即领取' }}
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-tip" v-if="couponList.length === 0">
        暂无可领取的优惠券
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import HeaderNav from './components/HeaderNav.vue'

const api = axios.create({
  baseURL: 'http://localhost/cai/api'
})

// ✅ 核心修复：从 localStorage 获取真实用户ID
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userId = ref(userInfo.id || 0) // 实际是7

const couponList = ref([])
const loading = ref(false)

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.split(' ')[0]
}

// 查询可领取的优惠券
const getCoupons = async () => {
  if (userId.value <= 0) {
    alert('请先登录')
    return
  }
  try {
    const res = await api.get('/user_coupon.php', {
      params: { user_id: userId.value }
    })
    if (res.data.code === 200) {
      couponList.value = res.data.data
    } else {
      alert(res.data.msg || '查询失败')
    }
  } catch (err) {
    console.error('查询优惠券失败：', err)
    alert('查询优惠券失败，请重试')
  }
}

// 领取优惠券
const receiveCoupon = async (couponId) => {
  loading.value = true
  try {
    const res = await api.post('/user_coupon.php', {
      user_id: userId.value,
      coupon_id: couponId
    })
    if (res.data.code === 200) {
      alert('领取成功！')
      getCoupons()
    } else {
      alert(res.data.msg)
    }
  } catch (err) {
    console.error('领取失败：', err)
    alert('网络异常，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getCoupons()
})
</script>

<style scoped>
.coupon-page {
  padding: 20px;
  font-family: "Microsoft Yahei", sans-serif;
  width: 1200px;
  margin: 0 auto; /* 页面居中 */
}
.coupon-page h2 {
  color: #333;
  margin: 0 0 20px;
  font-size: 18px;
}
.coupon-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px; /* 两个卡片 + 间距 = 500*2 + 20 = 1020px，小于1200px */
}
.coupon-card {
  width: calc(50% - 10px); /* 一行 2 个，减去一半间距 */
  display: flex;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}
.coupon-left {
  flex: 1;
  background: #ff4d4f;
  color: #fff;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.coupon-value {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
}
.coupon-desc {
  font-size: 12px;
  margin: 5px 0 0;
}
.coupon-right {
  flex: 2;
  padding: 20px;
}
.coupon-right h3 {
  color: #333;
  margin: 0 0 10px;
  font-size: 16px;
}
.coupon-time {
  color: #999;
  font-size: 12px;
  margin: 0 0 15px;
}
.receive-btn {
  background: #ff4d4f;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.receive-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.empty-tip {
  text-align: center;
  color: #999;
  padding: 50px 0;
  font-size: 14px;
  width: 100%; /* 空状态占满整行 */
}
</style>
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
            :disabled="loading || receivedIds.includes(item.id)"
          >
            {{ receivedIds.includes(item.id) ? '已领取' : (loading ? '领取中...' : '立即领取') }}
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
import HeaderNav from './components/HeaderNav.vue'

// ---------------- 当前用户 ----------------
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userId = ref(userInfo.id || 0)

// ---------------- 静态券池（可领取的券） ----------------
const COUPON_POOL = [
  {
    id: 1,
    name: '新人5元无门槛券',
    discount_value: 5,
    min_amount: 0,
    start_time: '2026-01-01 00:00:00',
    end_time: '2026-12-31 23:59:59'
  },
  {
    id: 2,
    name: '满50减10券',
    discount_value: 10,
    min_amount: 50,
    start_time: '2026-01-01 00:00:00',
    end_time: '2026-12-31 23:59:59'
  },
  {
    id: 3,
    name: '满100减20券',
    discount_value: 20,
    min_amount: 100,
    start_time: '2026-01-01 00:00:00',
    end_time: '2026-12-31 23:59:59'
  },
  {
    id: 4,
    name: '满30减5生鲜券',
    discount_value: 5,
    min_amount: 30,
    start_time: '2026-01-01 00:00:00',
    end_time: '2026-12-31 23:59:59'
  },
  {
    id: 5,
    name: '满200减50大额券',
    discount_value: 50,
    min_amount: 200,
    start_time: '2026-01-01 00:00:00',
    end_time: '2026-12-31 23:59:59'
  }
]

const couponList = ref([])       // 展示的券
const receivedIds = ref([])      // 已领取的池子 id 列表
const loading = ref(false)

// ---------------- 时间格式化 ----------------
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.split(' ')[0]
}

// ---------------- localStorage 读写 ----------------
const loadUserCoupons = () => {
  const str = localStorage.getItem('userCoupons')
  if (!str) return []
  try { return JSON.parse(str) || [] } catch (e) { return [] }
}

const saveUserCoupons = (list) => {
  localStorage.setItem('userCoupons', JSON.stringify(list))
}

// ---------------- 加载券列表 ----------------
const getCoupons = () => {
  if (userId.value <= 0) {
    alert('请先登录')
    return
  }

  const now = new Date()

  // 1. 券池过滤：只展示"未过期"的券
  couponList.value = COUPON_POOL.filter(c => new Date(c.end_time) >= now)

  // 2. 查已领取的池子 id
  const all = loadUserCoupons()
  receivedIds.value = all
    .filter(c => c.user_id === userId.value && c.coupon_id)
    .map(c => c.coupon_id)
}

// ---------------- 领取优惠券 ----------------
const receiveCoupon = (couponId) => {
  if (receivedIds.value.includes(couponId)) {
    alert('您已领取过该券')
    return
  }

  const coupon = COUPON_POOL.find(c => c.id === couponId)
  if (!coupon) {
    alert('优惠券不存在')
    return
  }

  if (new Date(coupon.end_time) < new Date()) {
    alert('该券已过期')
    return
  }

  loading.value = true

  // 模拟请求延迟
  setTimeout(() => {
    const all = loadUserCoupons()

    // 双重保险：再查一次重复
    const exists = all.some(c => c.user_id === userId.value && c.coupon_id === couponId)
    if (exists) {
      alert('您已领取过该券')
      loading.value = false
      getCoupons()
      return
    }

    // 写入一条"已领取"记录，结构要和结算页保持一致
    all.push({
      id: Date.now() + couponId,       // 唯一 id
      user_id: userId.value,
      coupon_id: couponId,             // 来源池子 id
      name: coupon.name,
      discount_value: coupon.discount_value,
      min_amount: coupon.min_amount,
      start_time: coupon.start_time,
      end_time: coupon.end_time,
      used: 0
    })
    saveUserCoupons(all)

    loading.value = false
    alert('领取成功！')
    getCoupons()
  }, 300)
}

onMounted(() => {
  getCoupons()
})
</script>

<style scoped>
/* 样式完全保持原样 */
.coupon-page {
  padding: 20px;
  font-family: "Microsoft Yahei", sans-serif;
  width: 1200px;
  margin: 0 auto;
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
  gap: 20px;
}
.coupon-card {
  width: calc(50% - 10px);
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
  width: 100%;
}
</style>

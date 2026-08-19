<template>
  <FreshNav />
  <div class="pay-page">
    <div class="pay-container">
      <h2>订单支付</h2>

      <div class="pay-card" v-if="orderInfo">
        <div class="pay-info">
          <div class="info-item">
            <label>订单号：</label>
            <span>{{ orderInfo.order_no }}</span>
          </div>
          <div class="info-item">
            <label>订单总价：</label>
            <span>¥{{ orderInfo.total_amount.toFixed(2) }}</span>
          </div>
          <div class="info-item" v-if="orderInfo.discount_amount > 0">
            <label>优惠抵扣：</label>
            <span class="red">-¥{{ orderInfo.discount_amount.toFixed(2) }}</span>
          </div>
          <div class="info-item total-price">
            <label>实付金额：</label>
            <span class="red">¥{{ orderInfo.pay_amount.toFixed(2) }}</span>
          </div>
        </div>

        <div class="pay-methods">
          <h3>选择支付方式</h3>
          <div class="method-item" :class="{ active: payMethod === 'wechat' }" @click="payMethod = 'wechat'">
            <img src="../public/pay1.jpg" alt="微信">
            <span>微信支付</span>
          </div>
          <div class="method-item" :class="{ active: payMethod === 'alipay' }" @click="payMethod = 'alipay'">
            <img src="../public/pay2.jpg" alt="支付宝">
            <span>支付宝</span>
          </div>
        </div>

        <div class="pay-btn-box">
          <button class="pay-btn" @click="toPay">确认支付</button>
          <button class="back-btn" @click="back">返回订单</button>
        </div>
      </div>

      <div class="loading" v-else>加载订单信息中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'

const router = useRouter()
const route = useRoute()
axios.defaults.baseURL = 'http://localhost/cai/api'

const orderId = route.params.id
const orderInfo = ref(null)
const payMethod = ref('wechat')

// 获取订单信息（修复版：变量作用域完全正确）
const getOrderDetail = async () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录')
    router.push('/login')
    return
  }
  // 正确定义userInfo变量，作用域覆盖整个函数
  const userInfo = JSON.parse(userInfoStr)
  try {
    const res = await axios.post('/order.php', {
      action: 'detail',
      id: orderId,
      user_id: userInfo.id
    })
    if (res.data.code === 200) {
      orderInfo.value = res.data.data
    } else {
      alert('获取订单失败：' + res.data.msg)
      router.push('/order')
    }
  } catch (e) {
    console.error(e)
    alert('订单加载失败，请重试')
    router.push('/order')
  }
}

// 支付
const toPay = async () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录')
    router.push('/login')
    return
  }
  const userInfo = JSON.parse(userInfoStr)
  try {
    const res = await axios.put('/order.php', {
      id: orderId,
      user_id: userInfo.id,
      action: 'pay'
    })
    if (res.data.code === 200) {
      alert('支付成功！')
      router.push('/order-list')
    } else {
      alert('支付失败：' + res.data.msg)
    }
  } catch (err) {
    console.error(err)
    alert('支付异常')
  }
}

// 返回
const back = () => {
  router.push('/order-list')
}

onMounted(() => {
  getOrderDetail()
})
</script>

<style scoped>
.pay-page {
  width: 100%;
  min-height: 100vh;
  background: #f7f8fa;
  padding: 30px 0;
}
.pay-container {
 width: 1200px;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
}
.pay-container h2 {
  font-size: 24px;
  margin-bottom: 25px;
  text-align: center;
}
.pay-info {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  padding: 10px 0;
}
.red {
  color: #ff4d4f;
  font-weight: bold;
}
.total-price {
  font-size: 18px;
  font-weight: bold;
  border-top: 1px dashed #eee;
  margin-top: 10px;
  padding-top: 15px;
}

.pay-methods h3 {
  font-size: 18px;
  margin-bottom: 15px;
}
.method-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
}
.method-item.active {
  border-color: #ff4d4f;
  background: #fff5f5;
}
.method-item img {
  width: 40px;
  height: 40px;
}

.pay-btn-box {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.pay-btn {
  padding: 12px 40px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}
.back-btn {
  padding: 12px 30px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}
</style>
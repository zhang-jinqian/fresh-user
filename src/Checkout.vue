<template>
  <div class="checkout-page">
    <FreshNav />
    <div class="checkout-container">
      <h2>提交订单</h2>

      <!-- 收货地址：直接填写表单 -->
      <div class="address-section">
        <h3>收货地址</h3>
        <div class="address-form">
          <div class="form-item">
            <label>收货人：</label>
            <input v-model="addressForm.name" type="text" placeholder="请输入收货人姓名"
              :class="{ error: !addressForm.name && submitCheck }" />
          </div>
          <div class="form-item">
            <label>手机号：</label>
            <input v-model="addressForm.phone" type="tel" placeholder="请输入11位手机号"
              :class="{ error: !addressForm.phone && submitCheck }" />
          </div>
          <div class="form-item full">
            <label>详细地址：</label>
            <input v-model="addressForm.address" type="text" placeholder="请输入省市区+详细地址"
              :class="{ error: !addressForm.address && submitCheck }" />
          </div>
        </div>
      </div>

      <!-- 优惠券选择区域 -->
      <div class="coupon-section">
        <h3>
          优惠券
          <span class="coupon-toggle" @click="showCouponList = !showCouponList">
            {{ showCouponList ? '收起 ▲' : '展开 ▼' }}
          </span>
        </h3>
        <!-- 优惠券列表（展开/收起） -->
        <div class="coupon-list" v-if="showCouponList">
          <div class="coupon-item" v-for="coupon in usableCoupons" :key="coupon.id">
            <div class="coupon-info">
              <span class="coupon-value">¥{{ coupon.discount_value }}</span>
              <span class="coupon-condition" v-if="coupon.min_amount > 0">
                满{{ coupon.min_amount }}元可用
              </span>
              <span class="coupon-condition" v-else>无门槛</span>
              <span class="coupon-time">有效期至：{{ formatTime(coupon.end_time) }}</span>
            </div>
            <button class="select-coupon-btn" @click="selectCoupon(coupon)" :disabled="!isCouponUsable(coupon)">
              {{ selectedCoupon.id === coupon.id ? '已选中' : (isCouponUsable(coupon) ? '选择' : '不可用') }}
            </button>
          </div>
          <div class="empty-coupon" v-if="usableCoupons.length === 0">
            暂无可用优惠券
          </div>
        </div>
        <!-- 已选中优惠券展示 -->
        <div class="selected-coupon" v-if="selectedCoupon.id">
          已选中：¥{{ selectedCoupon.discount_value }} {{ selectedCoupon.min_amount > 0 ? `满${selectedCoupon.min_amount}元可用`
            : '无门槛' }}
          <button class="cancel-coupon" @click="cancelCoupon">取消</button>
        </div>
      </div>

      <!-- 商品清单 -->
      <div class="goods-section">
        <h3>商品清单</h3>
        <!-- 商品表头 -->
        <div class="goods-header">
          <div class="col col-name">商品名称</div>
          <div class="col col-count">数量</div>
          <div class="col col-price">单价</div>
          <div class="col col-total">小计</div>
        </div>
        <div class="goods-list">
          <div class="goods-item" v-for="item in orderGoods" :key="item.id">
            <div class="col col-name">
              <img :src="item.img" alt="商品图片" class="goods-img" />
              <span class="goods-name">{{ item.name }}</span>
            </div>
            <div class="col col-count">×{{ item.count }}</div>
            <div class="col col-price">¥{{ item.price }}</div>
            <div class="col col-total">¥{{ (item.price * item.count).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 订单金额（含优惠券抵扣） -->
      <div class="amount-section">
        <div class="amount-item">
          <span>商品总价：</span>
          <span>¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-item discount" v-if="selectedCoupon.id">
          <span>优惠券抵扣：</span>
          <span>-¥{{ discountAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-item total">
          <span>实付金额：</span>
          <span>¥{{ payAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 提交订单 -->
      <div class="submit-section">
        <button @click="submitOrder" class="submit-btn">提交订单</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'

const router = useRouter()
axios.defaults.baseURL = 'http://localhost/cai/api'

// 地址表单
const addressForm = ref({
  name: '',
  phone: '',
  address: ''
})
const submitCheck = ref(false)
const orderGoods = ref([])
// 优惠券相关
const showCouponList = ref(false) // 优惠券列表展开/收起
const usableCoupons = ref([]) // 可用优惠券列表
const selectedCoupon = ref({}) // 选中的优惠券

// 计算商品总价
const totalAmount = computed(() => {
  return orderGoods.value.reduce((sum, item) => sum + item.price * item.count, 0)
})

// 计算优惠券抵扣金额
const discountAmount = computed(() => {
  if (!selectedCoupon.value.id) return 0
  // 如果是满减券，判断是否满足使用条件
  if (selectedCoupon.value.min_amount > 0 && totalAmount.value < selectedCoupon.value.min_amount) {
    return 0
  }
  // 抵扣金额不能超过商品总价
  return Math.min(selectedCoupon.value.discount_value, totalAmount.value)
})

// 计算实付金额
const payAmount = computed(() => {
  const amount = totalAmount.value - discountAmount.value
  return amount < 0 ? 0 : amount
})

// 判断优惠券是否可用
const isCouponUsable = (coupon) => {
  return coupon.min_amount <= totalAmount.value
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.split(' ')[0]
}

// 选择优惠券
const selectCoupon = (coupon) => {
  if (isCouponUsable(coupon)) {
    selectedCoupon.value = coupon
  } else {
    alert(`该优惠券需满${coupon.min_amount}元可用`)
  }
}

// 取消选中优惠券
const cancelCoupon = () => {
  selectedCoupon.value = {}
}

// 查询用户可用优惠券
const getUsableCoupons = async (userId) => {
  try {
    const res = await axios.get('/user_coupon_used.php', {
      params: {
        user_id: userId,
        type: 'usable' // 查询可用优惠券
      }
    })
    if (res.data.code === 200) {
      usableCoupons.value = res.data.data
    }
  } catch (err) {
    console.error('查询优惠券失败：', err)
  }
}

// 初始化购物车商品
const initOrderGoods = () => {
  const cartStr = localStorage.getItem('cartList')
  if (cartStr) {
    try {
      const cartList = JSON.parse(cartStr)
      orderGoods.value = cartList.filter(item => item.checked)
      if (orderGoods.value.length === 0) {
        alert('请选择要结算的商品！')
        router.push('/cart')
      } else {
        // 获取用户信息并查询优惠券
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          getUsableCoupons(userInfo.id)
        }
      }
    } catch (e) {
      console.error('解析购物车失败：', e)
      router.push('/cart')
    }
  } else {
    alert('购物车为空！')
    router.push('/cart')
  }
}

// 提交订单
const submitOrder = async () => {
  submitCheck.value = true
  // 1. 校验地址表单
  if (!addressForm.value.name.trim()) {
    alert('请输入收货人姓名！')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(addressForm.value.phone)) {
    alert('请输入正确的手机号！')
    return
  }
  if (!addressForm.value.address.trim()) {
    alert('请输入详细地址！')
    return
  }

  // 2. 获取用户信息
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录！')
    router.push('/login')
    return
  }
  const userInfo = JSON.parse(userInfoStr)

  try {
    // 3. 第一步：把地址存入address表
    const addressRes = await axios.post('/address.php', {
      user_id: userInfo.id,
      name: addressForm.value.name,
      phone: addressForm.value.phone,
      address: addressForm.value.address
    })

    if (addressRes.data.code !== 200) {
      alert('保存地址失败：' + addressRes.data.msg)
      return
    }
    const addressId = addressRes.data.data.address_id

    // 4. 第二步：创建订单（含优惠券ID）
    const orderRes = await axios.post('/order.php', {
      user_id: userInfo.id,
      total_amount: totalAmount.value,
      discount_amount: discountAmount.value,
      pay_amount: payAmount.value,
      coupon_id: selectedCoupon.value.id || 0,
      address_id: addressId,
      goods: orderGoods.value.map(item => ({
        goods_id: item.id,
        name: item.name,
        price: item.price,
        count: item.count,
        img: item.img
      }))
    })

    if (orderRes.data.code === 200) {
      // 5. ✅ 标记优惠券为已使用（修正传参方式）
     
if (selectedCoupon.value.id) {
  await axios.post('/user_coupon_used.php', {
    user_id: userInfo.id,
    user_coupon_id: selectedCoupon.value.id, // ✅ 用user_coupons.id
    type: 'use'
  })
}
      alert('订单创建成功！订单号：' + orderRes.data.data.order_no)
      // 清空购物车已结算商品
      const cartStr = localStorage.getItem('cartList')
      if (cartStr) {
        const cartList = JSON.parse(cartStr)
        const newCartList = cartList.filter(item => !item.checked)
        localStorage.setItem('cartList', JSON.stringify(newCartList))
      }
      router.push('/order-list')
    } else {
      alert('创建订单失败：' + orderRes.data.msg)
    }
  } catch (error) {
    console.error('提交订单失败：', error)
    alert('网络异常，请重试！')
  }
}

onMounted(() => {
  initOrderGoods()
})
</script>

<style scoped>
/* 页面基础样式 */
.checkout-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30px 0;
}

.checkout-container {
  width: 1200px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.checkout-container h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}

/* 区块标题 */
.address-section h3,
.goods-section h3,
.coupon-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 优惠券区域样式 */
.coupon-section {
  margin-bottom: 40px;
}

.coupon-toggle {
  font-size: 14px;
  color: #ff4d4f;
  cursor: pointer;
}

.coupon-list {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fafafa;
  margin-bottom: 15px;
}

.coupon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 10px;
}

.coupon-item:last-child {
  margin-bottom: 0;
}

.coupon-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.coupon-value {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: bold;
}

.coupon-condition {
  font-size: 14px;
  color: #666;
}

.coupon-time {
  font-size: 12px;
  color: #999;
}

.select-coupon-btn {
  padding: 6px 12px;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  color: #ff4d4f;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.select-coupon-btn:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}

.select-coupon-btn:hover:not(:disabled) {
  background: #ff4d4f;
  color: #fff;
}

.empty-coupon {
  text-align: center;
  color: #999;
  padding: 10px 0;
  font-size: 14px;
}

.selected-coupon {
  padding: 15px;
  background: #fff8f8;
  border: 1px solid #ffdedc;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel-coupon {
  color: #ff4d4f;
  font-size: 12px;
  cursor: pointer;
}

/* 地址表单区域 */
.address-section {
  margin-bottom: 40px;
}

.address-form {
  padding: 25px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fafafa;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.form-item.full {
  align-items: flex-start;
}

.form-item label {
  width: 80px;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.form-item input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-item input:focus {
  outline: none;
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
}

.form-item input.error {
  border-color: #ff4d4f;
}

/* 商品表头 */
.goods-header {
  display: flex;
  padding: 15px 20px;
  background-color: #fafafa;
  border: 1px solid #eee;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.goods-header .col {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.col-name {
  width: 55%;
}

.col-count {
  width: 15%;
  text-align: center;
}

.col-price {
  width: 15%;
  text-align: center;
}

.col-total {
  width: 15%;
  text-align: right;
}

/* 商品列表容器 */
.goods-list {
  border: 1px solid #eee;
  border-top: none;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

/* 商品项布局 */
.goods-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f5f5f5;
}

.goods-item:last-child {
  border-bottom: none;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 15px;
}

.goods-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.goods-name {
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

.col-count,
.col-price,
.col-total {
  font-size: 18px;
  color: #333;
}

.col-count {
  text-align: center;
}

.col-price {
  text-align: center;
}

.col-total {
  text-align: right;
  color: #ff4d4f;
  font-weight: 700;
}

/* 金额区域（新增优惠券抵扣） */
.amount-section {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: right;
}

.amount-item {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
}

.amount-item.discount {
  color: #ff4d4f;
}

.amount-item.total {
  font-size: 22px;
  color: #333;
  margin-bottom: 0;
}

.amount-item.total span:last-child {
  color: #ff4d4f;
  font-weight: 700;
  margin-left: 10px;
}

/* 提交按钮区域 */
.submit-section {
  margin-top: 20px;
  text-align: right;
}

.submit-btn {
  width: 220px;
  padding: 14px 30px;
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;
}

.submit-btn:hover {
  background-color: #ff3838;
}

.submit-btn:active {
  background-color: #e62e2e;
}
</style>
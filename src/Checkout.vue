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
import FreshNav from './components/HeaderNav.vue'

const router = useRouter()

// 地址表单
const addressForm = ref({
  name: '',
  phone: '',
  address: ''
})
const submitCheck = ref(false)
const orderGoods = ref([])

// 优惠券相关
const showCouponList = ref(false)
const usableCoupons = ref([])
const selectedCoupon = ref({})

// 当前用户
let currentUser = null

// ========== 默认优惠券池（每个用户首次登录时自动发放） ==========
const DEFAULT_COUPONS = [
  { id: 1, discount_value: 5,  min_amount: 0,   end_time: '2026-12-31 23:59:59' },
  { id: 2, discount_value: 10, min_amount: 50,  end_time: '2026-12-31 23:59:59' },
  { id: 3, discount_value: 20, min_amount: 100, end_time: '2026-12-31 23:59:59' }
]

// ========== 计算逻辑（保留原逻辑） ==========
const totalAmount = computed(() => {
  return orderGoods.value.reduce((sum, item) => sum + item.price * item.count, 0)
})

const discountAmount = computed(() => {
  if (!selectedCoupon.value.id) return 0
  if (selectedCoupon.value.min_amount > 0 && totalAmount.value < selectedCoupon.value.min_amount) {
    return 0
  }
  return Math.min(selectedCoupon.value.discount_value, totalAmount.value)
})

const payAmount = computed(() => {
  const amount = totalAmount.value - discountAmount.value
  return amount < 0 ? 0 : amount
})

const isCouponUsable = (coupon) => {
  return coupon.min_amount <= totalAmount.value
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.split(' ')[0]
}

const selectCoupon = (coupon) => {
  if (isCouponUsable(coupon)) {
    selectedCoupon.value = coupon
  } else {
    alert(`该优惠券需满${coupon.min_amount}元可用`)
  }
}

const cancelCoupon = () => {
  selectedCoupon.value = {}
}

// ========== 用户优惠券（存 localStorage.userCoupons） ==========
const loadUserCoupons = () => {
  const str = localStorage.getItem('userCoupons')
  if (!str) return []
  try { return JSON.parse(str) || [] } catch (e) { return [] }
}

const saveUserCoupons = (list) => {
  localStorage.setItem('userCoupons', JSON.stringify(list))
}

// 取某用户当前可用的优惠券
const getUsableCoupons = (userId) => {
  let all = loadUserCoupons()

  // 如果该用户还没有券，发放默认券
  const hasAny = all.some(c => c.user_id === userId)
  if (!hasAny) {
    DEFAULT_COUPONS.forEach(c => {
      all.push({
        id: Date.now() + c.id,          // 生成唯一 id
        user_id: userId,
        discount_value: c.discount_value,
        min_amount: c.min_amount,
        end_time: c.end_time,
        used: 0                          // 0 未使用 / 1 已使用
      })
    })
    saveUserCoupons(all)
  }

  // 过滤：属于该用户 + 未使用 + 未过期
  const now = new Date()
  usableCoupons.value = all.filter(c =>
    c.user_id === userId &&
    c.used === 0 &&
    new Date(c.end_time) >= now
  )
}

// 标记优惠券为已使用
const markCouponUsed = (userId, couponId) => {
  const all = loadUserCoupons()
  const idx = all.findIndex(c => c.id === couponId && c.user_id === userId)
  if (idx > -1) {
    all[idx].used = 1
    saveUserCoupons(all)
  }
}

// ========== 购物车读取 ==========
const initOrderGoods = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录！')
    router.push('/login')
    return
  }
  currentUser = JSON.parse(userInfoStr)

  const cartStr = localStorage.getItem('cartList')
  if (!cartStr) {
    alert('购物车为空！')
    router.push('/cart')
    return
  }

  try {
    const cartList = JSON.parse(cartStr)
    orderGoods.value = cartList.filter(item => item.checked)

    if (orderGoods.value.length === 0) {
      alert('请选择要结算的商品！')
      router.push('/cart')
      return
    }

    // 加载优惠券
    getUsableCoupons(currentUser.id)

    // 顺带回填上次用过的地址，提升体验（可选）
    const savedAddr = localStorage.getItem('userAddress')
    if (savedAddr) {
      try {
        const arr = JSON.parse(savedAddr)
        const last = arr.find(a => a.user_id === currentUser.id)
        if (last) {
          addressForm.value = {
            name: last.name,
            phone: last.phone,
            address: last.address
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error('解析购物车失败：', e)
    router.push('/cart')
  }
}

// ========== 提交订单（静态版） ==========
const submitOrder = () => {
  submitCheck.value = true

  // 1. 校验地址
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

  // 2. 用户校验
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录！')
    router.push('/login')
    return
  }
  const userInfo = JSON.parse(userInfoStr)

  // 3. 保存地址到 localStorage.userAddress
  let addressList = []
  try { addressList = JSON.parse(localStorage.getItem('userAddress')) || [] } catch (e) {}
  const addressId = Date.now()
  addressList.push({
    address_id: addressId,
    user_id: userInfo.id,
    name: addressForm.value.name,
    phone: addressForm.value.phone,
    address: addressForm.value.address,
    create_time: new Date().toLocaleString()
  })
  localStorage.setItem('userAddress', JSON.stringify(addressList))

  // 4. 生成订单号：DD + yyyyMMddHHmmss + 3位随机
  const now = new Date()
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const orderNo = 'DD'
    + now.getFullYear()
    + pad(now.getMonth() + 1)
    + pad(now.getDate())
    + pad(now.getHours())
    + pad(now.getMinutes())
    + pad(now.getSeconds())
    + pad(Math.floor(Math.random() * 1000), 3)

  // 5. 组装订单数据，写入 localStorage.orderList
  const newOrder = {
    id: Date.now(),
    order_no: orderNo,
    user_id: userInfo.id,
    user_name: userInfo.name,
    user_phone: userInfo.phone,
    total_amount: Number(totalAmount.value.toFixed(2)),
    discount_amount: Number(discountAmount.value.toFixed(2)),
    pay_amount: Number(payAmount.value.toFixed(2)),
    coupon_id: selectedCoupon.value.id || 0,
    coupon_info: selectedCoupon.value.id
      ? {
          discount_value: selectedCoupon.value.discount_value,
          min_amount: selectedCoupon.value.min_amount
        }
      : null,
    address_id: addressId,
    address: { ...addressForm.value },
    goods: orderGoods.value.map(item => ({
      goods_id: item.id,
      name: item.name,
      price: item.price,
      count: item.count,
      img: item.img
    })),
    status: 1,                            // 1=待发货
    create_time: new Date().toLocaleString()
  }

  let orderList = []
  try { orderList = JSON.parse(localStorage.getItem('orderList')) || [] } catch (e) {}
  orderList.unshift(newOrder)             // 新的在前
  localStorage.setItem('orderList', JSON.stringify(orderList))

  // 6. 标记优惠券已使用
  if (selectedCoupon.value.id) {
    markCouponUsed(userInfo.id, selectedCoupon.value.id)
  }

  // 7. 从购物车移除已结算商品
  const cartStr = localStorage.getItem('cartList')
  if (cartStr) {
    try {
      const cartList = JSON.parse(cartStr)
      const newCartList = cartList.filter(item => !item.checked)
      localStorage.setItem('cartList', JSON.stringify(newCartList))
    } catch (e) {}
  }

  alert('订单创建成功！订单号：' + orderNo)
  router.push('/order-list')
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

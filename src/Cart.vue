<template>
  <FreshNav />
  <div class="cart-page">
    <div class="cart-container">
      <h2 class="cart-title">我的购物车</h2>

      <!-- 空购物车提示 -->
      <div class="empty-cart" v-if="cartList.length === 0">
        <img src="https://img.icons8.com/fluency/96/000000/shopping-cart.png" alt="空购物车" />
        <p>您的购物车还是空的~</p>
        <button class="go-shopping-btn" @click="goToGoodsList">去逛逛</button>
      </div>

      <!-- 购物车列表 -->
      <div class="cart-content" v-else>
        <!-- 购物车表头 -->
        <div class="cart-header">
          <div class="col-check">全选 <input type="checkbox" v-model="selectAll" @change="handleSelectAll" /></div>
          <div class="col-img">商品图片</div>
          <div class="col-name">商品名称</div>
          <div class="col-price">单价</div>
          <div class="col-count">数量</div>
          <div class="col-total">小计</div>
          <div class="col-op">操作</div>
        </div>

        <!-- 购物车商品列表 -->
        <div class="cart-list">
          <div 
            class="cart-item" 
            v-for="(item, index) in cartList" 
            :key="item.id"
          >
            <div class="col-check">
              <input 
                type="checkbox" 
                v-model="item.checked" 
                @change="calcTotalPrice"
              />
            </div>
            <div class="col-img">
              <img :src="item.img" alt="商品图片" />
            </div>
            <div class="col-name">{{ item.name }}</div>
            <div class="col-price">¥{{ item.price }}</div>
            <div class="col-count">
              <button 
                class="count-btn minus" 
                @click="changeCount(item, -1)"
                :disabled="item.count <= 1"
              >-</button>
              <input 
                type="number" 
                v-model.number="item.count" 
                min="1" 
                @change="handleCountInput(item)"
              />
              <button 
                class="count-btn plus" 
                @click="changeCount(item, 1)"
              >+</button>
            </div>
            <div class="col-total">¥{{ (item.price * item.count).toFixed(2) }}</div>
            <div class="col-op">
              <button class="delete-btn" @click="deleteCartItem(index)">删除</button>
            </div>
          </div>
        </div>

        <!-- 购物车底部操作栏 -->
        <div class="cart-footer">
          <button class="clear-cart-btn" @click="clearCart">清空购物车</button>
          <div class="cart-total">
            <span class="total-text">已选商品总价：</span>
            <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <button class="checkout-btn" @click="checkout" :disabled="selectedCount === 0">
            结算 ({{ selectedCount }}件)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'

// 初始化路由
const router = useRouter()

// 配置axios
axios.defaults.baseURL = 'http://localhost/cai/api'

// 购物车列表（从本地存储读取，实现数据持久化）
const cartList = ref([])

// 全选状态
const selectAll = ref(false)

// 计算属性：选中商品数量
const selectedCount = computed(() => {
  return cartList.value.filter(item => item.checked).reduce((sum, item) => sum + item.count, 0)
})

// 计算属性：选中商品总价
const totalPrice = computed(() => {
  return cartList.value.filter(item => item.checked).reduce((sum, item) => {
    return sum + (item.price * item.count)
  }, 0)
})

// 初始化购物车（从localStorage读取）
const initCart = () => {
  const cartStr = localStorage.getItem('cartList')
  if (cartStr) {
    try {
      cartList.value = JSON.parse(cartStr)
      // 确保每个商品有checked属性
      cartList.value.forEach(item => {
        if (item.checked === undefined) {
          item.checked = true
        }
      })
    } catch (e) {
      console.error('解析购物车数据失败：', e)
      cartList.value = []
    }
  }
  // 初始化全选状态
  updateSelectAllStatus()
}

// 更新全选状态
const updateSelectAllStatus = () => {
  if (cartList.value.length === 0) {
    selectAll.value = false
    return
  }
  selectAll.value = cartList.value.every(item => item.checked)
}

// 监听购物车变化，同步到localStorage
watch(
  cartList,
  (newCart) => {
    localStorage.setItem('cartList', JSON.stringify(newCart))
    updateSelectAllStatus()
    calcTotalPrice()
  },
  { deep: true }
)

// 全选/取消全选
const handleSelectAll = () => {
  cartList.value.forEach(item => {
    item.checked = selectAll.value
  })
  calcTotalPrice()
}

// 修改商品数量
const changeCount = (item, num) => {
  const newCount = item.count + num
  if (newCount < 1) return
  item.count = newCount
  calcTotalPrice()
}

// 手动输入数量校验
const handleCountInput = (item) => {
  if (isNaN(item.count) || item.count < 1) {
    item.count = 1
  }
  item.count = Math.floor(item.count) // 确保是整数
  calcTotalPrice()
}

// 删除购物车商品
const deleteCartItem = (index) => {
  if (confirm('确定删除该商品吗？')) {
    cartList.value.splice(index, 1)
  }
}

// 清空购物车
const clearCart = () => {
  if (confirm('确定清空购物车吗？')) {
    cartList.value = []
    localStorage.removeItem('cartList')
  }
}

// 计算总价（强制更新）
const calcTotalPrice = () => {
  // 触发计算属性更新
  return totalPrice.value
}

// 结算
const checkout = () => {
  if (selectedCount.value === 0) {
    alert('请选择要结算的商品！')
    return
  }
  // 跳转到结算页，由结算页处理地址填写和订单创建
  router.push('/checkout')
}
  
  

// 跳转到商品列表页
const goToGoodsList = () => {
  router.push('/list')
}

// 初始化
onMounted(() => {
  initCart()
})
</script>

<style scoped>

.cart-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: "Microsoft Yahei", sans-serif;
  padding: 20px 0;
  display: flex;
  justify-content: center; /* 让容器水平居中 */
}

/* 新增：固定宽度容器，解决布局变小问题 */
.cart-container {
  width: 1200px; /* 固定宽度，和导航栏保持一致 */
  min-width: 1200px; /* 强制最小宽度，避免被压缩 */
  max-width: 1200px; /* 限制最大宽度，防止拉伸变形 */
  margin: 0 auto;
  padding: 0 20px;
  background-color: #f7f8fa; /* 和页面背景保持一致 */
}

.cart-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 空购物车样式 */
.empty-cart {
  text-align: center;
  padding: 80px 0;
  background-color: #fff;
  border-radius: 8px;
}

.empty-cart img {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-cart p {
  font-size: 18px;
  color: #999;
  margin-bottom: 30px;
}

.go-shopping-btn {
  padding: 10px 30px;
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.go-shopping-btn:hover {
  opacity: 0.9;
}

/* 购物车内容样式 */
.cart-content {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 购物车表头 */
.cart-header {
  display: flex;
  background-color: #f5f5f5;
  padding: 15px;
  font-weight: 700;
  color: #333;
}

/* 购物车列样式 */
.col-check {
  width: 80px;
  text-align: center;
}

.col-img {
  width: 100px;
  text-align: center;
}

.col-name {
  flex: 1;
  padding: 0 10px;
}

.col-price {
  width: 100px;
  text-align: center;
}

.col-count {
  width: 150px;
  text-align: center;
}

.col-total {
  width: 100px;
  text-align: center;
}

.col-op {
  width: 80px;
  text-align: center;
}

/* 购物车商品项 */
.cart-list {
  border-bottom: 1px solid #eee;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item .col-img img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

/* 数量操作按钮 */
.count-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #eee;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 16px;
}

.count-btn:disabled {
  background-color: #eee;
  cursor: not-allowed;
  color: #999;
}

.col-count input {
  width: 50px;
  height: 30px;
  text-align: center;
  border: 1px solid #eee;
  margin: 0 5px;
  outline: none;
}

/* 删除按钮 */
.delete-btn {
  color: #ff4d4f;
  border: none;
  background: none;
  cursor: pointer;
}

.delete-btn:hover {
  text-decoration: underline;
}

/* 购物车底部 */
.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
}

.clear-cart-btn {
  padding: 8px 15px;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  background: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear-cart-btn:hover {
  background-color: #fff0f0;
}

.cart-total {
  font-size: 18px;
}

.total-price {
  color: #ff4d4f;
  font-weight: 700;
  margin-left: 10px;
}

.checkout-btn {
  padding: 10px 30px;
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.checkout-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.checkout-btn:hover:not(:disabled) {
  opacity: 0.9;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .cart-header, .cart-item {
    flex-wrap: wrap;
  }
  
  .col-check {
    width: 100%;
    text-align: left;
    margin-bottom: 10px;
  }
  
  .col-img {
    width: 80px;
  }
  
  .col-name {
    flex: auto;
    width: calc(100% - 80px - 10px);
    padding: 0;
    margin-left: 10px;
  }
  
  .col-price, .col-count, .col-total, .col-op {
    width: 25%;
    margin-top: 10px;
  }
  
  .cart-footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
}
</style>
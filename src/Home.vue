<template>
  <div class="home-page">
    <!-- 头部：导航+轮播图 -->
    <header class="header-container">
      <!-- 导航栏 -->
      <nav class="fresh-nav">
        <div class="nav-wrapper">
          <div class="nav-logo">
            <img :src="../asset/logo.png" alt="生鲜购" class="logo-img">
            <span class="logo-text">生鲜购</span>
          </div>

          <ul class="nav-menu">
            <li
              v-for="item in navList"
              :key="item.id"
              class="menu-item"
              @mouseenter="showDropdown(item.id)"
              @mouseleave="hideDropdown(item.id)"
            >
              <a :href="item.path" :class="{ 'active': item.isActive }" class="menu-link">
                {{ item.name }}
                <i v-if="item.children.length" class="arrow-icon">▼</i>
              </a>

              <div v-if="item.children.length && item.showDropdown" class="dropdown-menu">
                <ul>
                  <li v-for="child in item.children" :key="child.id" class="dropdown-item">
                    <a :href="child.path" class="dropdown-link">{{ child.name }}</a>
                  </li>
                </ul>
              </div>
            </li>

            <!-- 登录/注册 / 欢迎语 -->
            <li v-if="!isLogin" class="menu-item login-register-item">
              <a href="/login" class="menu-link login-link">登录</a>
              <span class="split-line">|</span>
              <a href="/register" class="menu-link register-link">注册</a>
            </li>
            <li v-else class="menu-item welcome-item">
              <span class="welcome-text">欢迎，{{ userName }}</span>
              <a href="/logout" class="menu-link logout-link" @click="logout">退出</a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- 轮播图 -->
      <div class="carousel-container" @mouseenter="stopCarousel" @mouseleave="startCarousel">
        <div
          class="carousel-wrapper"
          :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
        >
          <div
            v-for="(item, index) in carouselList"
            :key="index"
            class="carousel-item"
          >
            <img
              :src="item.imageUrl"
              :alt="item.title"
              class="carousel-img"
              @error="onImgError"
            >
          </div>
        </div>

        <div class="carousel-indicators">
          <span
            v-for="(item, index) in carouselList"
            :key="index"
            class="indicator-dot"
            :class="{ active: currentIndex === index }"
            @click="switchTo(index)"
          ></span>
        </div>

        <button class="carousel-btn prev-btn" @click="prevSlide">◀</button>
        <button class="carousel-btn next-btn" @click="nextSlide">▶</button>
      </div>
    </header>

    <!-- 核心品类入口（静态数据） -->
    <section class="category-section">
      <div class="category-wrapper">
        <h2 class="section-title">精选品类</h2>
        <div v-if="categoryList.length === 0" class="empty-tip">暂无分类数据</div>
        <div v-else class="category-list">
          <div
            v-for="category in categoryList"
            :key="category.id"
            class="category-item"
            @click="goToCategoryList(category.id)"
          >
            <div class="category-img-wrapper">
              <img
                :src="category.image"
                :alt="category.name"
                class="category-img"
                @error="onImgError"
              >
            </div>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 限时秒杀区（静态数据） -->
    <section class="seckill-section">
      <div class="seckill-wrapper">
        <div class="seckill-header">
          <h2 class="seckill-title">限时秒杀 <span class="seckill-tag">今日特惠</span></h2>
          <div class="countdown">
            <span class="countdown-item">{{ hour }}</span>
            <span>:</span>
            <span class="countdown-item">{{ minute }}</span>
            <span>:</span>
            <span class="countdown-item">{{ second }}</span>
          </div>
        </div>
        <div v-if="seckillList.length === 0" class="empty-tip">暂无秒杀商品</div>
        <div v-else class="seckill-list">
          <div v-for="goods in seckillList" :key="goods.id" class="seckill-item">
            <img
              :src="goods.img"
              :alt="goods.name"
              class="seckill-img"
              @error="onImgError"
            >
            <h3 class="goods-name">{{ goods.name }}</h3>
            <div class="price-group">
              <span class="current-price">¥{{ goods.discount_value }}</span>
              <span class="original-price">¥{{ goods.original_price || goods.price }}</span>
            </div>
            <button class="buy-btn" @click="addToCart(goods)">立即抢购</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 品质推荐区（静态数据） -->
    <section class="recommend-section">
      <div class="recommend-wrapper">
        <h2 class="section-title">品质推荐</h2>
        <div v-if="recommendList.length === 0" class="empty-tip">暂无推荐商品</div>
        <div v-else class="recommend-grid">
          <div v-for="goods in recommendList" :key="goods.id" class="recommend-item">
            <img
              :src="goods.image"
              :alt="goods.name"
              class="recommend-img"
              @error="onImgError"
            >
            <div class="goods-info">
              <h3 class="goods-name">{{ goods.name }}</h3>
              <p class="goods-desc">{{ goods.desc }}</p>
              <div class="price-box">
                <span class="current-price">¥{{ goods.price }}</span>
              </div>
              <div class="cart-btn-box">
                <button
                  class="add-cart-btn"
                  @click="addToCart(goods)"
                  :disabled="goods.soldOut"
                >
                  {{ goods.soldOut ? '已售罄' : '加入购物车' }}
                </button>
                <span class="cart-count" v-if="goods.count > 0">已加入{{ goods.count }}件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ---------------- 图片基础路径（指向 public 目录） ----------------
const BASE = import.meta.env.BASE_URL

// 图片加载失败时的兜底图（public/默认图.jpg，可自行修改）
const onImgError = (e) => {
  e.target.src = BASE + 'default.jpg'
}

// ---------------- 登录状态管理 ----------------
const isLogin = ref(false)
const userName = ref('')

const logout = (e) => {
  e.preventDefault()
  isLogin.value = false
  userName.value = ''
  localStorage.removeItem('isLogin')
  localStorage.removeItem('userName')
  window.location.href = '/'
}

const initLoginState = () => {
  const loginState = localStorage.getItem('isLogin')
  const name = localStorage.getItem('userName')
  if (loginState === 'true' && name) {
    isLogin.value = true
    userName.value = name
  }
}

// ---------------- 导航数据（静态） ----------------
const navList = ref([
  { id: 1, name: '首页', path: '/', isActive: true, showDropdown: false, children: [] },
  { id: 2, name: '生鲜列表', path: '/fresh-user/#/list', isActive: false, showDropdown: false, children: [] },
  { id: 3, name: '购物车', path: '/fresh-user/#/cart', isActive: false, showDropdown: false, children: [] },
  { id: 4, name: '我的订单', path: '/fresh-user/#/order-list', isActive: false, showDropdown: false, children: [] },
  { id: 5, name: '优惠券', path: '/fresh-user/#/coupon', isActive: false, showDropdown: false, children: [] }
])

const showDropdown = (id) => {
  const menuItem = navList.value.find(item => item.id === id)
  if (menuItem) menuItem.showDropdown = true
}

const hideDropdown = (id) => {
  const menuItem = navList.value.find(item => item.id === id)
  if (menuItem) menuItem.showDropdown = false
}

// ---------------- 轮播图数据（public/b1.jpg、b2.jpg、b3.jpg） ----------------
const carouselList = ref([
  { title: '轮播图1', imageUrl: BASE + 'b1.jpg' },
  { title: '轮播图2', imageUrl: BASE + 'b2.jpg' },
  { title: '轮播图3', imageUrl: BASE + 'b3.jpg' }
])

const currentIndex = ref(0)
let carouselTimer = null

const startCarousel = () => {
  stopCarousel()
  carouselTimer = setInterval(nextSlide, 3000)
}

const stopCarousel = () => {
  if (carouselTimer) clearInterval(carouselTimer)
}

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % carouselList.value.length
}

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + carouselList.value.length) % carouselList.value.length
}

const switchTo = (index) => {
  currentIndex.value = index
}

// ---------------- 品类数据（public/1.jpg ~ 8.jpg） ----------------
const categoryList = ref([
  { id: 1, name: '新鲜蔬菜', image: BASE + '1.jpg' },
  { id: 2, name: '时令水果', image: BASE + '2.jpg' },
  { id: 3, name: '肉禽蛋品', image: BASE + '3.jpg' },
  { id: 4, name: '海鲜水产', image: BASE + '4.jpg' },
  { id: 5, name: '米面粮油', image: BASE + '5.jpg' },
  { id: 6, name: '乳品烘焙', image: BASE + '6.jpg' },
  { id: 7, name: '冷冻速食', image: BASE + '7.jpg' },
  { id: 8, name: '休闲零食', image: BASE + '8.jpg' }
])

const goToCategoryList = (categoryId) => {
  window.location.href = `/list?category_id=${categoryId}`
}

// ---------------- 限时秒杀（静态数据，public/goods1.jpg ~ goods6.jpg） ----------------
const seckillList = ref([
  { id: 101, name: '有机小番茄 500g',     img: BASE + 'goods1.jpg',  discount_value: 9.9,  original_price: 19.9, price: 19.9, stock: 50, count: 0, soldOut: false },
  { id: 102, name: '海南贵妃芒 2.5kg',    img: BASE + 'goods2.jpg',  discount_value: 29.9, original_price: 59.9, price: 59.9, stock: 30, count: 0, soldOut: false },
  { id: 103, name: '现摘奶油草莓 1kg',    img: BASE + 'goods3.jpg',  discount_value: 39.9, original_price: 79.9, price: 79.9, stock: 20, count: 0, soldOut: false },
  { id: 104, name: '农家散养土鸡蛋 30枚', img: BASE + 'goods4.jpg',  discount_value: 19.9, original_price: 39.9, price: 39.9, stock: 80, count: 0, soldOut: false },
  { id: 105, name: '鲜活基围虾 500g',     img: BASE + 'goods5.jpg',  discount_value: 49.9, original_price: 89.9, price: 89.9, stock: 15, count: 0, soldOut: false },
  { id: 106, name: '新疆冰糖心苹果 5kg',  img: BASE + 'goods6.jpg',  discount_value: 35.9, original_price: 69.9, price: 69.9, stock: 60, count: 0, soldOut: false }
])

const hour = ref('00')
const minute = ref('00')
const second = ref('00')
let countdownTimer = null

// 倒计时（默认当天 23:59:59 结束；可改为固定时间）
const setCountdown = () => {
  const endTime = new Date()
  endTime.setHours(23, 59, 59, 999)

  const updateCountdown = () => {
    const remaining = endTime - new Date()
    if (remaining <= 0) {
      hour.value = '00'
      minute.value = '00'
      second.value = '00'
      clearInterval(countdownTimer)
      return
    }

    const h = Math.floor(remaining / (1000 * 60 * 60))
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((remaining % (1000 * 60)) / 1000)

    hour.value = String(h).padStart(2, '0')
    minute.value = String(m).padStart(2, '0')
    second.value = String(s).padStart(2, '0')
  }

  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
}

// ---------------- 品质推荐（静态数据，public/goods7.jpg ~ goods12.jpg） ----------------
const recommendList = ref([
  { id: 201, name: '有机西兰花 500g',       image: BASE + 'goods7.jpg',  desc: '当日采摘，脆嫩清甜，富含膳食纤维',     price: 12.8,  stock: 100, sales: 980, count: 0, soldOut: false },
  { id: 202, name: '泰国金枕头榴莲',         image: BASE + 'goods8.jpg',  desc: '树上熟，果肉金黄，香糯绵密',           price: 99.0,  stock: 20,  sales: 860, count: 0, soldOut: false },
  { id: 203, name: '内蒙古草原羊肉卷 500g',  image: BASE + 'goods9.jpg',  desc: '6月龄羔羊，涮煮不膻，鲜嫩多汁',         price: 45.9,  stock: 50,  sales: 720, count: 0, soldOut: false },
  { id: 204, name: '鲜活大闸蟹 4只装',       image: BASE + 'goods10.jpg', desc: '阳澄湖直发，膏满黄肥，鲜活到家',       price: 128.0, stock: 0,   sales: 650, count: 0, soldOut: true  },
  { id: 205, name: '云南紫皮独头蒜 1kg',     image: BASE + 'goods11.jpg', desc: '辛香浓郁，蒜味十足，产地直供',         price: 8.9,   stock: 200, sales: 590, count: 0, soldOut: false },
  { id: 206, name: '现磨黑豆浆粉 600g',      image: BASE + 'goods12.jpg', desc: '非转基因黑豆，无蔗糖添加，冲泡即饮',   price: 25.9,  stock: 120, sales: 530, count: 0, soldOut: false }
])

// ---------------- 购物车（仅加1） ----------------
const syncFromLocalCart = () => {
  const cartStr = localStorage.getItem('cartList')
  if (!cartStr) return

  try {
    const cartList = JSON.parse(cartStr)
    recommendList.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) goods.count = cartItem.count
    })
    seckillList.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) goods.count = cartItem.count
    })
  } catch (e) {
    console.error('解析购物车数据失败：', e)
  }
}

const syncToLocalCart = () => {
  let cartList = []
  const existingCartStr = localStorage.getItem('cartList')
  if (existingCartStr) {
    try {
      cartList = JSON.parse(existingCartStr)
    } catch (e) {
      cartList = []
    }
  }

  // 推荐商品
  recommendList.value.forEach(goods => {
    if (goods.count > 0) {
      const index = cartList.findIndex(item => item.id === goods.id)
      if (index > -1) {
        cartList[index].count = goods.count
      } else {
        cartList.push({
          id: goods.id,
          name: goods.name,
          price: goods.price,
          img: goods.image,
          count: goods.count,
          checked: true
        })
      }
    }
  })

  // 秒杀商品（使用促销价）
  seckillList.value.forEach(goods => {
    if (goods.count > 0) {
      const index = cartList.findIndex(item => item.id === goods.id)
      if (index > -1) {
        cartList[index].count = goods.count
      } else {
        cartList.push({
          id: goods.id,
          name: goods.name,
          price: goods.discount_value || goods.price,
          img: goods.img,
          count: goods.count,
          checked: true
        })
      }
    }
  })

  localStorage.setItem('cartList', JSON.stringify(cartList))
}

const addToCart = (goods) => {
  if (goods.stock === 0) {
    alert('该商品已售罄，无法加入购物车！')
    return
  }
  goods.count = (goods.count || 0) + 1
  syncToLocalCart()
  alert(`成功将【${goods.name}】加入购物车！当前数量：${goods.count}`)
}

// ---------------- 生命周期钩子 ----------------
onMounted(() => {
  initLoginState()
  startCarousel()
  setCountdown()
  syncFromLocalCart()
})

onUnmounted(() => {
  stopCarousel()
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
/* 全局页面样式 */
.home-page {
  width: 100%;
  min-height: 100vh;
  font-family: "Microsoft Yahei", sans-serif;
}

/* 头部容器：包含导航+轮播 */
.header-container {
  position: relative;
  width: 100%;
}

/* 导航栏样式 */
.fresh-nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: transparent;
  z-index: 999;
}

.nav-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 30px;
  align-items: center;
}

.menu-item {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
}

.menu-link {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-link.active,
.menu-link:hover {
  color: #00b42a;
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s;
}

.menu-item:hover .arrow-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  transform: none;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 12px 0;
  min-width: 180px;
  margin-top: 0;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.dropdown-menu ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dropdown-link {
  display: block;
  padding: 8px 20px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.3s, color 0.3s;
}

.dropdown-link:hover {
  background-color: #f5f5f5;
  color: #00b42a;
}

/* 登录/注册/欢迎语样式 */
.login-register-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.split-line {
  color: #fff;
  font-size: 14px;
}

.login-link, .register-link {
  font-size: 16px;
}

.welcome-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.welcome-text {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.logout-link {
  font-size: 14px;
  color: #ffd000;
}

.logout-link:hover {
  color: #ffb800;
}

/* 轮播图样式 */
.carousel-container {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
}

.carousel-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.carousel-item {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 轮播指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background-color 0.3s;
}

.indicator-dot.active {
  background-color: #00b42a;
}

/* 左右切换按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 53px;
  border-radius: 15px;
  color: #333333;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-btn:hover {
  background-color: #f5f5f5;
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

/* 品类入口样式 */
.category-section {
  padding: 40px 0;
  background-color: #f9f9f9;
}

.category-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

/* 加载/空数据提示 */
.loading-tip, .empty-tip {
  text-align: center;
  font-size: 16px;
  color: #666;
  padding: 10px 0;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s;
  background: #f8f9fa;
  padding: 15px 25px;
  border-radius: 8px;
  border: 1px solid #eee;
  width: 120px;
}

.category-item:hover {
  transform: scale(1.05);
  background: #e8f4f8;
  border-color: #00b42a;
}

/* 分类圆形图片样式 */
.category-img-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  border: 2px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.category-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.category-item:hover .category-img {
  transform: scale(1.1);
}

.category-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

/* 秒杀区样式 */
.seckill-section {
  padding: 40px 0;
  background-color: #fff;
}

.seckill-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.seckill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.seckill-title {
  font-size: 24px;
  font-weight: 700;
  color: #e64340;
}

.seckill-tag {
  font-size: 14px;
  color: #fff;
  background-color: #e64340;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 10px;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 18px;
  color: #e64340;
}

.countdown-item {
  width: 30px;
  height: 30px;
  background-color: #e64340;
  color: #fff;
  text-align: center;
  line-height: 30px;
  border-radius: 4px;
}

.seckill-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.seckill-item {
  flex: 0 0 200px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.seckill-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.goods-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-group {
  margin-bottom: 15px;
}

.current-price {
  font-size: 18px;
  color: #e64340;
  font-weight: 700;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
  margin-left: 5px;
}

.buy-btn {
  width: 100%;
  background-color: #e64340;
  color: #fff;
  border: none;
  padding: 8px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.buy-btn:hover {
  background-color: #d43734;
}

/* 推荐区样式 */
.recommend-section {
  padding: 40px 0;
  background-color: #f9f9f9;
}

.recommend-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.recommend-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.recommend-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.goods-info {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.goods-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-box {
  margin-bottom: 10px;
}

.current-price {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: 700;
}

/* 绿色加入购物车按钮样式 */
.cart-btn-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-cart-btn {
  background-color: #00b42a;
  color: #fff;
  border: none;
  padding: 6px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-cart-btn:hover {
  background-color: #009a24;
}

.add-cart-btn:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.cart-count {
  font-size: 12px;
  color: #666;
}
</style>

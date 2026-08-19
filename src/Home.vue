<template>
  <div class="home-page">
    <!-- 头部：导航+轮播图 -->
    <header class="header-container">
      <!-- 导航栏 -->
      <nav class="fresh-nav">
        <div class="nav-wrapper">
          <div class="nav-logo">
            <img
              src="./assets/logo.png"
              alt="生鲜购"
              class="logo-img"
            >
            <span class="logo-text">生鲜购</span>
          </div>

          <ul class="nav-menu">
            <!-- 原有导航项 -->
            <li
              v-for="item in navList"
              :key="item.id"
              class="menu-item"
              @mouseenter="showDropdown(item.id)"
              @mouseleave="hideDropdown(item.id)"
            >
              <a
                :href="item.path"
                :class="{ 'active': item.isActive }"
                class="menu-link"
              >
                {{ item.name }}
                <i v-if="item.children.length" class="arrow-icon">▼</i>
              </a>

              <div
                v-if="item.children.length && item.showDropdown"
                class="dropdown-menu"
              >
                <ul>
                  <li v-for="child in item.children" :key="child.id" class="dropdown-item">
                    <a :href="child.path" class="dropdown-link">{{ child.name }}</a>
                  </li>
                </ul>
              </div>
            </li>

            <!-- 登录/注册 / 欢迎语 动态渲染 -->
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
            <img :src="item.imageUrl" :alt="item.title" class="carousel-img">
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

    <!-- 核心品类入口（对接category表） -->
    <section class="category-section">
      <div class="category-wrapper">
        <h2 class="section-title">精选品类</h2>
        <!-- 加载中提示 -->
        <div v-if="loading.category" class="loading-tip">加载中...</div>
        <!-- 空数据提示 -->
        <div v-else-if="categoryList.length === 0" class="empty-tip">暂无分类数据</div>
        <div v-else class="category-list">
          <div
            v-for="category in categoryList"
            :key="category.id"
            class="category-item"
            @click="goToCategoryList(category.id)"
          >
            <!-- 添加圆形图片 -->
            <div class="category-img-wrapper">
              <img 
                :src="category.image || `../public/${category.id}.jpg`" 
                :alt="category.name" 
                class="category-img"
              >
            </div>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 限时秒杀区（对接营销活动表） -->
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
        <!-- 加载中提示 -->
        <div v-if="loading.seckill" class="loading-tip">加载中...</div>
        <!-- 空数据提示 -->
        <div v-else-if="seckillList.length === 0" class="empty-tip">暂无秒杀商品</div>
        <div v-else class="seckill-list">
          <div
            v-for="goods in seckillList"
            :key="goods.id"
            class="seckill-item"
          >
            <img :src="goods.img" :alt="goods.name" class="seckill-img">
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

    <!-- 品质推荐区（按订单销量前6） -->
    <section class="recommend-section">
      <div class="recommend-wrapper">
        <h2 class="section-title">品质推荐</h2>
        <!-- 加载中提示 -->
        <div v-if="loading.recommend" class="loading-tip">加载中...</div>
        <!-- 空数据提示 -->
        <div v-else-if="recommendList.length === 0" class="empty-tip">暂无推荐商品</div>
        <div v-else class="recommend-grid">
          <div
            v-for="(goods, index) in recommendList"
            :key="goods.id"
            class="recommend-item"
          >
            <img :src="goods.image" :alt="goods.name" class="recommend-img">
            <div class="goods-info">
              <h3 class="goods-name">{{ goods.name }}</h3>
              <p class="goods-desc">{{ goods.desc }}</p>
               <div class="price-box">
                <span class="current-price">¥{{ goods.price }}</span>
              </div>
              <!-- 恢复绿色加入购物车按钮，仅加1功能 -->
              <div class="cart-btn-box">
                <button 
                  class="add-cart-btn" 
                  @click="addToCart(goods)"
                  :disabled="goods.soldOut"
                >
                  {{ goods.soldOut ? '已售罄' : '加入购物车' }}
                </button>
                <!-- 可选：显示已加入的数量 -->
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
import axios from 'axios'

// ---------------- 加载状态管理 ----------------
const loading = ref({
  category: false, // 品类加载中
  seckill: false,  // 秒杀加载中
  recommend: false // 推荐加载中
})

// ---------------- 登录状态管理 ----------------
const isLogin = ref(false)
const userName = ref('')

const login = (name) => {
  isLogin.value = true
  userName.value = name
  localStorage.setItem('isLogin', 'true')
  localStorage.setItem('userName', name)
}

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
axios.defaults.baseURL = 'http://localhost/cai/'

// ---------------- 导航相关数据和方法 ----------------
const navList = ref([
  { id: 1, name: '首页', path: '/', isActive: true, showDropdown: false, children: [] },
  { id: 2, name: '生鲜列表', path: '/fresh-user/list', isActive: false, showDropdown: false, children: [] },
  { id: 3, name: '购物车', path: '/cart', isActive: false, showDropdown: false, children: [] },
  { id: 4, name: '我的订单', path: '/order-list', isActive: false, showDropdown: false, children: [] },
  { id:5, name:'优惠券', path:'/coupon', isActive:false, showDropdown:false, children:[] }
])

const showDropdown = (id) => {
  const menuItem = navList.value.find(item => item.id === id)
  if (menuItem) menuItem.showDropdown = true
}

const hideDropdown = (id) => {
  const menuItem = navList.value.find(item => item.id === id)
  if (menuItem) menuItem.showDropdown = false
}

// ---------------- 轮播图相关数据和方法 ----------------
const carouselList = ref([
    { title: '轮播图1', imageUrl: import.meta.env.BASE_URL + 'b1.jpg' },
    { title: '轮播图2', imageUrl: import.meta.env.BASE_URL + 'b2.jpg' },
    { title: '轮播图3', imageUrl: import.meta.env.BASE_URL + 'b3.jpg' }
])
const currentIndex = ref(0)
let carouselTimer = null

const startCarousel = () => {
  carouselTimer = setInterval(() => {
    nextSlide()
  }, 3000)
}

const stopCarousel = () => {
  clearInterval(carouselTimer)
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

// ---------------- 品类入口（对接category表） ----------------
const categoryList = ref([])
// 点击分类跳转至对应商品列表
const goToCategoryList = (categoryId) => {
  // 实际项目中跳转至商品列表页并携带分类ID
  window.location.href = `/list?category_id=${categoryId}`
}
// 获取品类数据
const getCategoryList = async () => {
  try {
    loading.value.category = true
    const res = await axios.get('/api/category.php')
    // 修复：取res.data.data，拿到真正的数组
    categoryList.value = res.data.data.filter(item => item.category_id > 0)
  } catch (error) {
    console.error('获取品类数据失败：', error)
    categoryList.value = []
  } finally {
    loading.value.category = false
  }
}

// ---------------- 限时秒杀（对接营销活动表） ----------------
const seckillList = ref([])
const hour = ref('00')
const minute = ref('00')
const second = ref('00')
let countdownTimer = null

// 获取秒杀商品数据（从营销活动接口获取商品促销类型的有效活动）
const getSeckillList = async () => {
  try {
    loading.value.seckill = true
    // 调用营销活动接口，筛选商品促销类型且当前时间有效的活动
    const res = await axios.get('/api/admin_marketing.php')
    
    if (res.data.code === 200) {
      const now = new Date()
      // 筛选条件：1. 类型为商品促销(1) 2. 活动在有效期内 3. 关联商品ID有效
      const validMarketing = res.data.data.filter(item => {
        return item.type === 1 && 
               item.target_id > 0 &&
               new Date(item.start_time) <= now && 
               new Date(item.end_time) >= now
      })

      // 如果有有效促销活动，逐个获取商品详情
      if (validMarketing.length > 0) {
        const productList = []
        // 循环查询每个商品详情
        for (const marketing of validMarketing) {
          try {
            const productRes = await axios.get(`/api/goods_detail.php?id=${marketing.target_id}`)
            if (productRes.data.code === 200) {
              // 兼容接口返回单对象或数组的情况
              const product = Array.isArray(productRes.data.data) 
                ? productRes.data.data[0] 
                : productRes.data.data
              
              if (product) {
                productList.push({
                  ...product,
                  discount_value: marketing.discount_value, // 促销价格
                  start_time: marketing.start_time,
                  end_time: marketing.end_time
                })
              }
            }
          } catch (err) {
            console.error(`获取商品ID ${marketing.target_id} 失败：`, err)
          }
        }
        
        seckillList.value = productList
        
        // 设置倒计时（取第一个活动的结束时间）
        if (seckillList.value.length > 0) {
          setCountdown(seckillList.value[0].end_time)
        }
      } else {
        seckillList.value = []
      }
    }
  } catch (error) {
    console.error('获取秒杀商品失败：', error)
    seckillList.value = []
  } finally {
    loading.value.seckill = false
  }
}

// 设置秒杀倒计时（根据活动结束时间计算）
const setCountdown = (endTimeStr) => {
  // 清除原有倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  // 计算剩余时间
  const updateCountdown = () => {
    const now = new Date()
    const endTime = new Date(endTimeStr)
    const remaining = endTime - now
    
    if (remaining <= 0) {
      // 倒计时结束
      hour.value = '00'
      minute.value = '00'
      second.value = '00'
      clearInterval(countdownTimer)
      // 重新加载秒杀商品
      getSeckillList()
      return
    }
    
    // 计算小时、分钟、秒
    const h = Math.floor(remaining / (1000 * 60 * 60))
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((remaining % (1000 * 60)) / 1000)
    
    // 补零
    hour.value = h.toString().padStart(2, '0')
    minute.value = m.toString().padStart(2, '0')
    second.value = s.toString().padStart(2, '0')
  }
  
  // 立即更新一次
  updateCountdown()
  // 每秒更新
  countdownTimer = setInterval(updateCountdown, 1000)
}

// ---------------- 品质推荐（按订单销量前6） ----------------
const recommendList = ref([])

// 购物车核心功能（仅加1，无减1）
// 从本地购物车同步数据
const syncFromLocalCart = () => {
  const cartStr = localStorage.getItem('cartList')
  if (!cartStr) return
  
  try {
    const cartList = JSON.parse(cartStr)
    // 同步推荐商品购物车数量
    recommendList.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) {
        goods.count = cartItem.count
      }
    })
    // 同步秒杀商品购物车数量
    seckillList.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) {
        goods.count = cartItem.count
      }
    })
  } catch (e) {
    console.error('解析购物车数据失败：', e)
  }
}

// 同步到本地购物车
const syncToLocalCart = () => {
  // 合并所有购物车数据（推荐商品 + 秒杀商品）
  let cartList = []
  const existingCartStr = localStorage.getItem('cartList')
  if (existingCartStr) {
    try {
      cartList = JSON.parse(existingCartStr)
    } catch (e) {
      cartList = []
    }
  }
  
  // 更新推荐商品的购物车数量
  recommendList.value.forEach(goods => {
    if (goods.count > 0) {
      const existingIndex = cartList.findIndex(item => item.id === goods.id)
      if (existingIndex > -1) {
        cartList[existingIndex].count = goods.count
      } else {
        cartList.push({
          id: goods.id,
          name: goods.name,
          price: goods.price,
          img: goods.image || goods.img,
          count: goods.count,
          checked: true
        })
      }
    }
  })
  
  // 更新秒杀商品的购物车数量
  seckillList.value.forEach(goods => {
    if (goods.count > 0) {
      const existingIndex = cartList.findIndex(item => item.id === goods.id)
      if (existingIndex > -1) {
        cartList[existingIndex].count = goods.count
      } else {
        cartList.push({
          id: goods.id,
          name: goods.name,
          price: goods.discount_value || goods.price, // 秒杀商品用促销价
          img: goods.image || goods.img,
          count: goods.count,
          checked: true
        })
      }
    }
  })
  
  localStorage.setItem('cartList', JSON.stringify(cartList))
}

// 加入购物车（仅加1）
const addToCart = (goods) => {
  // 检查是否售罄
  if (goods.stock === 0) {
    alert('该商品已售罄，无法加入购物车！')
    return
  }
  
  // 数量+1
  goods.count = (goods.count || 0) + 1
  
  // 同步到本地存储
  syncToLocalCart()
  
  // 友好提示
  alert(`成功将【${goods.name}】加入购物车！当前数量：${goods.count}`)
}

// 获取销量前6商品
const getRecommendList = async () => {
  try {
    loading.value.recommend = true
    const res = await axios.get('/api/recommend.php')
    const rawList = res.data.data
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6)
    
    // 初始化count和soldOut字段
    recommendList.value = rawList.map(item => ({
      ...item,
      count: 0, // 初始数量0
      soldOut: item.stock === 0 // 库存为0则售罄
    }))
    
    // 同步本地购物车数据
    syncFromLocalCart()
  } catch (error) {
    console.error('获取推荐商品失败：', error)
    recommendList.value = []
  } finally {
    loading.value.recommend = false
  }
}

// ---------------- 生命周期钩子 ----------------
onMounted(() => {
  initLoginState()
  startCarousel()
  getCategoryList()
  getSeckillList() // 加载秒杀商品
  getRecommendList()
})

onUnmounted(() => {
  clearInterval(carouselTimer)
  clearInterval(countdownTimer) // 清除秒杀倒计时
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

/* 绿色加入购物车按钮样式（恢复原有样式） */
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

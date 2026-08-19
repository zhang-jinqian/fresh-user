<template>
  <nav class="fresh-nav">
    <div class="nav-wrapper">
      <!-- Logo 区域 -->
      <div class="nav-logo">
        <img
          src="../assets/logo.png"
          alt="生鲜购"
          class="logo-img"
        />
        <span class="logo-text">生鲜购</span>
      </div>

      <!-- 导航菜单 -->
      <ul class="nav-menu">
        <!-- 静态导航项 -->
        <li
          v-for="item in navList"
          :key="item.id"
          class="menu-item"
          @mouseenter="showDropdown(item.id)"
          @mouseleave="hideDropdown(item.id)"
          @click="handleNavClick(item)"
        >
          <a
            :href="item.path"
            :class="{ active: item.isActive }"
            class="menu-link"
            @click.prevent
          >
            {{ item.name }}
            <!-- 购物车专属：数量角标 -->
            <span v-if="item.id === 3" class="cart-badge" v-show="cartCount > 0">
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
            <i v-if="item.children.length" class="arrow-icon">▼</i>
          </a>

          <!-- 下拉菜单 -->
          <div
            v-if="item.children.length && item.showDropdown"
            class="dropdown-menu"
          >
            <ul>
              <li
                v-for="child in item.children"
                :key="child.id"
                class="dropdown-item"
              >
                <a :href="child.path" class="dropdown-link">{{ child.name }}</a>
              </li>
            </ul>
          </div>
        </li>

        <!-- 登录/用户中心（动态显示） -->
        <li class="menu-item user-item" v-if="isLogin">
          <a class="menu-link" @click.prevent>
            <span class="user-name">{{ userName }}</span>
            <i class="arrow-icon">▼</i>
          </a>
          <!-- 用户下拉菜单 -->
          <div class="dropdown-menu user-dropdown">
            <ul>
              <li class="dropdown-item">
                <a class="dropdown-link" @click.prevent="goToOrderList">我的订单</a>
              </li>
              <li class="dropdown-item">
                <a class="dropdown-link" @click.prevent="logout">退出登录</a>
              </li>
            </ul>
          </div>
        </li>

        <!-- 未登录状态 -->
        <li class="menu-item" v-else>
          <a class="menu-link" @click.prevent="goToLogin">
            登录
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 导航列表（新增我的订单项）
const navList = ref([
  {
    id: 1,
    name: '首页',
    path: '/',
    isActive: false,
    showDropdown: false,
    children: []
  },
  {
    id: 2,
    name: '生鲜列表',
    path: '/fresh-user/list11111',
    isActive: false,
    showDropdown: false,
    children: []
  },
  {
    id: 3,
    name: '购物车',
    path: '/cart',
    isActive: false,
    showDropdown: false,
    children: []
  },
  {
    id: 4,
    name: '我的订单',
    path: '/order-list',
    isActive: false,
    showDropdown: false,
    children: []
  },
  {
    id:5,
    name:'优惠券',
    path:'/coupon',
    isActive:false,
    showDropdown:false,
    children:[]
  }
])

// 登录状态相关
const isLogin = ref(false)
const userName = ref('')

// 购物车数量计算
const cartCount = computed(() => {
  try {
    const cartStr = localStorage.getItem('cartList')
    if (!cartStr) return 0
    const cartList = JSON.parse(cartStr)
    return cartList.reduce((sum, item) => sum + item.count, 0)
  } catch (e) {
    console.error('解析购物车数据失败：', e)
    return 0
  }
})

// 检查登录状态
const checkLoginStatus = () => {
  const loginFlag = localStorage.getItem('isLogin') === 'true'
  const userInfoStr = localStorage.getItem('userInfo')
  
  isLogin.value = loginFlag
  if (loginFlag && userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      userName.value = userInfo.name || userInfo.phone || '用户'
    } catch (e) {
      console.error('解析用户信息失败：', e)
      isLogin.value = false
    }
  }
}

// 下拉菜单显示/隐藏
const showDropdown = (id) => {
  const item = navList.value.find(item => item.id === id)
  if (item) item.showDropdown = true
}

const hideDropdown = (id) => {
  const item = navList.value.find(item => item.id === id)
  if (item) item.showDropdown = false
}

// 导航点击处理
const handleNavClick = (item) => {
  // 如果是需要登录的页面，先检查登录态
  const needLoginPaths = ['/order-list', '/checkout']
  if (needLoginPaths.includes(item.path) && !isLogin.value) {
    goToLogin()
    return
  }
  
  if (item.children.length > 0) return
  router.push(item.path)
  navList.value.forEach(nav => {
    nav.isActive = nav.id === item.id
  })
}

// 跳转到登录页
const goToLogin = () => {
  // 记录当前页面，登录后返回
  localStorage.setItem('redirectPath', route.path)
  router.push('/login')
}

// 跳转到订单列表
const goToOrderList = () => {
  if (isLogin.value) {
    router.push('/order-list')
    // 更新导航激活状态
    navList.value.forEach(nav => {
      nav.isActive = nav.path === '/order-list'
    })
  } else {
    goToLogin()
  }
}

// 退出登录
const logout = () => {
  if (confirm('确定退出登录吗？')) {
    // 清空登录态
    localStorage.removeItem('isLogin')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('token')
    
    isLogin.value = false
    userName.value = ''
    
    // 刷新导航激活状态
    updateActiveNav()
    // 跳转到首页
    router.push('/')
  }
}

// 更新激活的导航项
const updateActiveNav = () => {
  const currentPath = route.path
  navList.value.forEach(nav => {
    nav.isActive = nav.path === currentPath
    if (nav.id === 2 && currentPath.startsWith('/fresh')) {
      nav.isActive = true
    }
  })
}

// 监听localStorage变化（购物车/登录态）
const watchLocalStorage = () => {
  window.addEventListener('storage', () => {
    // 强制更新购物车数量
    cartCount.value
    // 重新检查登录状态
    checkLoginStatus()
  })
}

// 监听路由变化
watch(() => route.path, () => {
  updateActiveNav()
  // 路由变化时重新检查登录状态
  checkLoginStatus()
})

// 监听购物车变化（本地修改）
const watchCartChange = () => {
  setInterval(() => {
    cartCount.value
  }, 1000)
}

onMounted(() => {
  // 初始化
  checkLoginStatus()
  updateActiveNav()
  watchLocalStorage()
  watchCartChange()
})
</script>

<style scoped>
.fresh-nav {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1000;
}

.nav-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
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
  height: 70px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.menu-link {
  color: #333333;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.menu-link.active,
.menu-link:hover {
  color: #00b42a;
}

/* 购物车角标样式保留 */
.cart-badge {
  position: absolute;
  top: -8px;
  right: -12px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background-color: #ff4d4f;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s;
  color: #666;
}

.menu-item:hover .arrow-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 12px 0;
  min-width: 160px;
  margin-top: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1001;
}

/* 用户下拉菜单特殊定位 */
.user-dropdown {
  left: auto;
  right: 0;
  transform: translateX(0);
  min-width: 120px;
}

.dropdown-menu ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
}

.dropdown-item {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dropdown-link {
  display: block;
  padding: 8px 20px;
  color: #333333;
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s, color 0.2s;
  white-space: nowrap;
}

.dropdown-link:hover {
  background-color: #f5f5f5;
  color: #00b42a;
}

/* 用户名样式 */
.user-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

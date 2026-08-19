// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../Login.vue'    // 根据实际路径调整
import Register from '../Register.vue'
import Home from '../Home.vue'
import List from '../List.vue'
import GoodsDetail from '../GoodsDetail.vue'
import Cart from '../Cart.vue'
import Checkout from '../Checkout.vue'
import OrderList from '../Order-list.vue'
import OrderDetail from '../Order-detail.vue'
import Coupon from '../Coupon.vue'
import Pay from'../PayPage.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home },   // 确保 Home 组件已导入
  { path: '/', redirect: '/home' },
  { path: '/list', component: List },
  { path: '/goods/detail', component: GoodsDetail },
  { path: '/cart', component: Cart },
   { path: '/checkout', component: Checkout },
  { path: '/order-list', component: OrderList },
  { path: '/order-detail/:id', component: OrderDetail },
  { path: '/coupon', component: Coupon },
  {
  path: '/pay/:id',
  component: Pay
}

]

const router = createRouter({
  history: createWebHashHistory('/fresh-user/'), // 使用 history 模式，需要服务器支持
  routes
})
router.beforeEach((to, from, next) => {
  const isLogin = !!localStorage.getItem('userInfo')
  // 需要登录的页面
  const needLogin = ['/checkout', '/order-list', '/order-detail']
  if (needLogin.includes(to.path) && !isLogin) {
    next('/login')
  } else {
    next()
  }
})

export default router

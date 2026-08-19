<template>
  <FreshNav />
  <div class="dd-buy-pc-page">
    <!-- 顶部搜索栏 -->
    <div class="top-header">
      <div class="header-wrapper">
        <!-- 搜索框 -->
        <div class="search-box">
          <input
            type="text"
            placeholder="搜索商品，比如：青菜、鸡蛋、草莓"
            v-model="keyword"
            class="search-input"
            @keyup.enter="searchGoods"
          />
          <button class="search-btn" @click="searchGoods">搜索</button>
        </div>
        <!-- 购物车入口 -->
        
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 左侧分类栏（自动添加全部商品） -->
        <div class="category-sidebar">
          <div class="sidebar-title">商品分类</div>
          <!-- 手动添加全部商品（id=0） -->
          <div
            class="category-item"
            :class="{ active: activeCategory === 0 }"
            @click="changeCategory(0)"
          >
            全部商品
          </div>
          <!-- 数据库加载的分类 -->
          <div
            class="category-item"
            :class="{ active: activeCategory === item.id }"
            v-for="item in categories"
            :key="item.id"
            @click="changeCategory(item.id)"
          >
            {{ item.name }}
          </div>
        </div>

        <!-- 右侧商品区域 -->
        <div class="goods-section">
          <!-- 分类标题 -->
          <div class="goods-header">
            <h2 class="category-name">{{ getCategoryName(activeCategory) }}</h2>
            <span class="goods-count">{{ showGoodsList.length }}件商品</span>
          </div>

          <!-- 商品网格列表 -->
          <div class="goods-grid">
            <!-- 空数据提示 -->
            <div class="empty-tip" v-if="showGoodsList.length === 0">
              暂无相关商品
            </div>

            <!-- 商品卡片 -->
            <div 
              class="goods-card" 
              v-for="goods in showGoodsList" 
              :key="goods.id"
              @click="goToDetail(goods)"
              style="cursor: pointer;"
            >
              <div class="goods-img-box">
                <img :src="goods.img" :alt="goods.name" class="goods-img" />
                <span class="tag hot" v-if="goods.hot === 1">热销</span>
                <span class="tag sold-out" v-if="goods.soldOut">售罄</span>
              </div>
              <div class="goods-info">
                <div class="goods-name">{{ goods.name }}</div>
                <div class="goods-spec">{{ goods.spec }}</div>
                <div class="price-area">
                  <span class="current-price">¥{{ goods.price }}</span>
                  <span class="origin-price" v-if="goods.originPrice">¥{{ goods.originPrice }}</span>
                </div>
              </div>
              <div class="cart-ctrl-area">
                <div class="cart-ctrl" v-if="!goods.soldOut">
                  <span class="minus-btn" @click.stop="minusCount(goods)" v-if="goods.count > 0">-</span>
                  <span class="count-num" v-if="goods.count > 0">{{ goods.count }}</span>
                  <span class="plus-btn" @click.stop="plusCount(goods)">+</span>
                </div>
                <div class="sold-out-btn" v-else>已售罄</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'
import { useRouter, useRoute } from 'vue-router'

// 初始化路由
const router = useRouter()
const route = useRoute()

// 配置 axios 基础路径
axios.defaults.baseURL = 'http://localhost/cai/api'

// 搜索关键词
const keyword = ref('')

// 分类数据（从数据库加载）
const categories = ref([])

// 当前选中分类（0=全部商品）
const activeCategory = ref(0)

// 商品原始数据
const goodsData = ref([])

// 加载分类数据
const loadCategoryData = async () => {
  try {
    const res = await axios.get('/category_list.php')
    if (res.data.code === 200) {
      categories.value = res.data.data
    } else {
      alert('加载分类失败：' + res.data.msg)
    }
  } catch (error) {
    console.error('加载分类错误：', error)
    alert('加载分类失败，请检查接口')
  }
}

// 加载商品数据（同步更新地址栏参数）
const loadGoodsData = async (updateUrl = true) => {
  try {
    // 1. 更新地址栏参数（保留关键词）
    if (updateUrl) {
      router.push({
        path: '/list',
        query: {
          category_id: activeCategory.value,
          keyword: keyword.value.trim() || undefined // 无关键词则不显示
        }
      }, undefined, { replace: true }) // 替换历史记录，不新增
    }

    // 2. 请求商品数据
    const res = await axios.get('/goods.php', {
      params: {
        categoryId: activeCategory.value, // 传给后端的参数名
        keyword: keyword.value.trim()
      }
    })
    if (res.data.code === 200) {
      // 初始化购物车数量为0
      goodsData.value = res.data.data.map(item => ({
        ...item,
        count: 0
      }))
      // 同步本地购物车数据
      syncFromLocalCart()
    } else {
      alert('加载商品失败：' + (res.data.msg || '后端返回异常'))
    }
  } catch (error) {
    console.error('加载商品错误详情:', error)
    let errMsg = '网络异常'
    if (error.response) {
      errMsg = `请求失败[${error.response.status}]: ${error.response.data?.msg || '未知错误'}`
    } else if (error.request) {
      errMsg = '未收到后端响应，请检查接口地址或服务器'
    } else {
      errMsg = error.message
    }
    alert('加载商品失败：' + errMsg)
  }
}

// 从本地购物车同步数量
const syncFromLocalCart = () => {
  const cartStr = localStorage.getItem('cartList')
  if (!cartStr) return
  
  try {
    const cartList = JSON.parse(cartStr)
    goodsData.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) {
        goods.count = cartItem.count
      }
    })
  } catch (e) {
    console.error('解析购物车数据失败：', e)
  }
}

// 筛选后的商品列表
const showGoodsList = computed(() => {
  return goodsData.value
})

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (categoryId === 0) return '全部商品'
  const category = categories.value.find(item => item.id === categoryId)
  return category ? category.name : '全部商品'
}

// 切换分类（更新地址栏+加载数据）
const changeCategory = (id) => {
  activeCategory.value = id
  loadGoodsData(true) // 同步更新地址栏
}

// 搜索商品（更新地址栏+加载数据）
const searchGoods = () => {
  loadGoodsData(true)
}

// 购物车操作
const plusCount = (goods) => {
  goods.count++
  syncToLocalCart()
}

const minusCount = (goods) => {
  if (goods.count > 0) {
    goods.count--
    syncToLocalCart()
  }
}

// 同步到本地购物车
const syncToLocalCart = () => {
  const cartGoods = goodsData.value.filter(item => item.count > 0)
  const cartList = cartGoods.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    img: item.img,
    count: item.count,
    checked: true
  }))
  localStorage.setItem('cartList', JSON.stringify(cartList))
}

// 显示购物车
const showCart = () => {
  alert(`购物车共有 ${totalCount.value} 件商品，可前往结算`)
}

// 跳转到商品详情页
const goToDetail = (goods) => {
  router.push({
    path: '/goods/detail',
    query: { id: goods.id }
  })
}

// 监听地址栏参数变化（刷新/手动修改地址栏时自动识别）
watch([() => route.query.category_id, () => route.query.keyword], ([newCatId, newKeyword]) => {
  // 更新分类
  if (newCatId !== undefined) {
    activeCategory.value = Number(newCatId) || 0
  }
  // 更新关键词
  if (newKeyword !== undefined) {
    keyword.value = newKeyword
  }
  // 重新加载数据（不重复更新地址栏）
  loadGoodsData(false)
}, { immediate: true })

// 页面加载时初始化
onMounted(() => {
  loadCategoryData()
})

// 购物车总数
const totalCount = computed(() => {
  return goodsData.value.reduce((sum, goods) => sum + goods.count, 0)
})
</script>

<style scoped>
/* 样式部分保持不变，无需修改 */
.dd-buy-pc-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: "Microsoft Yahei", sans-serif;
}

.top-header {
  height: 80px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
.header-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  position: relative;
}

.cart-entry {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.search-box {
  display: flex;
  width: 500px;
  height: 40px;
}
.search-input {
  flex: 1;
  height: 100%;
  padding: 0 15px;
  border: 1px solid #eee;
  border-radius: 4px 0 0 4px;
  outline: none;
  font-size: 14px;
}
.search-input:focus {
  border-color: #ff4d4f;
}
.search-btn {
  width: 80px;
  height: 100%;
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 14px;
}
.search-btn:hover {
  background-color: #e84240;
}

.cart-icon {
  font-size: 24px;
}
.cart-text {
  font-size: 14px;
  color: #333;
}
.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.main-content {
  padding: 20px 0;
}
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 0 20px;
}

.category-sidebar {
  width: 200px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  height: fit-content;
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}
.category-item {
  height: 45px;
  line-height: 45px;
  padding-left: 15px;
  font-size: 14px;
  color: #666;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.2s;
}
.category-item:hover {
  background-color: #f5f5f5;
  color: #ff4d4f;
}
.category-item.active {
  background-color: #fff0f0;
  color: #ff4d4f;
  font-weight: 500;
  border-left: 3px solid #ff4d4f;
}

.goods-section {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}

.goods-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.category-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}
.goods-count {
  font-size: 14px;
  color: #999;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 0;
  font-size: 16px;
  color: #999;
}

.goods-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}
.goods-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.goods-img-box {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
}
.goods-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.goods-card:hover .goods-img {
  transform: scale(1.05);
}

.tag {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  color: #fff;
}
.tag.hot {
  background-color: #ff4d4f;
}
.tag.sold-out {
  background-color: #999;
}

.goods-info {
  padding: 15px;
  flex: 1;
}
.goods-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-spec {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
  line-height: 1.4;
  height: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.price-area {
  display: flex;
  align-items: baseline;
}
.current-price {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: 700;
}
.origin-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.cart-ctrl-area {
  padding: 0 15px 15px;
  display: flex;
  justify-content: flex-end;
}
.cart-ctrl {
  display: flex;
  align-items: center;
}
.minus-btn, .plus-btn, .count-num {
  width: 28px;
  height: 28px;
  line-height: 26px;
  text-align: center;
  border-radius: 4px;
  font-size: 14px;
}
.plus-btn {
  background-color: #ff4d4f;
  color: #fff;
  border: 1px solid #ff4d4f;
  cursor: pointer;
}
.minus-btn {
  background-color: #fff;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  margin-right: 8px;
  cursor: pointer;
}
.count-num {
  margin: 0 8px;
  color: #333;
}
.sold-out-btn {
  padding: 5px 15px;
  font-size: 14px;
  color: #999;
  border: 1px solid #eee;
  border-radius: 4px;
}

@media (max-width: 1024px) {
  .goods-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .goods-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .search-box {
    width: 300px;
  }
}
</style>
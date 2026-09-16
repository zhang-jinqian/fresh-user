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
                  <span class="origin-price" v-if="goods.originPrice> goods.price">¥{{ goods.originPrice }}</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import FreshNav from './components/HeaderNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 搜索关键词
const keyword = ref('')

// 当前选中分类（0=全部商品）
const activeCategory = ref(0)

// ---------------- 分类静态数据（数据库 category 表） ----------------
const categories = ref([
  { id: 1, name: '新鲜蔬菜' },
  { id: 2, name: '时令水果' },
  { id: 3, name: '肉禽蛋品' },
  { id: 4, name: '海鲜水产' },
  { id: 5, name: '乳品烘焙' },
  { id: 6, name: '速食冻品' }
])

// ---------------- 商品静态数据（数据库 products 表） ----------------
// 图片文件名：good1.jpg ~ good18.jpg，放在 public 根目录
const rawGoodsList = [
  // 新鲜蔬菜
  { id: 3,  categoryId: 1, name: '西红柿',           spec: '沙瓤多汁，酸甜浓郁，可生食或做番茄炒蛋。',   price: 6.00,    img: import.meta.env.BASE_URL + 'good3.jpg',  stock: 46, hot: 1, count: 0, soldOut: false },
  { id: 4,  categoryId: 1, name: '西兰花',           spec: '花球紧实翠绿，营养丰富，适合清炒、蒜蓉或水煮。', price: 8.00,  img: import.meta.env.BASE_URL + 'good2.png',  stock: 26, hot: 1, count: 0, soldOut: false },
  { id: 6,  categoryId: 1, name: '上海青',           spec: '叶片肥厚脆嫩，清炒或煮汤口感清甜，富含维生素。', price: 5.00,   img: import.meta.env.BASE_URL + 'good1.jpg',  stock: 30, hot: 0, count: 0, soldOut: false },

  // 时令水果
  { id: 7,  categoryId: 2, name: '烟台红富士苹果',   spec: '果面红润带条纹，脆甜多汁，带冰糖心，果香浓郁。', price: 8.50,   img: import.meta.env.BASE_URL + 'good4.jpeg',  stock: 30, hot: 1, count: 0, soldOut: false },
  { id: 8,  categoryId: 2, name: '赣南脐橙',         spec: '果皮橙黄光滑，果肉饱满，汁水充沛，维 C 含量高。', price: 5.50,    img: import.meta.env.BASE_URL + 'good6.jpeg',  stock: 37, hot: 0, count: 0, soldOut: false },
  { id: 9,  categoryId: 2, name: '红颜草莓',         spec: '果实饱满鲜红，香气浓郁，果肉细腻，酸甜适口。',   price: 15.00,  img: import.meta.env.BASE_URL + 'good5.jpg',  stock: 34, hot: 0, count: 0, soldOut: false },

  // 肉禽蛋品
  { id: 10, categoryId: 3, name: '带皮五花肉',       spec: '肥瘦相间，层次分明，适合红烧、炖煮或做卤肉饭。', price: 14.00, img: import.meta.env.BASE_URL + 'good7.jpg',  stock: 40, hot: 1, count: 0, soldOut: false },
  { id: 11, categoryId: 3, name: '鸡胸肉（去皮）',   spec: '肉质紧实低脂，高蛋白，适合健身人群，可煎可煮。', price: 9.00,   img: import.meta.env.BASE_URL + 'good8.jpg',  stock: 30, hot: 0, count: 0, soldOut: false },
  { id: 12, categoryId: 3, name: '鲜鸡蛋（土鸡蛋）', spec: '蛋壳浅褐，蛋黄饱满，口感香浓，营养更天然。',     price: 6.00,   img: import.meta.env.BASE_URL + 'good9.jpg',  stock: 46, hot: 0, count: 0, soldOut: false },

  // 海鲜水产
  { id: 13, categoryId: 4, name: '鲜活基围虾',       spec: '壳薄肉嫩，鲜甜弹牙，适合白灼、油焖或做虾滑。',   price: 35.00,  img: import.meta.env.BASE_URL + 'good11.jpg', stock: 34, hot: 1, count: 0, soldOut: false },
  { id: 14, categoryId: 4, name: '鲜活鲫鱼',         spec: '肉质细嫩，刺少味鲜，适合煲汤或红烧，营养滋补。',   price: 13.00, img: import.meta.env.BASE_URL + 'good10.jpg', stock: 29, hot: 1, count: 0, soldOut: false },
  { id: 15, categoryId: 4, name: '花蛤',             spec: '肉质肥美，汤汁鲜甜，适合辣炒或做花甲粉。',         price: 8.00, img: import.meta.env.BASE_URL + 'good12.jpeg', stock: 20, hot: 0, count: 0, soldOut: false },

  // 乳品烘焙
  { id: 16, categoryId: 5, name: '原味吐司面包',     spec: '组织松软细腻，麦香浓郁，可做三明治或直接食用。',   price: 13.00,  img: import.meta.env.BASE_URL + 'good13.jpg', stock: 6,  hot: 1, count: 0, soldOut: false },
  { id: 17, categoryId: 5, name: '纯牛奶（全脂）',   spec: '奶香醇厚，口感顺滑，富含蛋白质和钙，适合日常饮用。', price: 5.00,   img:import.meta.env.BASE_URL + 'good15.jpg', stock: 37, hot: 1, count: 0, soldOut: false },
  { id: 18, categoryId: 5, name: '原味酸奶',         spec: '质地浓稠，酸甜适中，含益生菌，有助肠道健康。',     price: 7.00,   img: import.meta.env.BASE_URL + 'good16.jpg', stock: 12, hot: 1, count: 0, soldOut: false },

  // 速食冻品
  { id: 19, categoryId: 6, name: '速冻猪肉白菜水饺', spec: '皮薄馅足，汤汁浓郁，煮制方便，是快捷早餐或晚餐。', price: 20.00, img: import.meta.env.BASE_URL + 'good17.jpg', stock: 48, hot: 0, count: 0, soldOut: false },
  { id: 20, categoryId: 6, name: '深海鳕鱼排',       spec: '外酥里嫩，无刺少骨，适合儿童，空气炸锅即可制作。',   price: 15.00,  img: import.meta.env.BASE_URL + 'good18.png', stock: 30, hot: 1, count: 0, soldOut: false },
  { id: 21, categoryId: 6, name: '灌汤小笼包',       spec: '皮薄透光，汤汁鲜美，肉馅饱满，蒸制即食。',         price: 19.00, img: import.meta.env.BASE_URL + 'good19.jpg', stock: 30, hot: 1, count: 0, soldOut: false }
]
const goodsData = ref(rawGoodsList.map(item => ({
  ...item,
  // hot=1：原价 = 现价 × 1.2（保留两位小数）；hot=0：原价 = 现价
  originPrice: item.hot === 1
    ? Number((item.price * 1.2).toFixed(2))
    : item.price,
  count: 0,
  soldOut: item.stock === 0
})))
// ---------------- 商品筛选（分类 + 关键词） ----------------
const showGoodsList = computed(() => {
  return goodsData.value.filter(item => {
    const matchCategory = activeCategory.value === 0 || item.categoryId === activeCategory.value
    const kw = keyword.value.trim()
    const matchKeyword = !kw || item.name.includes(kw) || (item.spec && item.spec.includes(kw))
    return matchCategory && matchKeyword
  })
})

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (categoryId === 0) return '全部商品'
  const category = categories.value.find(item => item.id === categoryId)
  return category ? category.name : '全部商品'
}

// ---------------- 购物车同步 ----------------
const syncFromLocalCart = () => {
  const cartStr = localStorage.getItem('cartList')
  if (!cartStr) return

  try {
    const cartList = JSON.parse(cartStr)
    goodsData.value.forEach(goods => {
      const cartItem = cartList.find(item => item.id === goods.id)
      if (cartItem) goods.count = cartItem.count
    })
  } catch (e) {
    console.error('解析购物车数据失败：', e)
  }
}

const syncToLocalCart = () => {
  // 只保存当前列表页出现过的商品，避免覆盖首页推荐数据
  let cartList = []
  const existingCartStr = localStorage.getItem('cartList')
  if (existingCartStr) {
    try { cartList = JSON.parse(existingCartStr) } catch (e) { cartList = [] }
  }

  goodsData.value.forEach(item => {
    const idx = cartList.findIndex(c => c.id === item.id)
    if (item.count > 0) {
      const entry = {
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        count: item.count,
        checked: true
      }
      if (idx > -1) cartList[idx] = { ...cartList[idx], ...entry }
      else cartList.push(entry)
    } else if (idx > -1) {
      // 数量归零则移除
      cartList.splice(idx, 1)
    }
  })

  localStorage.setItem('cartList', JSON.stringify(cartList))
}

// ---------------- 购物车操作 ----------------
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

// 购物车总数（保留原功能，虽然模板里已隐藏购物车入口）
const totalCount = computed(() => {
  return goodsData.value.reduce((sum, goods) => sum + goods.count, 0)
})

const showCart = () => {
  alert(`购物车共有 ${totalCount.value} 件商品，可前往结算`)
}

// ---------------- 分类切换 & 搜索（仅改状态 + 更新地址栏） ----------------
const changeCategory = (id) => {
  activeCategory.value = id
  router.push({
    path: '/list',
    query: {
      category_id: id,
      keyword: keyword.value.trim() || undefined
    }
  }, undefined, { replace: true })
}

const searchGoods = () => {
  router.push({
    path: '/list',
    query: {
      category_id: activeCategory.value,
      keyword: keyword.value.trim() || undefined
    }
  }, undefined, { replace: true })
}

// 跳转商品详情
const goToDetail = (goods) => {
  router.push({
    path: '/goods/detail',
    query: { id: goods.id }
  })
}

// ---------------- 监听地址栏参数 ----------------
watch(
  [() => route.query.category_id, () => route.query.keyword],
  ([newCatId, newKeyword]) => {
    activeCategory.value = Number(newCatId) || 0
    keyword.value = newKeyword || ''
  },
  { immediate: true }
)

// ---------------- 生命周期 ----------------
onMounted(() => {
  syncFromLocalCart()
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

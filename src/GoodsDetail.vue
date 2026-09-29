<template>
  <FreshNav />
  <div class="goods-detail-page">
    <div class="loading" v-if="loading">加载中...</div>
    <div class="empty" v-if="!loading && !goodsDetail.id">暂无商品详情</div>

    <div class="detail-content" v-if="!loading && goodsDetail.id">
      <div class="detail-left">
        <img :src="goodsDetail.img" alt="商品图片" class="goods-big-img" />
      </div>
      <div class="detail-right">
        <h1 class="goods-title">{{ goodsDetail.name }}</h1>
        <div class="goods-price">
          <span class="current-price">¥{{ goodsDetail.price }}</span>
          <span class="origin-price" v-if="goodsDetail.originPrice">¥{{ goodsDetail.originPrice }}</span>
        </div>

        <div class="goods-category">
          <span class="label">商品分类：</span>
          <span>{{ goodsDetail.categoryName }}</span>
        </div>

        <div class="goods-spec">
          <span class="label">商品库存：</span>
          <span>{{ goodsDetail.stock || '无' }}</span>
        </div>

        <div class="goods-status">
          <span class="label">商品状态：</span>
          <span :class="goodsDetail.soldOut ? 'sold-out' : 'on-sale'">
            {{ goodsDetail.soldOut ? '已售罄' : '热销中' }}
          </span>
        </div>

        <div class="goods-desc">
          <span class="label">商品描述：</span>
          <p>{{ goodsDetail.description || '无' }}</p>
        </div>

        <div class="operate-btn">
          <button class="add-cart-btn" @click="addToCart" :disabled="goodsDetail.soldOut">
            {{ goodsDetail.soldOut ? '已售罄' : '加入购物车' }}
          </button>
          <button class="back-btn" @click="goBack">返回列表</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import FreshNav from './components/HeaderNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const BASE = import.meta.env.BASE_URL

const loading = ref(true)
const goodsDetail = ref({})

// ---------------- 商品数据库（与 GoodsList 保持一致） ----------------
const rawGoodsList = [
  // 新鲜蔬菜
  { id: 3,  categoryId: 1, name: '西红柿',           spec: '沙瓤多汁，酸甜浓郁，可生食或做番茄炒蛋。',     price: 6.00,  img: BASE + 'good1.jpg',  stock: 46, hot: 1 },
  { id: 4,  categoryId: 1, name: '西兰花',           spec: '花球紧实翠绿，营养丰富，适合清炒、蒜蓉或水煮。', price: 8.00,  img: BASE + 'good2.jpg',  stock: 26, hot: 1 },
  { id: 6,  categoryId: 1, name: '上海青',           spec: '叶片肥厚脆嫩，清炒或煮汤口感清甜，富含维生素。', price: 5.00,  img: BASE + 'good3.jpg',  stock: 30, hot: 0 },

  // 时令水果
  { id: 7,  categoryId: 2, name: '烟台红富士苹果',   spec: '果面红润带条纹，脆甜多汁，带冰糖心，果香浓郁。', price: 8.50,  img: BASE + 'good4.jpg',  stock: 30, hot: 1 },
  { id: 8,  categoryId: 2, name: '赣南脐橙',         spec: '果皮橙黄光滑，果肉饱满，汁水充沛，维 C 含量高。', price: 5.50,  img: BASE + 'good5.jpg',  stock: 37, hot: 0 },
  { id: 9,  categoryId: 2, name: '红颜草莓',         spec: '果实饱满鲜红，香气浓郁，果肉细腻，酸甜适口。',   price: 15.00, img: BASE + 'good6.jpg',  stock: 34, hot: 0 },

  // 肉禽蛋品
  { id: 10, categoryId: 3, name: '带皮五花肉',       spec: '肥瘦相间，层次分明，适合红烧、炖煮或做卤肉饭。', price: 14.00, img: BASE + 'good7.jpg',  stock: 40, hot: 1 },
  { id: 11, categoryId: 3, name: '鸡胸肉（去皮）',   spec: '肉质紧实低脂，高蛋白，适合健身人群，可煎可煮。', price: 9.00,  img: BASE + 'good8.jpg',  stock: 30, hot: 0 },
  { id: 12, categoryId: 3, name: '鲜鸡蛋（土鸡蛋）', spec: '蛋壳浅褐，蛋黄饱满，口感香浓，营养更天然。',     price: 6.00,  img: BASE + 'good9.jpg',  stock: 46, hot: 0 },

  // 海鲜水产
  { id: 13, categoryId: 4, name: '鲜活基围虾',       spec: '壳薄肉嫩，鲜甜弹牙，适合白灼、油焖或做虾滑。',   price: 35.00, img: BASE + 'good10.jpg', stock: 34, hot: 1 },
  { id: 14, categoryId: 4, name: '鲜活鲫鱼',         spec: '肉质细嫩，刺少味鲜，适合煲汤或红烧，营养滋补。',   price: 13.00, img: BASE + 'good11.jpg', stock: 29, hot: 1 },
  { id: 15, categoryId: 4, name: '花蛤',             spec: '肉质肥美，汤汁鲜甜，适合辣炒或做花甲粉。',         price: 8.00,  img: BASE + 'good12.jpg', stock: 20, hot: 0 },

  // 乳品烘焙
  { id: 16, categoryId: 5, name: '原味吐司面包',     spec: '组织松软细腻，麦香浓郁，可做三明治或直接食用。',   price: 13.00, img: BASE + 'good13.jpg', stock: 6,  hot: 1 },
  { id: 17, categoryId: 5, name: '纯牛奶（全脂）',   spec: '奶香醇厚，口感顺滑，富含蛋白质和钙，适合日常饮用。', price: 5.00,  img: BASE + 'good14.jpg', stock: 37, hot: 1 },
  { id: 18, categoryId: 5, name: '原味酸奶',         spec: '质地浓稠，酸甜适中，含益生菌，有助肠道健康。',     price: 7.00,  img: BASE + 'good15.jpg', stock: 12, hot: 1 },

  // 速食冻品
  { id: 19, categoryId: 6, name: '速冻猪肉白菜水饺', spec: '皮薄馅足，汤汁浓郁，煮制方便，是快捷早餐或晚餐。', price: 20.00, img: BASE + 'good16.jpg', stock: 48, hot: 0 },
  { id: 20, categoryId: 6, name: '深海鳕鱼排',       spec: '外酥里嫩，无刺少骨，适合儿童，空气炸锅即可制作。',   price: 15.00, img: BASE + 'good17.jpg', stock: 30, hot: 1 },
  { id: 21, categoryId: 6, name: '灌汤小笼包',       spec: '皮薄透光，汤汁鲜美，肉馅饱满，蒸制即食。',         price: 19.00, img: BASE + 'good18.jpg', stock: 30, hot: 1 }
]

// ---------------- 分类映射 ----------------
const categoryMap = {
  1: '新鲜蔬菜',
  2: '时令水果',
  3: '肉禽蛋品',
  4: '海鲜水产',
  5: '乳品烘焙',
  6: '速食冻品'
}

// ---------------- 加载商品详情 ----------------
const loadGoodsDetail = () => {
  const goodsId = Number(route.query.id)
  if (!goodsId) {
    alert('商品ID不能为空！')
    router.replace('/list')
    return
  }

  const goods = rawGoodsList.find(g => g.id === goodsId)
  if (!goods) {
    alert('商品不存在')
    router.replace('/list')
    return
  }

  // 从购物车读取已加入数量
  let cartCount = 0
  try {
    const cartList = JSON.parse(localStorage.getItem('cartList') || '[]')
    const item = cartList.find(i => i.id === goods.id)
    if (item) cartCount = item.count
  } catch (e) {}

  // 组装详情页所需字段
  goodsDetail.value = {
    ...goods,
    // 详情页字段名与列表页的差异统一在这里映射
    description: goods.spec,                          // spec → description
    categoryName: categoryMap[goods.categoryId] || '其他',
    // 热销商品原价 = 现价 × 1.2
    originPrice: goods.hot === 1
      ? Number((goods.price * 1.2).toFixed(2))
      : null,
    soldOut: goods.stock === 0,
    count: cartCount
  }

  loading.value = false
}

// ---------------- 加入购物车 ----------------
const addToCart = () => {
  if (goodsDetail.value.soldOut) return

  let cartList = []
  try { cartList = JSON.parse(localStorage.getItem('cartList') || '[]') } catch (e) {}

  const idx = cartList.findIndex(i => i.id === goodsDetail.value.id)

  if (idx > -1) {
    cartList[idx].count += 1
    goodsDetail.value.count = cartList[idx].count
  } else {
    cartList.push({
      id: goodsDetail.value.id,
      name: goodsDetail.value.name,
      price: goodsDetail.value.price,
      img: goodsDetail.value.img,
      count: 1,
      checked: true
    })
    goodsDetail.value.count = 1
  }

  localStorage.setItem('cartList', JSON.stringify(cartList))
  alert('已加入购物车')
}

const goBack = () => router.go(-1)

onMounted(() => {
  loadGoodsDetail()
})
</script>
<style scoped>
/* 外层：满宽灰底 */
.goods-detail-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
  padding: 20px 0;
  font-family: "Microsoft Yahei", sans-serif;
}

/* 内层：1200px 白卡居中 */
.detail-content {
  width: 1200px;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 40px;
}

/* 加载 / 空状态：也放进白卡里 */
.loading,
.empty {
  width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  padding: 100px 0;
  font-size: 18px;
  color: #999;
}

/* ------- 以下样式保持不变 ------- */
.detail-left {
  width: 350px;
  flex-shrink: 0;
}

.goods-big-img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}

.detail-right {
  flex: 1;
  min-width: 0;
}

.goods-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.goods-price {
  margin-bottom: 15px;
}

.current-price {
  font-size: 28px;
  color: #ff4d4f;
  font-weight: 700;
}

.origin-price {
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
  margin-left: 15px;
}

.goods-category,
.goods-spec,
.goods-status {
  margin-bottom: 15px;
  font-size: 16px;
}

.label {
  color: #666;
  margin-right: 10px;
}

.on-sale {
  color: #ff4d4f;
}

.sold-out {
  color: #999;
}

.goods-desc {
  margin-bottom: 30px;
}

.goods-desc p {
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.operate-btn {
  display: flex;
  gap: 20px;
  margin-left: 200px
}

.add-cart-btn,
.back-btn {
  padding: 10px 30px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-cart-btn {
  background-color: #ff4d4f;
  color: #fff;
}

.add-cart-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-btn {
  background-color: #f5f5f5;
  color: #333;
}

.add-cart-btn:hover:not(:disabled),
.back-btn:hover {
  opacity: 0.9;
}
</style>

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
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
axios.defaults.baseURL = 'http://localhost/cai/api'

const loading = ref(true)
const goodsDetail = ref({})

const loadGoodsDetail = async () => {
  const goodsId = route.query.id
  if (!goodsId) {
    alert('商品ID不能为空！')
    goBack()
    return
  }

  try {
    const res = await axios.get('/goods_detail.php', {
      params: { id: goodsId }
    })
    if (res.data.code === 200) {
      goodsDetail.value = res.data.data
    } else {
      alert('加载失败：' + res.data.message)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const addToCart = () => {
  if (goodsDetail.value.soldOut) return
  goodsDetail.value.count++

  let cartList = JSON.parse(localStorage.getItem('cartList') || '[]')
  const idx = cartList.findIndex(i => i.id === goodsDetail.value.id)

  if (idx > -1) {
    cartList[idx].count = goodsDetail.value.count
  } else {
    cartList.push({
      id: goodsDetail.value.id,
      name: goodsDetail.value.name,
      price: goodsDetail.value.price,
      img: goodsDetail.value.img,
      count: 1,
      checked: true
    })
  }

  localStorage.setItem('cartList', JSON.stringify(cartList))
  alert('已加入购物车')
}

const goBack = () => router.go(-1)
onMounted(() => loadGoodsDetail())
</script>

<style scoped>
.goods-detail-page {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
  font-family: "Microsoft Yahei", sans-serif;
}

.loading, .empty {
  text-align: center;
  padding: 100px 0;
  font-size: 18px;
  color: #999;
}

.detail-content {
  display: flex;
  gap: 40px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.detail-left {
  width: 400px;
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

.goods-category, .goods-spec, .goods-status {
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
}

.add-cart-btn, .back-btn {
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

.add-cart-btn:hover:not(:disabled), .back-btn:hover {
  opacity: 0.9;
}
</style>
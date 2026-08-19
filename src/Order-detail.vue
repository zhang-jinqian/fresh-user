<template>
  <!-- 外层容器：主内容 + 右侧悬浮 -->
  <div class="order-detail-wrapper" v-if="orderInfo">
    <!-- 左侧主内容区 -->
    <div class="main-content">
      <!-- 顶部返回 & 订单基础信息 -->
      <div class="order-header-bar">
        <div class="back-btn" @click="$router.go(-1)">← 返回订单列表</div>
        <div class="order-basic">
          <span class="order-no">订单号：{{ orderInfo.order_no }}</span>
          <span class="order-status" :class="getStatusClass(orderInfo.status)">
            {{ getStatusText(orderInfo.status) }}
          </span>
          <!-- 优惠券提示 -->
          <span class="coupon-tag" v-if="orderInfo.discount_amount > 0">
            {{ orderInfo.coupon_name || '优惠券' }} 抵扣 ¥{{ orderInfo.discount_amount.toFixed(2) }}
          </span>
        </div>
        <div class="create-time">创建时间：{{ orderInfo.create_time }}</div>
      </div>

      <!-- 收货信息 + 配送信息 -->
      <div class="info-section">
        <div class="info-col">
          <h3 class="info-title">收货信息</h3>
          <div class="info-item">
            <span class="label">收件人：</span>
            <span class="value">{{ orderInfo.address.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系方式：</span>
            <span class="value">{{ orderInfo.address.phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货地址：</span>
            <span class="value">{{ orderInfo.address.address }}</span>
          </div>
        </div>

        <div class="info-col">
          <h3 class="info-title">配送信息</h3>
          <div class="info-item">
            <span class="label">配送方式：</span>
            <span class="value">
              {{ orderInfo.status === 'pending' || orderInfo.status === 'cancelled' ? '无' : '普通快递' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">运 费：</span>
            <span class="value">
              {{ orderInfo.status === 'pending' || orderInfo.status === 'cancelled' ? '无' : '¥0.00' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="goods-section">
        <div class="shop-title">店铺：{{orderInfo.shop_name||'生鲜购自营店'}}</div>
        <table class="goods-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>数量</th>
              <th>单价</th>
              <th>总额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderInfo.goods" :key="item.goods_id">
              <td class="goods-cell">
                <img :src="item.img" class="goods-img" alt="商品图片">
                <span class="goods-name">{{ item.name }}</span>
              </td>
              <td>×{{ item.count }}</td>
              <td>¥{{ item.price.toFixed(2) }}</td>
              <td>¥{{ (item.price * item.count).toFixed(2) }}</td>
              <td><a href="#" class="view-btn">查看商品</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 金额汇总（含优惠券抵扣） -->
      <div class="amount-section">
        <div class="amount-item">
          <span class="label">商品总额：</span>
          <span class="value">¥{{ orderInfo.total_amount.toFixed(2) }}</span>
        </div>
        <div class="amount-item discount" v-if="orderInfo.discount_amount > 0">
          <span class="label">优惠券抵扣：</span>
          <span class="value">-¥{{ orderInfo.discount_amount.toFixed(2) }}</span>
        </div>
        <div class="amount-item" v-if="orderInfo.status !== 'cancelled'">
          <span class="label">商品运费：</span>
          <span class="value">¥0.00</span>
        </div>
        <div class="amount-item total">
          <span class="label">应付金额：</span>
          <span class="value">¥{{ orderInfo.pay_amount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 操作按钮：仅在已发货时显示“确认收货” -->
      <div class="action-bar" v-if="orderInfo.status === 'shipped'">
        <button class="confirm-btn" @click="handleConfirm">确认收货</button>
      </div>
    </div>

    <!-- 右侧悬浮评价卡片：仅已完成且有评价时显示 -->
    <div 
      class="comment-float-card" 
      v-if="orderInfo.status === 'completed' && orderInfo.comment && orderInfo.comment.trim()"
    >
      <div class="card-header">
        <span class="card-icon">✍️</span>
        <span class="card-title">用户评价</span>
      </div>
      <div class="card-content">
        {{ orderInfo.comment }}
      </div>
    </div>
  </div>

  <!-- 加载中状态 -->
  <div v-else class="loading-page">
    正在加载订单详情，请稍候...
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const orderInfo = ref(null)

const statusMap = {
  pending: { text: '待支付', class: 'status-pending' },
  paid: { text: '已支付', class: 'status-paid' },
  shipped: { text: '已发货', class: 'status-shipped' },
  completed: { text: '已完成', class: 'status-completed' },
  cancelled: { text: '已取消', class: 'status-cancelled' },
  cancel_requested:{text: '取消审核中',class:'status-cancel_requested'}
}

const getStatusText = (status) => statusMap[status]?.text || '未知状态'
const getStatusClass = (status) => statusMap[status]?.class || ''

const getOrderDetail = async () => {
  const orderId = route.params.id
  try {
    const res = await axios.get(`http://localhost/cai/api/order_detail.php?id=${orderId}`)
    orderInfo.value = res.data.data
  } catch (err) {
    console.error('获取订单详情失败', err)
    alert('获取订单详情失败：' + (err.response?.data?.msg || err.message))
  }
}

const handleConfirm = async () => {
  if (!confirm('确定确认收货？')) return
  try {
    await axios.put('http://localhost/cai/api/order.php', {
      id: orderInfo.value.id,
      action: 'confirm'
    })
    alert('确认收货成功')
    getOrderDetail()
  } catch (err) {
    console.error('确认收货失败', err)
    alert('确认收货失败：' + (err.response?.data?.msg || err.message))
  }
}

onMounted(() => {
  getOrderDetail()
})
</script>

<style scoped>
/* 样式保持不变，可继续使用原代码中的样式 */
.order-detail-wrapper {
  width: 1280px;
  min-width: 1280px;
  max-width: 1280px;
  min-height: 100vh;
  margin: 0 auto;
  background-color: #f7f8fa;
  padding: 30px 0;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.main-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.comment-float-card {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  position: sticky;
  top: 30px;
  border: 1px solid #f0f0f0;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 15px;
}
.card-icon {
  font-size: 20px;
  color: #1890ff;
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.card-content {
  font-size: 16px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 15px;
  min-height: 80px;
}
.order-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
  font-size: 18px;
  flex-wrap: wrap;
  gap: 10px;
}
.back-btn {
  color: #00b42a;
  cursor: pointer;
  font-size: 18px;
}
.order-basic {
  display: flex;
  gap: 30px;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}
.order-no {
  font-size: 20px;
  font-weight: 500;
}
.order-status {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 16px;
}
.coupon-tag {
  padding: 4px 12px;
  background: #f6ffed;
  color: #52c41a;
  border-radius: 4px;
  font-size: 14px;
}
.status-paid {
  background: #e6f4ff;
  color: #4096ff;
}
.status-shipped {
  background: #e6f4ff;
  color: #4096ff;
}
.status-completed {
  background: #f6ffed;
  color: #52c41a;
}
.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}
.status-cancelled {
  background: #f5f5f5;
  color: #999;
}
.status-cancel_requested{
  background: #f6c53d92;
  color: #fa8b14;
}
.create-time {
  color: #666;
  font-size: 18px;
}
.info-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  background: #eee;
  margin-bottom: 30px;
}
.info-col {
  background: #fff;
  padding: 30px;
}
.info-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 25px;
}
.info-item {
  margin-bottom: 15px;
  font-size: 18px;
  line-height: 1.8;
}
.info-item .label {
  color: #999;
  width: 100px;
  display: inline-block;
}
.info-item .value {
  color: #333;
}
.goods-section {
  margin-bottom: 30px;
}
.shop-title {
  font-size: 20px;
  font-weight: 600;
  padding: 0 0 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.goods-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 18px;
}
.goods-table th,
.goods-table td {
  padding: 20px 0;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.goods-table th {
  background: #f9f9f9;
  color: #666;
  font-weight: 600;
  font-size: 18px;
  padding: 15px 0;
}
.goods-cell {
  display: flex;
  align-items: center;
  gap: 20px;
}
.goods-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
}
.goods-name {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
}
.view-btn {
  color: #00b42a;
  text-decoration: none;
  font-size: 18px;
}
.amount-section {
  text-align: right;
  padding: 20px 0;
  border-top: 1px solid #eee;
  font-size: 18px;
  margin-bottom: 30px;
}
.amount-item {
  margin-bottom: 12px;
  font-size: 18px;
}
.amount-item.discount .value {
  color: #52c41a;
  font-weight: 500;
}
.amount-item .label {
  color: #666;
  margin-right: 15px;
}
.amount-item.total .value {
  color: #ff4d4f;
  font-size: 24px;
  font-weight: 700;
}
.action-bar {
  text-align: right;
  padding-top: 10px;
}
.confirm-btn {
  padding: 15px 40px;
  background: #00b42a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-btn:hover {
  background: #00a128;
}
.loading-page {
  text-align: center;
  padding: 80px;
  font-size: 20px;
  color: #666;
  width: 1280px;
  margin: 0 auto;
  background-color: #f7f8fa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
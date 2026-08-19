<template>
  <FreshNav />
  <div class="order-list-page">
    <div class="order-list-container">
      <h2>我的订单</h2>

      <!-- 筛选栏 -->
      <div class="filter-section">
        <button class="filter-btn" :class="{ active: activeStatus === 'all' }" @click="changeStatus('all')">全部订单</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'pending' }" @click="changeStatus('pending')">待付款</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'paid' }" @click="changeStatus('paid')">待发货</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'shipped' }" @click="changeStatus('shipped')">已发货</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'completed' }" @click="changeStatus('completed')">已完成</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'cancelled' }" @click="changeStatus('cancelled')">已取消</button>
        <button class="filter-btn" :class="{ active: activeStatus === 'cancel_requested' }" @click="changeStatus('cancel_requested')">取消审核中</button>
      </div>

      <!-- 订单表格 -->
      <div class="order-table">
        <div class="table-header">
          <div class="col col-goods">商品</div>
          <div class="col col-count">数量</div>
          <div class="col col-price">单价</div>
          <div class="col col-total">总价/实付</div>
          <div class="col col-status">状态</div>
          <div class="col col-op">操作</div>
        </div>

        <!-- 订单列表 -->
        <div class="order-item" v-for="order in filteredOrders" :key="order.id">
          <!-- 订单头部：包含订单信息 + 操作按钮 -->
          <div class="order-header">
            <div class="order-info">
              <span class="order-no">订单号：{{ order.order_no }}</span>
              <span class="shop-name">{{ order.shop_name || '生鲜购自营店' }}</span>
              <span class="coupon-discount" v-if="order.discount_amount > 0">
                {{ order.coupon_name || '优惠券' }} 抵扣 ¥{{ order.discount_amount.toFixed(2) }}
              </span>
            </div>
            <div class="order-total">
              <span class="total-amount">总价：¥{{ order.total_amount.toFixed(2) }}</span>
              <span v-if="order.discount_amount > 0" class="pay-amount">实付：¥{{ order.pay_amount.toFixed(2) }}</span>
            </div>
            <!-- 操作按钮区域（订单级别，只显示一次） -->
            <div class="order-actions">
              <!-- 订单详情链接 -->
              <span class="detail-link" @click="viewOrderDetail(order.id)">订单详情</span>
              <!-- 待付款按钮 -->
              <button v-if="order.status === 'pending'" @click="goPay(order.id)" class="btn-pay">立即付款</button>
            
              <button v-if="(order.status === 'pending' || order.status === 'paid') && order.status !== 'cancel_requested'"
                      @click="requestCancelOrder(order)" class="btn-cancel">取消订单</button>
              <!-- 显示审核中状态 -->
              <span v-if="order.status === 'cancel_requested'" class="cancel-pending-status">取消申请审核中</span>
              
              <!-- 已发货：确认收货 -->
              <button v-if="order.status === 'shipped'" @click="confirmReceipt(order.id)" class="btn-confirm">确认收货</button>
              <!-- 已完成：评价按钮 -->
              <button 
                v-if="order.status === 'completed' && order.is_commented == 0" 
                @click="openCommentModal(order.id)"
                class="btn-comment"
              >
                去评价
              </button>
              <button 
                v-if="order.status === 'completed' && order.is_commented == 1" 
                class="btn-comment disabled"
                disabled
              >
                已评价
              </button>
            </div>
          </div>

          <!-- 商品列表行（无操作按钮） -->
          <div class="goods-row" v-for="goods in order.goods" :key="goods.goods_id">
            <div class="col col-goods">
              <img :src="goods.img" alt="商品" class="goods-img" />
              <span class="goods-name">{{ goods.name }}</span>
            </div>
            <div class="col col-count">×{{ goods.count }}</div>
            <div class="col col-price">¥{{ goods.price.toFixed(2) }}</div>
            <div class="col col-total"></div> <!-- 空内容，保持列结构 -->
            <div class="col col-status">
              <div class="status-text" :class="getStatusClass(order.status)">
                {{ getStatusText(order.status) }}
              </div>
            </div>
            <div class="col col-op"></div> <!-- 操作列占位，无内容 -->
          </div>
        </div>

        <div class="empty-order" v-if="filteredOrders.length === 0">
          暂无相关订单
        </div>
      </div>
    </div>

    <!-- 评价弹窗 -->
    <div class="comment-modal" v-if="showCommentModal">
      <div class="modal-content">
        <h3>评价订单</h3>
        <textarea 
          v-model="commentContent" 
          placeholder="请输入你的评价..."
          class="comment-input"
        ></textarea>
        <div class="modal-btns">
          <button @click="showCommentModal=false" class="btn-cancel">取消</button>
          <button @click="submitComment" class="btn-submit">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FreshNav from './components/HeaderNav.vue'

const router = useRouter()
axios.defaults.baseURL = 'http://localhost/cai/api'

// 订单列表
const orderList = ref([])
const activeStatus = ref('all')

// 评价弹窗
const showCommentModal = ref(false)
const currentCommentOrderId = ref(0)
const commentContent = ref('')

// 初始化订单列表
const initOrderList = async () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) {
    alert('请先登录！')
    router.push('/login')
    return
  }
  const userInfo = JSON.parse(userInfoStr)

  try {
    const res = await axios.post('/order.php', {
      action: 'list',
      user_id: userInfo.id
    })
    if (res.data.code === 200) {
      orderList.value = res.data.data
    } else {
      alert('获取订单失败：' + res.data.msg)
    }
  } catch (error) {
    console.error('获取订单错误：', error)
    // 模拟数据（兼容coupon_id=null）
    
  }
}

// 筛选订单
const filteredOrders = computed(() => {
  if (activeStatus.value === 'all') return orderList.value
  return orderList.value.filter(order => order.status === activeStatus.value)
})

// 切换筛选状态
const changeStatus = (status) => {
  activeStatus.value = status
}

// 状态文字映射
const getStatusText = (status) => {
  const map = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancel_requested: '取消审核中',
    cancelled: '已取消'
  }
  return map[status] || '未知状态'
}

// 状态样式类
const getStatusClass = (status) => {
  const map = {
    pending: 'status-pending',
    paid: 'status-paid',
    shipped: 'status-shipped',
    completed: 'status-completed',
     cancel_requested: 'status-cancel-request',
    cancelled: 'status-cancelled'
  }
  return map[status] || ''
}

// 查看订单详情
const viewOrderDetail = (orderId) => {
  router.push(`/order-detail/${orderId}`)
}

// 支付订单
const goPay = (orderId) => {
  router.push('/pay/' + orderId)
}
// 申请取消订单（新）
const requestCancelOrder = async (order) => {
  // 前端检查7天限制（可选）
  const createTime = new Date(order.create_time)
  const now = new Date()
  const diffDays = (now - createTime) / (1000 * 3600 * 24)
  if (diffDays > 7) {
    alert('订单创建已超过7天，无法取消')
    return
  }

  const reason = prompt('请输入取消原因（可选）', '')
  if (reason === null) return

  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = JSON.parse(userInfoStr)
  try {
    const res = await axios.post('/order.php', {
      action: 'request_cancel',
      order_id: order.id,
      user_id: userInfo.id,
      reason: reason
    })
    if (res.data.code === 200) {
      alert('取消申请已提交，等待管理员审核')
      initOrderList() // 刷新列表，状态变为 cancel_requested
    } else {
      alert(res.data.msg)
    }
  } catch (err) {
    console.error(err)
    alert('提交失败，请重试')
  }
}


// 确认收货
const confirmReceipt = async (orderId) => {
  if (!confirm('确定确认收货？')) return
  try {
    const res = await axios.put('/order.php', { id: orderId, action: 'confirm' })
    if (res.data.code === 200) {
      alert('确认收货成功！')
      initOrderList()
    } else {
      alert('确认收货失败：' + res.data.msg)
    }
  } catch (err) {
    console.error(err)
    alert('确认收货失败，请重试')
  }
}

// 打开评价弹窗
const openCommentModal = (orderId) => {
  currentCommentOrderId.value = orderId
  commentContent.value = ''
  showCommentModal.value = true
}

// 提交评价
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    alert('请输入评价内容！')
    return
  }

  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = JSON.parse(userInfoStr)

  try {
    const res = await axios.post('/order.php', {
      action: 'add_comment',
      order_id: currentCommentOrderId.value,
      comment: commentContent.value
    })

    if (res.data.code === 200) {
      alert('评价成功！')
      showCommentModal.value = false
      initOrderList()
    } else {
      alert('评价失败：' + res.data.msg)
    }
  } catch (err) {
    console.error(err)
    alert('评价失败，请重试')
  }
}

onMounted(() => initOrderList())
</script>

<style scoped>
/* 基础样式 */
.order-list-page {
  width: 100%;
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20px 0;
}
.order-list-container {
  width: 1200px;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
}
.order-list-container h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 20px;
}

/* 筛选栏 */
.filter-section {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}
.filter-btn {
  padding: 8px 0;
  border: none;
  background: transparent;
  font-size: 18px;
  color: #333;
  cursor: pointer;
}
.filter-btn.active {
  color: #ff4d4f;
  border-bottom: 2px solid #ff4d4f;
}

/* 订单表格 */
.order-table {
  border: 1px solid #eee;
}
.table-header {
  display: flex;
  background: #f9f9f9;
  padding: 15px 20px;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #eee;
}
.col {
  text-align: center;
}
.col-goods { width: 45%; text-align: left; }
.col-count { width: 10%; }
.col-price { width: 15%; }
.col-total { width: 15%; }
.col-status { width: 10%; }
.col-op { width: 15%; }

/* 订单项 */
.order-item {
  border-bottom: 1px solid #eee;
}
.order-item:last-child {
  border-bottom: none;
}
.order-header {
  padding: 15px 20px;
  background: #fafafa;
  font-size: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}
.order-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}
.order-no {
  font-size: 18px;
  color: #666;
}
.shop-name {
  font-size: 18px;
  color: #333;
}
.coupon-discount {
  font-size: 16px;
  color: #ff4d4f;
}
.order-total {
  font-size: 16px;
}
.total-amount {
  font-weight: bold;
  color: #333;
  margin-right: 15px;
}
.pay-amount {
  color: #ff4d4f;
  font-weight: bold;
}
.order-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
}
.detail-link {
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

/* 商品行 */
.goods-row {
  display: flex;
  padding: 20px;
  align-items: center;
  border-top: 1px solid #eee;
}
.goods-row:first-child {
  border-top: none;
}
.col-goods {
  display: flex;
  align-items: center;
  gap: 15px;
}
.goods-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}
.goods-name {
  font-size: 18px;
  color: #333;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.col-count, .col-price {
  font-size: 18px;
  color: #333;
}
/* 总价/实付列（已隐藏内容，保持列宽） */
.col-total {
  font-size: 18px;
  color: #333;
}

/* 状态列 */
.status-text {
  font-size: 18px;
  color: #ff4d4f;
}
.status-paid { color: #1890ff; }
.status-shipped { color: #1890ff; }
.status-completed { color: #52c41a; }
.status-cancelled { color: #999; }

/* 操作按钮 */
.btn-pay {
  padding: 8px 25px;
  border: 1px solid #ff4d4f;
  background: #fff;
  color: #ff4d4f;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
.btn-confirm {
  padding: 8px 25px;
  border: 1px solid #52c41a;
  background: #52c41a;
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
.btn-cancel {
  padding: 8px 25px;
  border: none;
  background: transparent;
  color: #333;
  font-size: 16px;
  cursor: pointer;
}
.btn-comment {
  padding: 8px 25px;
  border: 1px solid #1890ff;
  background: #fff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
.btn-comment.disabled {
  background: #f5f5f5;
  color: #999;
  border-color: #ddd;
  cursor: not-allowed;
}

/* 评价弹窗 */
.comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  width: 400px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}
.modal-content h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}
.comment-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  margin-bottom: 15px;
  font-size: 16px;
}
.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.modal-btns .btn-cancel {
  padding: 8px 15px;
  border: 1px solid #ddd;
  background: #fff;
}
.modal-btns .btn-submit {
  padding: 8px 15px;
  border: none;
  background: #ff4d4f;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.empty-order {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 16px;
}
.status-cancel-request {
  color: #faad14;
}
.cancel-pending-status {
  font-size: 14px;
  color: #faad14;
  margin-left: 10px;
}





</style>
<template>
  <div class="user-manager-page">
    <!-- 页面头部：标题+操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <button class="add-btn" @click="openAddModal">+ 新增用户</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="请输入手机号/姓名搜索" 
        class="search-input"
      >
      <button class="search-btn" @click="searchUser">搜索</button>
    </div>

    <!-- 用户列表 -->
    <div class="user-table-container">
      <table class="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>性别</th>
            <th>注册时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 空数据提示 -->
          <tr v-if="userList.length === 0">
            <td colspan="7" class="empty-tip">暂无用户数据</td>
          </tr>
          <!-- 用户列表项 -->
          <tr v-for="user in userList" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.phone }}</td>
            <td>{{ user.gender == 1 ? '男' : user.gender == 2 ? '女' : '未知' }}</td>
            <td>{{ formatTime(user.create_time) }}</td>
            <td>
              <span class="status-tag" :class="{ active: user.status === 1, inactive: user.status === 0 }">
                {{ user.status == 1 ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="operate-col">
              <button class="edit-btn" @click="openEditModal(user)">编辑</button>
              <button class="delete-btn" @click="openDeleteConfirm(user)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="userList.length > 0">
      <button 
        class="page-btn" 
        @click="currentPage--" 
        :disabled="currentPage === 1"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </span>
      <button 
        class="page-btn" 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
      >
        下一页
      </button>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <div class="modal-mask" v-if="modalVisible" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
          <span class="close-icon" @click="closeModal">×</span>
        </div>
        <div class="modal-body">
          <form class="user-form">
            <div class="form-item">
              <label class="form-label">姓名：</label>
              <input 
                v-model="formData.name" 
                type="text" 
                class="form-input"
                placeholder="请输入姓名"
              >
            </div>
            <div class="form-item">
              <label class="form-label">手机号：</label>
              <input 
                v-model="formData.phone" 
                type="text" 
                class="form-input"
                placeholder="请输入手机号"
                :disabled="isEdit"  <!-- 编辑时手机号不可修改 -->
              >
            </div>
            <div class="form-item">
              <label class="form-label">性别：</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input 
                    v-model="formData.gender" 
                    type="radio" 
                    value="1"
                  > 男
                </label>
                <label class="radio-item">
                  <input 
                    v-model="formData.gender" 
                    type="radio" 
                    value="2"
                  > 女
                </label>
                <label class="radio-item">
                  <input 
                    v-model="formData.gender" 
                    type="radio" 
                    value="0"
                  > 未知
                </label>
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">状态：</label>
              <select v-model="formData.status" class="form-select">
                <option value="1">正常</option>
                <option value="0">禁用</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="submitForm">{{ isEdit ? '保存' : '新增' }}</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-mask" v-if="deleteConfirmVisible" @click="closeDeleteConfirm">
      <div class="confirm-modal" @click.stop>
        <div class="confirm-header">
          <h3>确认删除</h3>
        </div>
        <div class="confirm-body">
          <p>确定要删除用户 <span class="highlight">{{ deleteUser?.name }}</span> 吗？此操作不可恢复。</p>
        </div>
        <div class="confirm-footer">
          <button class="cancel-btn" @click="closeDeleteConfirm">取消</button>
          <button class="delete-confirm-btn" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// API 基础路径（根据实际情况调整）
const apiBase =  'http://localhost/cai/api'

// ---------- 响应式数据 ----------
const userList = ref([])           // 当前页用户列表
const total = ref(0)                // 总记录数
const loading = ref(false)          // 加载状态（可选）

// 搜索关键词
const searchKeyword = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗控制
const modalVisible = ref(false)
const isEdit = ref(false)

// 表单数据
const formData = ref({
  id: '',
  name: '',
  phone: '',
  gender: '0',
  status: '1'
})

// 删除确认弹窗
const deleteConfirmVisible = ref(false)
const deleteUser = ref(null)

// ---------- 计算属性 ----------
// 总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value) || 1
})

// ---------- API 方法 ----------
// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${apiBase}/user_list.php`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value.trim()
      }
    })
    if (response.data.code === 200) {
      userList.value = response.data.data.list
      total.value = response.data.data.total
    } else {
      alert(response.data.message || '加载失败')
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
    alert('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索用户
const searchUser = () => {
  currentPage.value = 1  // 重置到第一页
  fetchUsers()
}

// ---------- 新增/编辑弹窗 ----------
const openAddModal = () => {
  // 重置表单
  formData.value = {
    id: '',
    name: '',
    phone: '',
    gender: '0',
    status: '1'
  }
  isEdit.value = false
  modalVisible.value = true
}

const openEditModal = (user) => {
  formData.value = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    gender: user.gender.toString(),
    status: user.status.toString()
  }
  isEdit.value = true
  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
}

// 提交表单（新增/编辑）
const submitForm = async () => {
  // 表单校验
  if (!formData.value.name.trim()) {
    alert('请输入姓名')
    return
  }
  if (!isEdit.value && !/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    alert('请输入正确的手机号')
    return
  }
   if (!isEdit.value) {
    const isPhoneExist = userList.value.some(user => user.phone === formData.value.phone);
    if (isPhoneExist) {
      alert('该手机号已存在，请使用其他号码');
      return;
    }
  }
  if (isEdit.value && !formData.value.name.trim()) {
    alert('请输入姓名')
    return
  }

  try {
    let response
    if (isEdit.value) {
      response = await axios.post(`${apiBase}/user_edit.php`, {
        id: formData.value.id,
        name: formData.value.name,
        gender: parseInt(formData.value.gender),
        status: parseInt(formData.value.status)
      })
    } else {
      response = await axios.post(`${apiBase}/user_add.php`, {
        name: formData.value.name,
        phone: formData.value.phone,
        gender: parseInt(formData.value.gender),
        status: parseInt(formData.value.status)
      })
    }

    if (response.data.code === 200) {
      alert(isEdit.value ? '编辑成功' : '新增成功')
      closeModal()
      fetchUsers()  // 刷新列表
    } else {
      alert(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败', error)
    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message)  // 例如 "该手机号已存在"
    } else {
      alert('操作失败，请检查网络或联系管理员')
    }
  }
}

// ---------- 删除 ----------
const openDeleteConfirm = (user) => {
  deleteUser.value = user
  deleteConfirmVisible.value = true
}

const closeDeleteConfirm = () => {
  deleteConfirmVisible.value = false
  deleteUser.value = null
}

const confirmDelete = async () => {
  if (!deleteUser.value) return
  try {
    const response = await axios.get(`${apiBase}/user_delete.php`, {
      params: { id: deleteUser.value.id }
    })
    if (response.data.code === 200) {
      alert('删除成功')
      closeDeleteConfirm()
      // 如果当前页只剩一条数据且不是第一页，则跳到前一页
      if (userList.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      fetchUsers()
    } else {
      alert(response.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败', error)
    alert('删除失败，请稍后重试')
  }
}

// ---------- 工具函数 ----------
const formatTime = (timeStr) => {
  return timeStr || '——'
}

// 初始化加载
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* 全局样式 */
.user-manager-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: "Microsoft Yahei", sans-serif;
  background-color: #f7f8fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  color: #333;
  font-weight: 700;
  margin: 0;
}

.add-btn {
  background-color: #00b42a;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #009a24;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  outline: none;
}

.search-input:focus {
  border-color: #00b42a;
}

.search-btn {
  width: 80px;
  background-color: #00b42a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 用户表格 */
.user-table-container {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.user-table th {
  background-color: #f9f9f9;
  font-weight: 700;
  color: #333;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 60px 0;
}

/* 状态标签 */
.status-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.active {
  background-color: #e8f5e9;
  color: #00b42a;
}

.status-tag.inactive {
  background-color: #faf0f0;
  color: #e64340;
}

/* 操作列 */
.operate-col {
  display: flex;
  gap: 10px;
}

.edit-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn {
  background-color: #e64340;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
}

.page-btn {
  padding: 5px 15px;
  border: 1px solid #eee;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  color: #999;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* 弹窗遮罩 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* 新增/编辑弹窗 */
.modal-content {
  width: 500px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-icon {
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.close-icon:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  display: flex;
  align-items: center;
}

.form-label {
  width: 80px;
  font-size: 14px;
  color: #333;
}

.form-input, .form-select {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  outline: none;
}

.form-input:focus, .form-select:focus {
  border-color: #00b42a;
}

.radio-group {
  display: flex;
  gap: 20px;
  flex: 1;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 15px;
  border: 1px solid #eee;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 15px;
  background-color: #00b42a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 删除确认弹窗 */
.confirm-modal {
  width: 400px;
  background-color: #fff;
  border-radius: 8px;
}

.confirm-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.confirm-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.confirm-body {
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.highlight {
  color: #e64340;
  font-weight: 700;
}

.confirm-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.delete-confirm-btn {
  padding: 8px 15px;
  background-color: #e64340;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
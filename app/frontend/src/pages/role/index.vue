<template>
  <view class="page role-page">
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <text class="hero-title">角色管理</text>
          <component :is="Button" v-if="Button" type="default" @click="goBack">返回工作台</component>
        </view>
        <text class="hero-subtitle">配置角色及其权限</text>
      </view>
    </view>

    <view class="role-container">
      <component :is="Row" v-if="Row" :gutter="16">
        <component :is="Col" v-if="Col" :span="8" v-for="role in roleList" :key="role.roleCode">
          <component :is="Card" v-if="Card" :bordered="true">
            <view class="role-card-header">
              <view class="role-meta">
                <text class="role-name">{{ role.roleName }}</text>
                <text class="role-code">{{ role.roleCode }}</text>
              </view>
              <component :is="Button" v-if="Button && isCEO" type="primary" size="small">编辑</component>
            </view>
            <view class="role-desc">{{ role.description }}</view>
            <view class="role-perms">
              <component :is="Tag" v-if="Tag" v-for="perm in role.permissions" :key="perm">{{ perm }}</component>
            </view>
          </component>
        </component>
      </component>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'

const { Row, Col, Card, Tag, Button, Empty } = useComponent(['Row', 'Col', 'Card', 'Tag', 'Button', 'Empty'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')

const roleList = [
  {
    roleCode: 'employee',
    roleName: '员工',
    description: '发起和查看本人业务单据，查看并确认工资条',
    permissions: ['查看本人信息', '发起请假', '发起加班', '工资条确认与异议']
  },
  {
    roleCode: 'worker',
    roleName: '劳工',
    description: '处理施工日志、工伤补偿和个人工资确认事项',
    permissions: ['施工日志', '工伤补偿', '发起请假', '工资条确认与异议']
  },
  {
    roleCode: 'finance',
    roleName: '财务',
    description: '维护人员与薪资配置，执行结算、复核异议、导出数据',
    permissions: ['查看全员信息', '工资结算', '通讯录导入', '导出数据']
  },
  {
    roleCode: 'project_manager',
    roleName: '项目经理',
    description: '处理项目范围内审批，维护日志模板，查看项目总览',
    permissions: ['项目初审', '项目总览', '日志模板维护']
  },
  {
    roleCode: 'ceo',
    roleName: '首席经营者',
    description: '管理全局配置、终审审批、配置角色权限、查看经营总览',
    permissions: ['终审审批', '角色与权限配置', '数据有效期配置', '经营总览']
  }
]

const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.role-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-radius-lg);
}

.hero-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.role-container {
  :deep(.oa-card) {
    margin-bottom: 0;
  }
}

.role-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.role-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.role-code {
  font-size: 12px;
  color: var(--oa-text-tertiary);
}

.role-desc {
  font-size: 14px;
  color: var(--oa-text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.role-perms {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

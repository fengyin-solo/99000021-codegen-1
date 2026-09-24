<template>
  <div class="result-overview">
    <div class="overview-top">
      <div class="overview-conditions">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <el-tag
          v-if="searchQuery"
          type="info"
          class="condition-tag"
          closable
          @close="$emit('clear-search')"
        >
          关键词：{{ searchQuery }}
        </el-tag>
        <el-tag
          v-if="selectedTag"
          type="info"
          class="condition-tag"
          closable
          @close="$emit('clear-tag')"
        >
          标签：{{ selectedTag }}
        </el-tag>
        <el-button
          v-if="searchQuery || selectedTag"
          link
          type="primary"
          size="small"
          class="clear-all"
          @click="$emit('clear-all')"
        >
          清除全部
        </el-button>
      </div>
      <el-radio-group
        :model-value="view"
        size="small"
        class="view-switch"
        @update:model-value="onViewChange"
      >
        <el-radio-button value="card">卡片</el-radio-button>
        <el-radio-button value="list">列表</el-radio-button>
      </el-radio-group>
    </div>
    <div class="overview-stats">
      <span v-if="loading">正在加载…</span>
      <template v-else-if="total > 0">
        <span>共 {{ total }} 篇</span>
        <span class="divider">·</span>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <span class="divider">·</span>
        <span>当前显示第 {{ rangeStart }}–{{ rangeEnd }} 篇</span>
      </template>
      <span v-else>共 0 篇</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  visibleCount: {
    type: Number,
    default: 0
  },
  searchQuery: {
    type: String,
    default: ''
  },
  selectedTag: {
    type: String,
    default: null
  },
  view: {
    type: String,
    default: 'card'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear-search', 'clear-tag', 'clear-all', 'update:view'])

const pageTitle = computed(() => {
  if (props.searchQuery) return '搜索结果'
  if (props.selectedTag) return '标签筛选'
  return '最新文章'
})

const rangeStart = computed(() => (props.page - 1) * props.pageSize + 1)
const rangeEnd = computed(() => rangeStart.value + props.visibleCount - 1)

function onViewChange(view) {
  emit('update:view', view)
}
</script>

<style scoped>
.result-overview {
  background-color: #fff;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.overview-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.overview-conditions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 24px;
}

.page-title {
  font-size: 20px;
  color: #303133;
  margin: 0;
}

.condition-tag {
  font-size: 13px;
}

.clear-all {
  padding: 0;
}

.view-switch {
  flex-shrink: 0;
}

.overview-stats {
  margin-top: 10px;
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

.divider {
  color: #dcdfe6;
}
</style>

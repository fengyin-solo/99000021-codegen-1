<template>
  <el-card class="result-overview" shadow="never">
    <!-- 概览统计 -->
    <div v-loading="loading" class="overview-body">
      <template v-if="!loading">
        <div class="stat">
          <span class="stat-label">命中文章</span>
          <span class="stat-value" :class="{ zero: total === 0 }">{{ total }}</span>
          <span class="stat-unit">篇</span>
        </div>
        <el-divider direction="vertical" />
        <div class="stat">
          <span class="stat-label">当前位置</span>
          <template v-if="total > 0">
            <span class="stat-value">{{ page }}</span>
            <span class="stat-unit">/ {{ totalPages }} 页</span>
          </template>
          <span v-else class="stat-unit">—</span>
        </div>
        <el-divider direction="vertical" />
        <div class="stat">
          <span class="stat-label">当前可见</span>
          <template v-if="total > 0">
            <span class="stat-value">{{ rangeStart }}–{{ rangeEnd }}</span>
            <span class="stat-unit">条</span>
          </template>
          <span v-else class="stat-unit">—</span>
        </div>
        <div v-if="hasCondition" class="condition-chips">
          <el-tag
            v-if="search"
            closable
            type="primary"
            class="chip"
            @close="emit('clear-search')"
          >
            关键词：{{ search }}
          </el-tag>
          <el-tag
            v-if="tag"
            closable
            type="warning"
            class="chip"
            @close="emit('clear-tag')"
          >
            标签：{{ tag }}
          </el-tag>
          <el-button link type="info" size="small" class="reset-btn" @click="emit('clear-all')">
            重置条件
          </el-button>
        </div>
      </template>
    </div>
  </el-card>
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
  pageSize: {
    type: Number,
    default: 10
  },
  totalPages: {
    type: Number,
    default: 0
  },
  visibleCount: {
    type: Number,
    default: 0
  },
  search: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear-search', 'clear-tag', 'clear-all'])

const hasCondition = computed(() => Boolean(props.search || props.tag))
const rangeStart = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1
)
const rangeEnd = computed(() =>
  props.total === 0 ? 0 : rangeStart.value + props.visibleCount - 1
)
</script>

<style scoped>
.result-overview {
  margin-bottom: 20px;
  background-color: #f8fafc;
  border: 1px solid #e4e7ed;
}

.overview-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-right: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  line-height: 1;
}

.stat-value.zero {
  color: #f56c6c;
}

.stat-unit {
  font-size: 13px;
  color: #606266;
}

.condition-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.reset-btn {
  padding: 0;
}
</style>

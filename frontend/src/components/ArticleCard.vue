<template>
  <div v-if="compact" class="article-row" @click="goToArticle">
    <div class="row-main">
      <h3 class="row-title" v-html="highlightText(article.title)"></h3>
      <p class="row-summary" v-html="highlightText(article.summary)"></p>
    </div>
    <div class="row-side">
      <div class="row-tags">
        <el-tag
          v-for="tag in article.tags"
          :key="tag"
          size="small"
          @click.stop="filterByTag(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
      <span class="row-date">{{ formatDate(article.created_at) }}</span>
    </div>
  </div>

  <el-card v-else class="article-card" shadow="hover" @click="goToArticle">
    <template #header>
      <div class="card-header">
        <h3 class="article-title" v-html="highlightText(article.title)"></h3>
        <span class="article-date">{{ formatDate(article.created_at) }}</span>
      </div>
    </template>
    <p class="article-summary" v-html="highlightText(article.summary)"></p>
    <div class="article-tags">
      <el-tag
        v-for="tag in article.tags"
        :key="tag"
        size="small"
        @click.stop="filterByTag(tag)"
      >
        {{ tag }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  highlightQuery: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['tag-click'])
const router = useRouter()

function goToArticle() {
  router.push(`/article/${props.article.id}`)
}

function filterByTag(tag) {
  emit('tag-click', tag)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function highlightText(text) {
  if (!props.highlightQuery || !text) {
    return text
  }
  const regex = new RegExp(`(${props.highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}
</script>

<style scoped>
.article-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.article-title {
  font-size: 18px;
  color: #303133;
  margin: 0;
  flex: 1;
}

.article-date {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
  margin-left: 16px;
}

.article-summary {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-tags .el-tag {
  cursor: pointer;
}

.article-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background-color: #fff;
  border-radius: 4px;
  padding: 14px 20px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.article-row:hover {
  background-color: #f5f7fa;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  font-size: 16px;
  color: #303133;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-summary {
  color: #909399;
  font-size: 13px;
  margin: 4px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.row-tags .el-tag {
  cursor: pointer;
}

.row-date {
  color: #c0c4cc;
  font-size: 12px;
  white-space: nowrap;
}

:deep(.highlight) {
  background-color: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
}
</style>

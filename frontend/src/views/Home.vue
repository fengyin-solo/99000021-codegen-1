<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <h2 class="page-title">{{ pageTitle }}</h2>

        <!-- 组合概览：命中数量 / 当前位置 / 可见结果 / 生效条件 -->
        <ResultOverview
          :total="pagination.total"
          :page="pagination.page"
          :page-size="pagination.limit"
          :total-pages="pagination.totalPages"
          :visible-count="articles.length"
          :search="searchQuery"
          :tag="selectedTag"
          :loading="loading"
          @clear-search="clearSearch"
          @clear-tag="clearTag"
          @clear-all="clearAll"
        />

        <div v-loading="loading" class="article-list">
          <el-alert
            v-if="error"
            type="error"
            :closable="false"
            show-icon
            class="error-alert"
            title="文章加载失败，请稍后重试"
          >
            <el-button size="small" @click="fetchArticles">重试</el-button>
          </el-alert>

          <template v-else>
            <ArticleCard
              v-for="article in articles"
              :key="article.id"
              :article="article"
              :highlight-query="searchQuery"
              @tag-click="handleTagSelect"
            />

            <!-- 空条件：库中没有任何文章 -->
            <el-empty
              v-if="!loading && articles.length === 0 && !hasCondition"
              description="暂无文章，敬请期待"
            />

            <!-- 有条件但没有匹配结果 -->
            <el-empty
              v-else-if="!loading && articles.length === 0"
              :description="emptyDescription"
            >
              <el-button type="primary" @click="clearAll">查看全部文章</el-button>
            </el-empty>
          </template>
        </div>

        <Pagination
          v-if="!error"
          :total="pagination.total"
          :page-size="pagination.limit"
          :model-value="pagination.page"
          @change="handlePageChange"
        />
      </el-col>

      <el-col :span="6">
        <TagFilter
          :tags="tags"
          :selected-tag="selectedTag"
          @select="handleTagSelect"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import ArticleCard from '../components/ArticleCard.vue'
import TagFilter from '../components/TagFilter.vue'
import Pagination from '../components/Pagination.vue'
import ResultOverview from '../components/ResultOverview.vue'

const route = useRoute()
const router = useRouter()

const articles = ref([])
const tags = ref([])
const loading = ref(false)
const error = ref(false)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
})

// 筛选状态完全以 URL query 为准，刷新 / 前进后退都能还原同一状态
const selectedTag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : null))
const searchQuery = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
const currentPage = computed(() => {
  const page = parseInt(route.query.page, 10)
  return Number.isInteger(page) && page > 0 ? page : 1
})

const hasCondition = computed(() => Boolean(searchQuery.value || selectedTag.value))

const pageTitle = computed(() => {
  if (searchQuery.value) {
    return '搜索结果'
  }
  return selectedTag.value ? `标签: ${selectedTag.value}` : '最新文章'
})

const emptyDescription = computed(() => {
  const conditions = []
  if (searchQuery.value) conditions.push(`关键词“${searchQuery.value}”`)
  if (selectedTag.value) conditions.push(`标签“${selectedTag.value}”`)
  return `没有匹配${conditions.join(' 且 ')}的文章`
})

let activeController = null

// query（关键词 / 标签 / 页码）的任何变化都重新拉取，页面初始进入同样走这里
watch(
  () => [route.query.tag, route.query.search, route.query.page],
  () => {
    fetchArticles()
  },
  { immediate: true }
)

// 标签列表与筛选条件无关，仅需加载一次
onMounted(() => {
  fetchTags()
})

async function fetchArticles() {
  // 快速连续切换：丢弃上一个尚未返回的请求，保证概览与列表来自同一次、且是最新的条件
  if (activeController) {
    activeController.abort()
  }
  const controller = new AbortController()
  activeController = controller

  loading.value = true
  error.value = false
  try {
    const params = {
      page: currentPage.value,
      limit: pagination.value.limit
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await api.get('/articles', {
      params,
      signal: controller.signal
    })

    // 已被更新的切换取代，忽略结果
    if (controller !== activeController) return

    const { articles: list, pagination: pageInfo } = response.data
    articles.value = list
    pagination.value = pageInfo

    // 页码超出范围（如直接打开过期链接、末页数据被删）：回到第一页并对齐 URL
    if (
      pageInfo.total > 0
        ? pageInfo.page > pageInfo.totalPages
        : pageInfo.page > 1
    ) {
      updateQuery({ page: 1 })
    }
  } catch (err) {
    if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return
    if (controller !== activeController) return
    console.error('Failed to fetch articles:', err)
    error.value = true
    articles.value = []
    pagination.value = { ...pagination.value, total: 0, totalPages: 0 }
  } finally {
    if (controller === activeController) {
      loading.value = false
    }
  }
}

async function fetchTags() {
  try {
    const response = await api.get('/tags')
    tags.value = response.data.tags
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 仅更新 query 中给出的字段；watch route.query 会统一触发重新拉取，避免重复请求
function updateQuery(patch) {
  const query = { ...route.query, ...patch }
  Object.keys(query).forEach((key) => {
    if (query[key] === null || query[key] === undefined || query[key] === '') {
      delete query[key]
    }
  })
  router.replace({ query })
}

function handlePageChange(page) {
  // 页码变化不属于条件变化，保留当前关键词与标签
  updateQuery({ page: page > 1 ? page : null })
}

function handleTagSelect(tag) {
  // 切换标签属于条件变化：回到第一页
  updateQuery({ tag: tag || null, page: null })
}

function clearSearch() {
  // 关键词变化属于条件变化：回到第一页
  updateQuery({ search: null, page: null })
}

function clearTag() {
  updateQuery({ tag: null, page: null })
}

function clearAll() {
  updateQuery({ search: null, tag: null, page: null })
}
</script>

<style scoped>
.home {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
}

.article-list {
  min-height: 120px;
}

.error-alert {
  margin-bottom: 16px;
  align-items: center;
}
</style>

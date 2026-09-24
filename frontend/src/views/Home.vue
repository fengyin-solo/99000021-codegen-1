<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <ResultOverview
          :total="pagination.total"
          :page="currentPage"
          :total-pages="pagination.totalPages"
          :page-size="pagination.limit"
          :visible-count="articles.length"
          :search-query="searchQuery"
          :selected-tag="selectedTag"
          :view="viewMode"
          :loading="loading"
          @clear-search="handleClearSearch"
          @clear-tag="handleClearTag"
          @clear-all="handleClearAll"
          @update:view="handleViewChange"
        />

        <!-- 快速连续切换时取消旧请求，加载期间以骨架屏呈现明确视图 -->
        <el-skeleton v-if="loading" animated class="list-skeleton">
          <template #template>
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <el-skeleton-item variant="h3" style="width: 45%" />
              <el-skeleton-item variant="text" style="margin-top: 14px" />
              <el-skeleton-item variant="text" style="width: 60%" />
            </div>
          </template>
        </el-skeleton>

        <el-empty v-else-if="loadError" :description="loadError">
          <el-button type="primary" size="small" @click="fetchArticles">
            重新加载
          </el-button>
        </el-empty>

        <template v-else-if="articles.length > 0">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :highlight-query="searchQuery"
            :compact="viewMode === 'list'"
            @tag-click="handleTagSelect"
          />
        </template>

        <!-- 空条件或无匹配结果都有明确的空态 -->
        <el-empty v-else :description="emptyDescription">
          <el-button
            v-if="searchQuery || selectedTag"
            type="primary"
            plain
            size="small"
            @click="handleClearAll"
          >
            清除筛选条件
          </el-button>
        </el-empty>

        <Pagination
          v-if="!loadError"
          :model-value="currentPage"
          :total="pagination.total"
          :page-size="pagination.limit"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import ArticleCard from '../components/ArticleCard.vue'
import TagFilter from '../components/TagFilter.vue'
import Pagination from '../components/Pagination.vue'
import ResultOverview from '../components/ResultOverview.vue'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 10

const articles = ref([])
const tags = ref([])
const loading = ref(false)
const loadError = ref('')
const pagination = ref({
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 0
})

// 路由查询是列表状态的唯一来源，保证重新打开或从详情返回时概览与内容按同一状态呈现
function queryString(value) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

const searchQuery = computed(() => queryString(route.query.search).trim())
const selectedTag = computed(() => queryString(route.query.tag) || null)
const currentPage = computed(() => {
  const page = parseInt(queryString(route.query.page), 10)
  return Number.isNaN(page) || page < 1 ? 1 : page
})
const viewMode = computed(() => (route.query.view === 'list' ? 'list' : 'card'))

const emptyDescription = computed(() => {
  if (searchQuery.value || selectedTag.value) {
    return '未找到匹配的文章，换个关键词或清除筛选试试'
  }
  return '暂无文章'
})

let requestSeq = 0
let abortController = null
let lastFetchKey = ''

async function fetchArticles() {
  // 快速连续切换时取消上一次请求，只采用最新条件的结果
  abortController?.abort()
  abortController = new AbortController()
  const seq = ++requestSeq

  loading.value = true
  loadError.value = ''
  try {
    const params = {
      page: currentPage.value,
      limit: PAGE_SIZE
    }
    if (selectedTag.value) params.tag = selectedTag.value
    if (searchQuery.value) params.search = searchQuery.value

    const response = await api.get('/articles', {
      params,
      signal: abortController.signal
    })

    // 切换期间已有更新的请求发出，丢弃本次过期结果
    if (seq !== requestSeq) return

    const data = response.data
    // 页码超出范围（如最后一页数据被删空）时回到最后一页
    if (data.pagination.totalPages > 0 && currentPage.value > data.pagination.totalPages) {
      updateQuery({ page: data.pagination.totalPages })
      return
    }

    articles.value = data.articles
    pagination.value = data.pagination
  } catch (error) {
    if (axiosIsCancel(error) || seq !== requestSeq) return
    console.error('Failed to fetch articles:', error)
    articles.value = []
    pagination.value = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 }
    loadError.value = '文章加载失败，请稍后重试'
  } finally {
    if (seq === requestSeq) {
      loading.value = false
    }
  }
}

function axiosIsCancel(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
}

async function fetchTags() {
  try {
    const response = await api.get('/tags')
    tags.value = response.data.tags
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 仅当影响结果的条件变化时才请求；切换视图等不重复拉取
watch(
  () => [searchQuery.value, selectedTag.value, currentPage.value],
  () => {
    const key = `${searchQuery.value}|${selectedTag.value ?? ''}|${currentPage.value}`
    if (key === lastFetchKey) return
    lastFetchKey = key
    fetchArticles()
  },
  { immediate: true }
)

onMounted(fetchTags)

// page=1、view=card 为默认状态，不写入 URL
const DEFAULT_VALUES = { page: 1, view: 'card' }

function updateQuery(patch) {
  const query = { ...route.query }
  Object.entries(patch).forEach(([key, value]) => {
    const isDefault = key in DEFAULT_VALUES
      ? value === DEFAULT_VALUES[key]
      : !value
    if (isDefault) {
      delete query[key]
    } else {
      query[key] = String(value)
    }
  })
  router.replace({ path: '/', query })
}

// 切换关键词或标签等条件后回到第一页
function handleTagSelect(tag) {
  updateQuery({ tag, page: 1 })
}

function handlePageChange(page) {
  updateQuery({ page })
}

function handleClearSearch() {
  updateQuery({ search: '', page: 1 })
}

function handleClearTag() {
  updateQuery({ tag: null, page: 1 })
}

function handleClearAll() {
  updateQuery({ search: '', tag: null, page: 1 })
}

function handleViewChange(view) {
  updateQuery({ view })
}
</script>

<style scoped>
.home {
  padding-top: 20px;
}

.list-skeleton {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.skeleton-card {
  padding: 12px 0;
}

.skeleton-card + .skeleton-card {
  border-top: 1px solid #ebeef5;
}
</style>

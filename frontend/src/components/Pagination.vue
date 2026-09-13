<template>
  <div class="pagination-wrapper" v-if="total > 0">
    <el-pagination
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  modelValue: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const currentPage = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  currentPage.value = newVal
})

function handlePageChange(page) {
  currentPage.value = page
  emit('update:modelValue', page)
  emit('change', page)
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}
</style>

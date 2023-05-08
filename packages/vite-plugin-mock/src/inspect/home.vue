<script setup lang="ts">
import ky from 'ky'
import { watch, computed, ref } from 'vue'
import { useMockList } from './hooks/useMockList'

const { mockList } = useMockList()

const filterPath = ref('')

const filterMockList = computed(()=>{
  return mockList.value.filter(i => {
    return i.url.includes(filterPath.value)
  })
})

const excludeUrl = computed(()=>{
  return mockList.value.filter(i => !i.include).map(i=> `${i.url}+${i.method || 'get'}`)
})

watch(() => excludeUrl.value, () => {
  ky.post('./exclude', {
    json: {
      "urlList": excludeUrl.value
    }
  })
})


</script>

<template>
  <el-form :inline="true">
    <el-form-item label="Path">
      <el-input v-model="filterPath" clearable></el-input>
    </el-form-item>
  </el-form>
  <el-table :data="filterMockList">
    <el-table-column label="Status">
      <template #default="scope">
        <el-switch :value="scope.row.include" @click="scope.row.include = !scope.row.include"></el-switch>
      </template>
    </el-table-column>
    <el-table-column label="Path" prop="url"></el-table-column>
    <el-table-column label="Method">
      <template #default="scope">
        <el-tag>{{ scope.row.method }}</el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>

</style>

<script setup lang="ts">
import ky from 'ky'
import { computed, ref } from 'vue'
import { MockObj, useMockList } from './hooks/useMockList'

const { mockList, getList } = useMockList()

const filterPath = ref('')

const filterMockList = computed(()=>{
  return mockList.value.filter(i => {
    return i.url.includes(filterPath.value)
  })
})

async function change(mock: MockObj) {
  if(mock.include) {
    mockList.value.map(i => {
      if(i.url === mock.url && i.method === mock.method) {
        i.include = false
        i.exclude = true
      }
    })
  } else {
    mockList.value.map(i => {
      if(i.url === mock.url && i.method === mock.method) {
        i.include = true
        i.exclude = false
      }
    })
  }

  await ky.post('./exclude', {
    json: {
      "urlList": mockList.value.filter(i => i.exclude).map(i => `${i.url}+${i.method || 'get'}`)
    }
  })
  await getList()
}

async function excludeAll() {
  await ky.post('./exclude', {
    json: {
      "urlList": mockList.value.map(i => `${i.url}+${i.method || 'get'}`)
    }
  })
  await getList()
}

async function includeAll() {
  await ky.post('./exclude', {
    json: {
      "urlList": []
    }
  })
  await getList()
}

</script>

<template>
  <div class="sticky top-0 z-10 bg-white mb-2">
    <el-form :inline="true">
      <el-form-item label="Filter">
        <el-input v-model="filterPath" placeholder="Input Path" clearable></el-input>
      </el-form-item>
      <el-form-item label="Other">
        <el-button @click="excludeAll">Exclude All</el-button>
      <el-button @click="includeAll">Include All</el-button>
      </el-form-item>
    </el-form>
    
  </div>
  <el-table :data="filterMockList">
    <el-table-column label="Status" width="200">
      <template #default="scope">
        <el-switch :value="scope.row.include" @click="change(scope.row)"></el-switch>
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

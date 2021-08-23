<template>
  <div class="container">
    <h1>
      <el-link
        type="success"
        href="https://github.com/anncwb/vite-plugin-mock/tree/main/examples/js-example"
        target="_blank"
        class="_link"
        >测试vite-plugin-mock（JS版本）</el-link
      >
    </h1>
    <el-space wrap>
      <el-card class="box-card" v-for="(item, key) in requestLists" :key="key">
        <template #header>
          <div class="card-header">
            <span>{{ item.name }}</span>
            <el-button
              class="button"
              size="mini"
              type="primary"
              plain
              @click="sendRequest(key, item)"
              >Send</el-button
            >
          </div>
        </template>
        <div v-loading="item.show">{{ item.info }}</div>
      </el-card>
    </el-space>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import axios from 'axios'
export default defineComponent({
  name: 'App',
  setup() {
    const requestLists = ref([
      {
        name: 'Get Request',
        info: '暂无数据',
        show: false,
      },
      {
        name: 'Post Request',
        info: '暂无数据',
        show: false,
      },
    ])

    const getRoleById = () => {
      requestLists.value[0].show = true
      axios.get('/api/getRoleById', { params: { id: 1 } }).then(({ data }) => {
        requestLists.value[0].info = data
        requestLists.value[0].show = false
      })
    }

    const createUser = () => {
      requestLists.value[1].show = true
      axios
        .post('/api/createUser', {
          name: 'vben',
          gender: 'man',
        })
        .then(({ data }) => {
          requestLists.value[1].info = data
          requestLists.value[1].show = false
        })
    }

    const sendRequest = (key, item) => {
      key === 0 ? getRoleById() : createUser()
    }

    return {
      requestLists,
      sendRequest,
    }
  },
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
._link {
  font-size: 30px;
}
.box-card {
  width: 360px;
}
.el-space {
  align-items: flex-start !important;
}
</style>

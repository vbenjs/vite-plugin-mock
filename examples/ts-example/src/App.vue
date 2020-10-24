<template>
  <button :style="{ width: '300px' }" @click="getRoleById"> getRoleById</button>
  <br />
  <button @click="createUser"> createUser</button>
</template>

<script>
  import { defineComponent } from 'vue';
  import axios from 'axios';
  export default defineComponent({
    name: 'App',
    setup() {
      const getRoleById = () => {
        axios.get('/api/getRoleById', { params: { id: 1 } }).then((res) => {
          console.log(res);
        });
      };
      const createUser = () => {
        axios
          .post('/api/createUser', {
            name: 'vben',
            gender: 'man',
          })
          .then((res) => {
            console.log(res);
          });
      };
      return {
        getRoleById,
        createUser,
      };
    },
  });
</script>

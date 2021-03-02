<template>
  <div>
    <button :style="{ width: '300px' }" @click="getRoleById"> test get </button>
    <br />
    <button @click="createUser"> test post</button>

    <br />
    <button @click="testPostFormData"> test post form-data</button>
  </div>
</template>

<script>
  import { defineComponent } from 'vue';
  import axios from 'axios';
  export default defineComponent({
    name: 'App',
    setup() {
      const getRoleById = () => {
        axios.get('/api/getRoleById', { params: { id: 2 } }).then((res) => {
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

      const testPostFormData = () => {
        axios
          .post(
            '/api/createUser',
            {
              name: 'vben',
              gender: 'man',
            },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          )
          .then((res) => {
            console.log(res);
          });
      };

      return {
        getRoleById,
        createUser,
        testPostFormData,
      };
    },
  });
</script>

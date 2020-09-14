import { createApp } from 'vue';
import App from './App.vue';
// import { setupProdMockServer } from './mockProdServer';

createApp(App).mount('#app');

// production mock server
// if (process.env.NODE_ENV === 'production') {
//   console.log(111);
//   setupProdMockServer();
// }

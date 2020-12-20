import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.config.productionTip = false

axios.defaults.baseURL = "https://api.mobilecap.kidzinski.com/"

Vue.use(axios)

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')

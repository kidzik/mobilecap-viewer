import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import axios from 'axios'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import HelloWorld from './components/HelloWorld.vue'

Vue.config.productionTip = false

axios.defaults.baseURL = "https://api.mobilecap.kidzinski.com/"

Vue.use(axios)
Vue.use(VueRouter)

const routes = [
  { path: '/', component: HelloWorld },
  { path: '/trial/:trial_id/', component: HelloWorld },
]

const router = new VueRouter({
  routes, // short for `routes: routes`
  mode: 'history',
})

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')

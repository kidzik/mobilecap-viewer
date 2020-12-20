<template>
  <v-app :style="{background: $vuetify.theme.themes.dark.background}">
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        MobileCap
      </div>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/stanfordnmbl/mobilecap"
        target="_blank"
        text
      >
        <span class="mr-2">Find on GitHub</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',

  components: {
  },

  data: () => ({
    //
  }),
};
</script>

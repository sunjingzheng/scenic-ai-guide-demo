<script setup lang="ts">
const antTheme = {
  token: {
    colorPrimary: '#328f62',
    colorInfo: '#54b8bd',
    colorSuccess: '#328f62',
    colorWarning: '#c89438',
    colorError: '#d06464',
    borderRadius: 12,
    fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif'
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 12
    },
    Card: {
      borderRadiusLG: 20
    },
    Tabs: {
      cardBg: '#edf3ee'
    },
    Menu: {
      itemBorderRadius: 14
    }
  }
}
</script>

<template>
  <a-config-provider :theme="antTheme">
    <RouterView />
  </a-config-provider>
</template>

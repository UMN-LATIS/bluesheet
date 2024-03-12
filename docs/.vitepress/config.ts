import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "BlueSheet Help",
  base: "/bluesheet/",
  lastUpdated: true,
  appearance: false, // force light mode. UMN header looks bad in dark mode
  vite: {
    // building the theme will fail without this. Vitepress wants
    // cla-vue-template to be ssr compatible, but it isn't.
    ssr: {
      noExternal: ["@umn-latis/cla-vue-template"],
    },
  },
  themeConfig: {
    sidebar:[ {
      text: 'Reference',
      items: [
        { text: 'Home', link: '/' },
        { text: 'Using Bluesheet', link: '/using-bluesheet' },
        { text: 'Get Help', link: '/get-help' }
      ]
    }],
    socialLinks: [
      { icon: "github", link: "https://github.com/UMN-LATIS/bluesheet" },
    ],
    editLink: {
      pattern:
        "https://github.com/UMN-LATIS/bluesheet/edit/develop/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2019-present Evan You",
    },
    search: {
      provider: "local",
    },
  },
});

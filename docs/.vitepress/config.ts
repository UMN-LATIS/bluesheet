import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "BlueSheet Help",
  base: "/bluesheet/",
  lastUpdated: true,
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
    // algolia: {
    //   appId: "",
    //   apiKey: "",
    //   indexName: "",
    // },
  },
});

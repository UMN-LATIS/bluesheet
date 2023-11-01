import { createStore } from "vuex";
import { axios } from "@/utils";
import { User } from "@/types";

export const store = createStore({
  state: {
    favorites: {
      groups: [],
      roles: [],
    },
    user: null as User | null,
  },
  actions: {
    toggleFavorite({ commit, state }, payload) {
      const type = payload.type;
      const item = payload.item;
      if (state.favorites[type].filter((f) => f.id == item.id).length > 0) {
        axios.delete("/api/user/favorite/" + type + "/" + item.id).then(() => {
          commit("removeFavorite", payload);
        });
      } else {
        axios.post("/api/user/favorite/" + type + "/" + item.id).then(() => {
          commit("addFavorite", payload);
        });
      }
    },
    fetchUser(context) {
      axios.get("/api/user/show").then((response) => {
        context.commit("setUser", response.data);
        context.commit("setFavorites", {
          type: "groups",
          content: response.data.favoriteGroups,
        });
        context.commit("setFavorites", {
          type: "roles",
          content: response.data.favoriteRoles,
        });
      });
    },
  },
  mutations: {
    addFavorite(state, payload) {
      state.favorites[payload.type].push(payload.item);
    },
    removeFavorite(state, payload) {
      state.favorites[payload.type] = state.favorites[payload.type].filter(
        (f) => f.id != payload.item.id,
      );
    },
    setFavorites(state, payload) {
      state.favorites[payload.type] = payload.content;
    },
    setUser(state, payload) {
      state.user = payload;
    },
  },
});

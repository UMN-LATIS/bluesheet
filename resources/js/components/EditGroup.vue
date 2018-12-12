<template>
    <div>
        <p><input class="form-control form-control-lg" type="text" v-model="group.group_title"></p>
        
        <p>Artifacts:</p>
        <div class="form-row" v-for="artifact in group.artifacts">
            <div class="form-group col-md-6">
              <label>Label</label>
              <input type="" v-model="artifact.label" class="form-control" placeholder="Email">
          </div>
          <div class="form-group col-md-6">
              <label for="inputPassword4">Target</label>
              <input  v-model="artifact.target" class="form-control">
          </div>
      </div>
      
  </div>
</template>

<script>
export default {
    props: ['group'],
    data() {
        return {

        }
    },
    mounted() {
    },
    methods: {

    }
}
</script>

<template>
    <div class="sy-baidu-map-webgl">
        <slot />
    </div>
</template>

<script>
    // API
    // 方法
    // 组件

    export default {
        name: 'SyBaiduMapWebgl',
        components: {},
        data() {
            return {
                ready: false
            }
        },
        computed: {
        },
        watch: {
        },
        created() {
        },
        provide() {
            return {
                bmgl: this
            }
        },
        mounted() {
            let map = new BMapGL.Map(this.$el)
            this.map = map
            this.BMapGL = BMapGL
            this.ready = true
            this.$emit('ready', {
                map,
                BMapGL
            })
        },
        beforeDestroy() {

        },
        methods: {

        }
    }
</script>

<style lang="scss" scoped>
.sy-baidu-map-webgl {
    width: 100%;
    height: 100%;
}
</style>

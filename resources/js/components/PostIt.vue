<template>
    <div class="layout--full-width layout layout-container layout--onecol">
        <div class="layout-white-box layout--narrow layout layout-container layout--onecol">
            <div class="layout__region">
                <div class="block">
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout--full-width {
    margin-top: 1em;
}
/*need some help understanding this*/
main .layout {
    min-width: 71.1875em;
}

</style>
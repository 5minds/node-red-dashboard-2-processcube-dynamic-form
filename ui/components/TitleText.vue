<template>
    <div v-if="title.length > 0">
        <h3 :class="typeSpecificStyling" class="ui-dynamic-form-title-responsive"
            style="display: flex; gap: 25px; align-items: center">
            <svg v-if="collapsible && !collapsed" style="width: 25px; height: 25px; cursor: pointer;"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" @click="toggleCollapse">
                <path :fill="style === 'default' ? 'white' : 'black'"
                    d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
            </svg>
            <svg v-if="collapsible && collapsed" style="width: 25px; height: 25px; cursor: pointer;"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" @click="toggleCollapse">
                <path :fill="style === 'default' ? 'white' : 'black'"
                    d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
            </svg>
            <div :style="{ width: 'fit-content', display: style === 'default' ? '' : 'flex' }">
                <img v-if="titleIcon.length > 0" :src="titleIcon" style="padding-right: 16px;">
                <span :style="customStyles">{{ title }}</span>
                <hr v-if="style === 'default'">
            </div>
        </h3>
    </div>
</template>

<script>

export default {
    name: 'UIDynamicFormTitleText',
    props: {
        style: { type: String, default() { return 'default' } },
        title: { type: String, default() { return '' } },
        customStyles: { type: String, default() { return '' } },
        collapsible: { type: Boolean, default() { return false } },
        collapsed: { type: Boolean, default() { return false } },
        titleIcon: { type: String, default() { return '' } },
        toggleCollapse: { type: Function, default() { } }
    },
    computed: {
        typeSpecificStyling() {
            return `ui-dynamic-form-title-${this.style}`
        }
    }
}

</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

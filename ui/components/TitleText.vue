<template>
    <div v-if="title.length > 0">
        <h3 :class="typeSpecificStyling">
            <div style="width: fit-content">
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
        style: { type: String, default () { return 'default' } },
        title: { type: String, default () { return '' } },
        customStyles: { type: String, default () { return '' } },
        titleIcon: { type: String, default () { return '' } }
    },
    computed: {
        typeSpecificStyling () {
            return `ui-dynamic-form-title-${this.style}`
        }
    }
}

</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

<template>
    <div class="ui-dynamic-form-footer-actions-container">
        <div class="ui-dynamic-form-footer-actions-left">
            <div v-for="(action, index) in actions" :key="index">
                <v-btn v-if="action.alignment === 'left' || !action.alignment" :key="index"
                    class="ui-dynamic-form-footer-action-button" :class="getActionButtonClass(action)"
                    :disabled="formIsFinished" @click="actionCallback(action)">
                    {{ action.label }}
                </v-btn>
            </div>
        </div>
        <div class="ui-dynamic-form-footer-actions-right">
            <div v-for="(action, index) in actions" :key="index">
                <v-btn v-if="action.alignment === 'right'" :key="index" class="ui-dynamic-form-footer-action-button"
                    :class="getActionButtonClass(action)" :disabled="formIsFinished" @click="actionCallback(action)">
                    {{ action.label }}
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'UIDynamicFormFooterAction',
    props: {
        actions: { type: Array, default() { return [] } },
        actionCallback: { type: Function, default(action) { } },
        formIsFinished: { type: Boolean, default() { return false } }
    },
    methods: {
        getActionButtonClass(action) {
            return action.primary === 'true' ? 'ui-dynamic-form-footer-action-primary' : 'ui-dynamic-form-footer-action-secondary'
        }
    }
}

</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

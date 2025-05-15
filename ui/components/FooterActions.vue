<template>
    <div style="display: flex; justify-content: space-between; width: 100%">
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <div v-for="(action, index) in actions" :key="index">
                <v-btn
                    v-if="action.alignment === 'left' || !action.alignment"
                    :key="index"
                    style="min-height: 36px"
                    :class="getActionButtonClass(action)"
                    :disabled="formIsFinished"
                    @click="actionCallback(action)"
                >
                    {{ action.label }}
                </v-btn>
            </div>
        </div>
        <div style="display: flex; gap: 8px;">
            <div v-for="(action, index) in actions" :key="index">
                <v-btn
                    v-if="action.alignment === 'right'"
                    :key="index"
                    style="min-height: 36px"
                    :class="getActionButtonClass(action)"
                    :disabled="formIsFinished"
                    @click="actionCallback(action)"
                >
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
        actions: { type: Array, default () { return [] } },
        actionCallback: { type: Function, default (action) {} },
        formIsFinished: { type: Boolean, default () { return false } }
    },
    methods: {
        getActionButtonClass (action) {
            return action.primary === 'true' ? 'ui-dynamic-form-footer-action-primary' : 'ui-dynamic-form-footer-action-secondary'
        }
    }
}

</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

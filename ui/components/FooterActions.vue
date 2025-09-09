<template>
  <div class="ui-dynamic-form-footer-actions-container">
    <div class="ui-dynamic-form-footer-actions-left">
      <div v-for="(action, index) in leftSideActions" :key="`left-${index}`">
        <v-btn
          class="ui-dynamic-form-footer-action-button"
          :class="getActionButtonClass(action)"
          :disabled="formIsFinished"
          @click="actionCallback(action)"
        >
          {{ action.label }}
        </v-btn>
      </div>
    </div>
    <div class="ui-dynamic-form-footer-actions-right">
      <div v-for="(action, index) in rightSideActions" :key="`right-${index}`">
        <v-btn
          class="ui-dynamic-form-footer-action-button"
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
    actions: {
      type: Array,
      default() {
        return [];
      },
    },
    actionCallback: { type: Function, default(action) {} },
    formIsFinished: {
      type: Boolean,
      default() {
        return false;
      },
    },
  },
  computed: {
    leftSideActions() {
      const leftActions = this.actions.filter((action) => action.alignment === 'left' || !action.alignment);
      const sortPrimaryToLeft = (a, b) => {
        const aPrimary = a.primary === 'primary';
        const bPrimary = b.primary === 'primary';
        if (aPrimary && !bPrimary) return -1;
        if (!aPrimary && bPrimary) return 1;
        return 0;
      };

      return leftActions.sort(sortPrimaryToLeft);
    },
    rightSideActions() {
      const rightActions = this.actions.filter((action) => action.alignment === 'right');
      const sortPrimaryToRight = (a, b) => {
        const aPrimary = a.primary === 'primary';
        const bPrimary = b.primary === 'primary';
        if (!aPrimary && bPrimary) return -1;
        if (aPrimary && !bPrimary) return 1;
        return 0;
      };

      return rightActions.sort(sortPrimaryToRight);
    },
  },
  methods: {
    getActionButtonClass(action) {
      switch (action.primary) {
        case 'primary':
          return 'ui-dynamic-form-footer-action-primary';
        case 'destructive':
          return 'ui-dynamic-form-footer-action-terminate';
        case 'secondary':
        default:
          return 'ui-dynamic-form-footer-action-secondary';
      }
    },
  },
};
</script>

<style>
@import '../stylesheets/ui-dynamic-form.css';
</style>

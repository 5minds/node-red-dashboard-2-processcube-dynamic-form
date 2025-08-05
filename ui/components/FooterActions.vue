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
      <div>
        <v-btn
          class="ui-dynamic-form-footer-action-button ui-dynamic-form-footer-action-secondary"
          :disabled="formIsFinished"
          @click="handleSuspend"
        >
          Suspend
        </v-btn>
      </div>
      <div>
        <v-btn
          class="ui-dynamic-form-footer-action-terminate"
          :disabled="formIsFinished"
          @click="handleTerminate"
          variant="text"
          size="small"
        >
          Terminate
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
        const aPrimary = a.primary === 'true';
        const bPrimary = b.primary === 'true';
        if (aPrimary && !bPrimary) return -1;
        if (!aPrimary && bPrimary) return 1;
        return 0;
      };

      return leftActions.sort(sortPrimaryToLeft);
    },
    rightSideActions() {
      const rightActions = this.actions.filter((action) => action.alignment === 'right');
      const sortPrimaryToRight = (a, b) => {
        const aPrimary = a.primary === 'true';
        const bPrimary = b.primary === 'true';
        if (!aPrimary && bPrimary) return -1;
        if (aPrimary && !bPrimary) return 1;
        return 0;
      };

      return rightActions.sort(sortPrimaryToRight);
    },
  },
  methods: {
    getActionButtonClass(action) {
      return action.primary === 'true'
        ? 'ui-dynamic-form-footer-action-primary'
        : 'ui-dynamic-form-footer-action-secondary';
    },
    handleTerminate() {
      const terminateAction = {
        label: 'Terminate',
        alignment: 'left',
        primary: 'false',
        isTerminate: true,
      };

      this.actionCallback(terminateAction);
    },
    handleSuspend() {
      const suspendAction = {
        label: 'Suspend',
        alignment: 'left',
        primary: 'false',
        isSuspend: true,
      };

      this.actionCallback(suspendAction);
    },
  },
};
</script>

<style>
@import '../stylesheets/ui-dynamic-form.css';
</style>

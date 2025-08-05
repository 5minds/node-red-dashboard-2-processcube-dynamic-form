<template>
  <div className="ui-dynamic-form-external-sizing-wrapper" :style="props.card_size_styling">
    <UIDynamicFormTitleText
      v-if="props.title_style === 'outside' && hasUserTask"
      :style="props.title_style"
      :title="effectiveTitle"
      :customStyles="props.title_custom_text_styling"
      :titleIcon="props.title_icon"
      :collapsible="props.collapsible || (props.collapse_when_finished && formIsFinished)"
      :collapsed="collapsed"
      :toggleCollapse="toggleCollapse"
    />
    <div className="ui-dynamic-form-wrapper">
      <p v-if="hasUserTask" style="margin-bottom: 0px">
        <v-form ref="form" v-model="form" :class="dynamicClass">
          <UIDynamicFormTitleText
            v-if="props.title_style != 'outside'"
            :style="props.title_style"
            :title="effectiveTitle"
            :customStyles="props.title_custom_text_styling"
            :titleIcon="props.title_icon"
            :collapsible="props.collapsible || (props.collapse_when_finished && formIsFinished)"
            :collapsed="collapsed"
            :toggleCollapse="toggleCollapse"
          />
          <Transition name="cardCollapse">
            <div v-if="!collapsed">
              <div
                className="ui-dynamic-form-formfield-positioner"
                :style="props.inner_card_styling"
                :data-columns="props.form_columns || 1"
              >
                <FormKit id="form" type="group">
                  <v-row
                    v-for="(field, index) in fields()"
                    :key="field"
                    :class="field.type === 'header' ? 'ui-dynamic-form-header-row' : ''"
                    :style="getRowWidthStyling(field, index)"
                  >
                    <v-col cols="12">
                      <component
                        :is="createComponent(field).type"
                        v-if="createComponent(field).innerHTML"
                        v-bind="createComponent(field).props"
                        :class="createComponent(field).class"
                        v-html="createComponent(field).innerHTML"
                        :ref="
                          (el) => {
                            if (index === 0) firstFormFieldRef = el;
                          }
                        "
                      />
                      <component
                        :is="createComponent(field).type"
                        v-else-if="createComponent(field).innerText"
                        v-bind="createComponent(field).props"
                        :ref="
                          (el) => {
                            if (index === 0) firstFormFieldRef = el;
                          }
                        "
                        v-model="formData[field.id]"
                      >
                        {{ createComponent(field).innerText }}
                      </component>
                      <div v-else-if="createComponent(field).type == 'v-slider'">
                        <p class="formkit-label">{{ field.label }}</p>
                        <component
                          :is="createComponent(field).type"
                          v-bind="createComponent(field).props"
                          :ref="
                            (el) => {
                              if (index === 0) firstFormFieldRef = el;
                            }
                          "
                          v-model="field.defaultValue"
                        />
                        <p class="formkit-help">
                          {{ field.customForm ? field.customForm.hint : undefined }}
                        </p>
                      </div>
                      <component
                        :is="createComponent(field).type"
                        v-else
                        v-bind="createComponent(field).props"
                        :ref="
                          (el) => {
                            if (index === 0) firstFormFieldRef = el;
                          }
                        "
                        v-model="formData[field.id]"
                      />
                    </v-col>
                  </v-row>
                </FormKit>
              </div>
              <v-row :class="dynamicFooterClass">
                <v-row v-if="errorMsg.length > 0" style="padding: 12px">
                  <v-alert type="error">Error: {{ errorMsg }}</v-alert>
                </v-row>
                <UIDynamicFormFooterAction
                  v-if="props.actions_inside_card && hasUserTask"
                  :actions="actions"
                  :actionCallback="actionFn"
                  :formIsFinished="formIsFinished"
                  style="padding: 16px; padding-top: 0px"
                />
              </v-row>
            </div>
          </Transition>
        </v-form>
      </p>
      <p v-else>
        <v-alert
          v-if="props.waiting_info.length > 0 || props.waiting_title.length > 0"
          :text="props.waiting_info"
          :title="props.waiting_title"
        />
      </p>
    </div>
    <div v-if="!props.actions_inside_card && hasUserTask" style="padding-top: 32px">
      <UIDynamicFormFooterAction :actions="actions" :actionCallback="actionFn" />
    </div>
  </div>
</template>

<script>
import { de } from '@formkit/i18n';
import { FormKit, defaultConfig, plugin } from '@formkit/vue';
import { getCurrentInstance, markRaw, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import '@formkit/themes/genesis';
import UIDynamicFormFooterAction from './FooterActions.vue';
import UIDynamicFormTitleText from './TitleText.vue';

function requiredIf({ value }, [targetField, expectedValue], node) {
  console.debug(arguments);

  const actual = node?.root?.value?.[targetField];
  const isEmpty = value === '' || value === null || value === undefined;

  if (actual === expectedValue && isEmpty) {
    return false;
  }

  return true;
}

class MarkdownRenderer extends marked.Renderer {
  link(params) {
    const link = super.link(params);
    return link.replace('<a', "<a target='_blank'");
  }

  html(params) {
    const result = super.html(params);
    if (result.startsWith('<a ') && !result.includes('target=')) {
      return result.replace('<a ', `<a target="_blank" `);
    }
    return result;
  }
}

class MarkedHooks extends marked.Hooks {
  postprocess(html) {
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  }
}

function processMarkdown(content) {
  if (!content) return '';

  const html = marked.parse(content.toString(), {
    renderer: new MarkdownRenderer(),
    hooks: new MarkedHooks(),
  });

  return html;
}

export default {
  name: 'UIDynamicForm',
  components: {
    FormKit,
    UIDynamicFormFooterAction,
    UIDynamicFormTitleText,
  },
  inject: ['$socket'],
  props: {
    id: { type: String, required: true },
    props: { type: Object, default: () => ({}) },
    state: {
      type: Object,
      default: () => ({ enabled: false, visible: false }),
    },
  },
  setup(props) {
    console.info('UIDynamicForm setup with:', props);
    console.debug('Vue function loaded correctly', markRaw);

    const instance = getCurrentInstance();
    const app = instance.appContext.app;

    const formkitConfig = defaultConfig({
      theme: 'genesis',
      locales: { de },
      locale: 'de',
      rules: { requiredIf: requiredIf },
    });
    app.use(plugin, formkitConfig);
  },
  data() {
    return {
      actions: [],
      formData: {},
      userTask: null,
      theme: '',
      errorMsg: '',
      formIsFinished: false,
      msg: null,
      collapsed: false,
      firstFormFieldRef: null,
    };
  },
  computed: {
    dynamicClass() {
      return `ui-dynamic-form-${this.theme} ui-dynamic-form-common`;
    },
    dynamicFooterClass() {
      return `ui-dynamic-form-footer-${this.theme} ui-dynamic-form-footer-common`;
    },
    hasUserTask() {
      return !!this.userTask;
    },
    totalOutputs() {
      const outputsConfirmTerminate = 2;
      return (
        this.props.options.length +
        (this.props.handle_confirmation_dialogs ? 2 : 0) +
        (this.props.trigger_on_change ? 1 : 0) +
        outputsConfirmTerminate
      );
    },
    isConfirmDialog() {
      return this.userTask.userTaskConfig.formFields.some((field) => field.type === 'confirm');
    },
    effectiveTitle() {
      if (this.props.title_text_type === 'str') {
        return this.props.title_text;
      } else if (this.props.title_text_type === 'msg') {
        return this.msg.dynamicTitle;
      } else {
        return '';
      }
    },
  },
  watch: {
    formData: {
      handler(newData, oldData) {
        if (this.props.trigger_on_change) {
          const res = { payload: { formData: newData, userTask: this.userTask } };
          this.send(res, this.totalOutputs - 1);
        }
      },
      collapsed(newVal) {
        if (!newVal && this.hasUserTask) {
          nextTick(() => {
            this.focusFirstFormField();
          });
        }
      },
      userTask(newVal) {
        if (newVal && !this.collapsed) {
          nextTick(() => {
            this.focusFirstFormField();
          });
        }
      },
      deep: true,
    },
  },
  created() {
    const currentPath = window.location.pathname;
    const lastPart = currentPath.substring(currentPath.lastIndexOf('/'));

    const store = this.$store.state;

    for (const key in store.ui.pages) {
      if (store.ui.pages[key].path === lastPart) {
        const theme = store.ui.pages[key].theme;
        if (store.ui.themes[theme].name === 'ProcessCube Lightmode') {
          this.theme = 'light';
        } else if (store.ui.themes[theme].name === 'ProcessCube Darkmode') {
          this.theme = 'dark';
        } else {
          this.theme = 'default';
        }
        break;
      }
    }
  },
  mounted() {
    const elements = document.querySelectorAll('.formkit-input');

    elements.forEach((element) => {
      element.classList.add('test');
    });

    this.$socket.on('widget-load:' + this.id, (msg) => {
      this.init(msg);
    });
    this.$socket.on('msg-input:' + this.id, (msg) => {
      this.init(msg);
    });
    this.$socket.emit('widget-load', this.id);
  },
  unmounted() {
    this.$socket?.off('widget-load' + this.id);
    this.$socket?.off('msg-input:' + this.id);
  },
  methods: {
    createComponent(field) {
      const customForm = field.customForm ? JSON.parse(JSON.stringify(field.customForm)) : {};
      const hint = customForm.hint;
      const placeholder = customForm.placeholder;
      const validation = customForm.validation;
      const name = field.id;
      const customProperties = customForm.customProperties ?? [];
      const isReadOnly =
        this.props.readonly ||
        this.formIsFinished ||
        customProperties.find((entry) => ['readOnly', 'readonly'].includes(entry.name) && entry.value === 'true')
          ? 'true'
          : undefined;
      switch (field.type) {
        case 'long':
          return {
            type: 'FormKit',
            props: {
              type: 'number',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              number: 'integer',
              min: 0,
              validation: validation ? `${validation}|number` : 'number',
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validationVisibility: 'live',
            },
          };
        case 'number':
          const step = field.customForm ? JSON.parse(JSON.stringify(field.customForm)).step : undefined;
          return {
            type: 'FormKit',
            props: {
              type: 'number',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              step,
              number: 'float',
              validation: validation ? `${validation}|number` : 'number',
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validationVisibility: 'live',
            },
          };
        case 'date':
          return {
            type: 'FormKit',
            props: {
              type: 'date',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'enum':
          const enums = field.enumValues.map((obj) => {
            return { value: obj.id, label: obj.name };
          });
          return {
            type: 'FormKit',
            props: {
              type: 'select',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              options: enums,
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'select':
          const selections = JSON.parse(JSON.stringify(field.customForm)).entries.map((obj) => {
            return { value: obj.key, label: obj.value };
          });
          return {
            type: 'FormKit',
            props: {
              type: 'select',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              options: selections,
              placeholder,
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'string':
          return {
            type: 'FormKit',
            props: {
              type: 'text',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'confirm':
          return {
            type: 'h3',
            innerText: field.label,
          };
        case 'boolean':
          return {
            type: 'FormKit',
            props: {
              type: 'checkbox',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'file':
          const multiple = field.customForm ? JSON.parse(JSON.stringify(field.customForm)).multiple === 'true' : false;
          return {
            type: 'FormKit',
            props: {
              type: 'file',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              innerClass: 'reset-background',
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              multiple,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'checkbox':
          const options = JSON.parse(JSON.stringify(field.customForm)).entries.map((obj) => {
            return { value: obj.key, label: obj.value };
          });
          return {
            type: 'FormKit',
            props: {
              type: 'checkbox',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              options,
              help: hint,
              fieldsetClass: 'custom-fieldset',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'color':
          return {
            type: 'FormKit',
            props: {
              type: 'color',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'datetime-local':
          return {
            type: 'FormKit',
            props: {
              type: 'datetime-local',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'email':
          return {
            type: 'FormKit',
            props: {
              type: 'email',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'header':
          let typeToUse = 'h1';
          if (field.customForm && JSON.parse(JSON.stringify(field.customForm)).style === 'heading_2') {
            typeToUse = 'h2';
          }
          if (field.customForm && JSON.parse(JSON.stringify(field.customForm)).style === 'heading_3') {
            typeToUse = 'h3';
          }
          return {
            type: typeToUse,
            innerText: this.formData[field.id],
          };
        case 'hidden':
          return {
            type: 'input',
            props: {
              type: 'hidden',
              value: this.formData[field.id],
            },
          };
        case 'month':
          return {
            type: 'FormKit',
            props: {
              type: 'month',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'paragraph':
          const paragraphContent = this.formData[field.id] || field.defaultValue || field.label || '';
          const processedHtml = processMarkdown(paragraphContent);
          return {
            type: 'div',
            innerHTML: processedHtml,
            class: 'ui-dynamic-form-paragraph',
          };
        case 'password':
          return {
            type: 'FormKit',
            props: {
              type: 'password',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'radio':
          const radioOptions = JSON.parse(JSON.stringify(field.customForm)).entries.map((obj) => {
            return { value: obj.key, label: obj.value };
          });
          return {
            type: 'FormKit',
            props: {
              type: 'radio',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              options: radioOptions,
              help: hint,
              fieldsetClass: 'custom-fieldset',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'range':
          const customForm = JSON.parse(JSON.stringify(field.customForm));
          return {
            type: 'v-slider',
            props: {
              id: field.id,
              name,
              required: field.required,
              min: customForm.min,
              max: customForm.max,
              step: customForm.step,
              thumbLabel: true,
              labelClass: 'ui-dynamic-form-input-label',
              readonly: isReadOnly,
              disabled: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'tel':
          return {
            type: 'FormKit',
            props: {
              type: 'tel',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'textarea':
          const rows = field.customForm ? JSON.parse(JSON.stringify(field.customForm)).rows : undefined;
          return {
            type: 'FormKit',
            props: {
              type: 'textarea',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              rows,
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'time':
          return {
            type: 'FormKit',
            props: {
              type: 'time',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'url':
          return {
            type: 'FormKit',
            props: {
              type: 'url',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        case 'week':
          return {
            type: 'FormKit',
            props: {
              type: 'week',
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              placeholder,
              wrapperClass: '$remove:formkit-wrapper',
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
        default:
          return {
            type: 'FormKit',
            props: {
              type: field.type,
              id: field.id,
              name,
              label: field.label,
              required: field.required,
              value: this.formData[field.id],
              help: hint,
              labelClass: 'ui-dynamic-form-input-label',
              inputClass: `input-${this.theme}`,
              innerClass: `ui-dynamic-form-input-outlines ${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
              readonly: isReadOnly,
              validation,
              validationVisibility: 'live',
            },
          };
      }
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },
    getRowWidthStyling(field, index) {
      let style = '';
      if (index === 0) {
        style += 'margin-top: 12px;';
      }
      if (field.type === 'header') {
        style += 'flex-basis: 100%;';
      } else {
        style += `flex-basis: 100%;`;
      }
      return style;
    },
    fields() {
      const aFields = this.userTask.userTaskConfig?.formFields ?? [];
      const fieldMap = aFields.map((field) => ({
        ...field,
        items: mapItems(field.type, field),
      }));

      return fieldMap;
    },
    send(msg, index) {
      const msgArr = [];
      msgArr[index] = msg;
      this.$socket.emit('widget-action', this.id, msgArr);
    },
    init(msg) {
      this.msg = msg;
      if (!msg) {
        return;
      }

      this.actions = this.props.options;

      const hasTask = msg.payload && msg.payload.userTask;

      if (hasTask) {
        this.userTask = msg.payload.userTask;
      } else {
        this.userTask = null;
        this.formData = {};
        return;
      }

      const formFields = this.userTask.userTaskConfig.formFields;
      const formFieldIds = formFields.map((ff) => ff.id);
      const initialValues = this.userTask.startToken;
      const finishedFormData = msg.payload.formData;
      this.formIsFinished = !!msg.payload.formData;
      if (this.formIsFinished) {
        this.collapsed = this.props.collapse_when_finished;
      }

      if (formFields) {
        formFields.forEach((field) => {
          this.formData[field.id] = field.defaultValue;

          if (field.type === 'confirm') {
            const customForm = field.customForm ? JSON.parse(JSON.stringify(field.customForm)) : {};
            const confirmText = customForm.confirmButtonText ?? 'Confirm';
            const declineText = customForm.declineButtonText ?? 'Decline';
            const confirmActions = [
              {
                alignment: 'left',
                primary: 'true',
                label: confirmText,
                condition: '',
                isConfirmAction: true,
                confirmFieldId: field.id,
                confirmValue: true,
              },
              {
                alignment: 'left',
                primary: 'true',
                label: declineText,
                condition: '',
                isConfirmAction: true,
                confirmFieldId: field.id,
                confirmValue: false,
              },
            ];
            if (this.props.handle_confirmation_dialogs) {
              this.actions = confirmActions;
            } else {
              this.actions = [...this.actions, ...confirmActions];
            }
          }
        });
      }

      if (initialValues) {
        Object.keys(initialValues)
          .filter((key) => formFieldIds.includes(key))
          .forEach((key) => {
            this.formData[key] = initialValues[key];
          });
      }

      if (this.formIsFinished) {
        Object.keys(finishedFormData)
          .filter((key) => formFieldIds.includes(key))
          .forEach((key) => {
            this.formData[key] = finishedFormData[key];
          });
      }

      nextTick(() => {
        this.focusFirstFormField();
      });
    },
    actionFn(action) {
      if (action.isTerminate) {
        this.showError('');

        const msg = this.msg ?? {};
        msg.payload = {
          formData: this.formData,
          userTask: this.userTask,
          isTerminate: true,
        };

        const terminateOutputIndex = this.totalOutputs - 1;

        this.send(msg, terminateOutputIndex);
        return;
      }

      if (action.isSuspend) {
        this.showError('');

        const msg = this.msg ?? {};
        msg.payload = {
          formData: this.formData,
          userTask: this.userTask,
          isSuspend: true,
        };

        const suspendOutputIndex = this.totalOutputs - 2;

        this.send(msg, suspendOutputIndex);
        return;
      }

      if (action.isConfirmAction && action.confirmFieldId) {
        this.formData[action.confirmFieldId] = action.confirmValue;
      }

      if (action.label === 'Speichern' || action.label === 'Speichern und nächster') {
        const formkitInputs = this.$refs.form.$el.querySelectorAll('.formkit-outer');
        let allComplete = true;

        formkitInputs.forEach((input) => {
          const dataComplete = input.getAttribute('data-complete');
          const dataInvalid = input.getAttribute('data-invalid');

          if (dataComplete == null && dataInvalid === 'true') {
            allComplete = false;
          }
        });

        if (!allComplete) return;
      }

      if (this.checkCondition(action.condition)) {
        this.showError('');

        const processedFormData = { ...this.formData };
        const formFields = this.userTask.userTaskConfig.formFields;

        formFields.forEach((field) => {
          const fieldValue = processedFormData[field.id];

          if (field.type === 'number' || field.type === 'long') {
            if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
              if (field.type === 'long') {
                const intValue = Number.parseInt(fieldValue, 10);
                if (!isNaN(intValue)) {
                  processedFormData[field.id] = intValue;
                }
              } else {
                const numValue = Number.parseFloat(fieldValue);
                if (!isNaN(numValue)) {
                  processedFormData[field.id] = numValue;
                }
              }
            }
          }
        });

        const msg = this.msg ?? {};
        msg.payload = { formData: processedFormData, userTask: this.userTask };
        this.send(
          msg,
          this.actions.findIndex((element) => element.label === action.label) +
            (this.isConfirmDialog ? this.props.options.length : 0)
        );
      } else {
        this.showError(action.errorMessage);
      }
    },
    checkCondition(condition) {
      if (condition === '') return true;
      try {
        const func = Function('fields', 'userTask', 'msg', '"use strict"; return (' + condition + ')');
        const result = func(this.formData, this.userTask, this.msg);
        return Boolean(result);
      } catch (err) {
        console.error('Error while evaluating condition: ' + err);
        return false;
      }
    },
    showError(errMsg) {
      this.errorMsg = errMsg;
    },
    focusFirstFormField() {
      if (this.collapsed || !this.hasUserTask) {
        return;
      }

      if (this.firstFormFieldRef) {
        let inputElement = null;

        if (this.firstFormFieldRef.node && this.firstFormFieldRef.node.input instanceof HTMLElement) {
          inputElement = this.firstFormFieldRef.node.input;
        } else if (this.firstFormFieldRef.$el instanceof HTMLElement) {
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(this.firstFormFieldRef.$el.tagName)) {
            inputElement = this.firstFormFieldRef.$el;
          } else {
            inputElement = this.firstFormFieldRef.$el.querySelector('input:not([type="hidden"]), textarea, select');
          }
        }

        if (inputElement) {
          inputElement.focus();
        } else {
          console.warn('Could not find a focusable input element for the first form field.');
        }
      }
    },
  },
};

function mapItems(type, field) {
  if (type === 'enum') {
    return field.enumValues.map((enumValue) => ({
      title: enumValue.name,
      value: enumValue.id,
    }));
  } else {
    return null;
  }
}
</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

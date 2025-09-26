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
                      <div v-else-if="createComponent(field).isFileField" class="ui-dynamic-form-file-wrapper">
                        <div v-if="getFilePreviewsForField(field.id).length > 0" class="ui-dynamic-form-image-previews">
                          <h4>Current files:</h4>
                          <div class="ui-dynamic-form-preview-grid">
                            <div
                              v-for="preview in getFilePreviewsForField(field.id)"
                              :key="preview.name"
                              class="ui-dynamic-form-preview-item"
                            >
                              <img
                                :src="preview.url"
                                :alt="preview.name"
                                class="ui-dynamic-form-preview-image"
                                @click="openImageModal(preview)"
                              />
                              <div class="ui-dynamic-form-preview-info">
                                <span class="ui-dynamic-form-preview-name">{{ preview.name }}</span>
                                <span class="ui-dynamic-form-preview-size">{{ formatFileSize(preview.size) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <FormKit
                          type="file"
                          :id="field.id"
                          :name="createComponent(field).name"
                          :label="field.label"
                          :required="field.required"
                          v-model="formData[field.id]"
                          :help="createComponent(field).hint"
                          innerClass="reset-background"
                          wrapperClass="$remove:formkit-wrapper"
                          labelClass="ui-dynamic-form-input-label"
                          :inputClass="`input-${theme}`"
                          :readonly="createComponent(field).isReadOnly"
                          :disabled="createComponent(field).isReadOnly"
                          :multiple="createComponent(field).multiple"
                          :validation="createComponent(field).validation"
                          validationVisibility="live"
                          :ref="
                            (el) => {
                              if (index === 0) firstFormFieldRef = el;
                            }
                          "
                        />
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
                  v-if="props.actions_inside_card && hasUserTask && actions.length > 0"
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
    <div v-if="!props.actions_inside_card && hasUserTask && actions.length > 0" style="padding-top: 32px">
      <UIDynamicFormFooterAction :actions="actions" :actionCallback="actionFn" />
    </div>

    <v-dialog v-model="imageModalOpen" max-width="800px">
      <v-card v-if="modalImage">
        <v-card-title class="headline">{{ modalImage.name }}</v-card-title>
        <v-card-text>
          <img
            :src="modalImage.url"
            :alt="modalImage.name"
            style="width: 100%; max-height: 70vh; object-fit: contain"
          />
          <div style="margin-top: 16px">
            <strong>Size:</strong> {{ formatFileSize(modalImage.size) }}<br />
            <strong>Type:</strong> {{ modalImage.type }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeImageModal">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

function normalizeCustomForm(input, defaultValue = {}) {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return defaultValue;
    }
  }
  if (typeof input === "object" && input !== null) {
    return { ...input };
  }
  return defaultValue;
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
      originalFileData: {},
      userTask: null,
      theme: '',
      errorMsg: '',
      formIsFinished: false,
      msg: null,
      collapsed: false,
      firstFormFieldRef: null,
      imageModalOpen: false,
      modalImage: null,
      objectUrlsByField: {},
      previewCache: {},
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
      const confirmOutputs = this.props.handle_confirmation_dialogs
        ? this.props.confirm_actions
          ? this.props.confirm_actions.length
          : 2
        : 0;
      return this.props.options.length + confirmOutputs + (this.props.trigger_on_change ? 1 : 0);
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
        if (!oldData) return;

        if (this.userTask && this.userTask.userTaskConfig && this.userTask.userTaskConfig.formFields) {
          const fileFields = this.userTask.userTaskConfig.formFields.filter((field) => field.type === 'file');

          fileFields.forEach((field) => {
            const fieldId = field.id;
            const newValue = newData[fieldId];
            const oldValue = oldData[fieldId];

            if (newValue !== oldValue && this.originalFileData[fieldId]) {
              const hasNewFiles = this.hasActualFileObjects(newValue);

              if (hasNewFiles) {
                delete this.originalFileData[fieldId];

                Object.keys(this.previewCache).forEach((key) => {
                  if (key.startsWith(fieldId + '_')) {
                    delete this.previewCache[key];
                  }
                });

                this.cleanupObjectUrls(fieldId);
              }
            }
          });
        }

        if (this.props.trigger_on_change) {
          const res = { payload: { formData: newData, userTask: this.userTask } };
          this.send(res, this.totalOutputs - 1);
        }
      },
      deep: true,
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

    this.$socket.on('msg-input:' + this.id, (msg) => {
      this.init(msg);
    });
    this.$socket.emit('widget-load', this.id);
  },
  unmounted() {
    this.$socket?.off('msg-input:' + this.id);
    this.cleanupObjectUrls();
  },
  methods: {
    createComponent(field) {  
      //const customForm = field.customForm ? JSON.parse(JSON.stringify(field.customForm)) : {};
      const customForm = normalizeCustomForm(field.customForm, {});
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
          const step = normalizeCustomForm(field.customForm).step;
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
          const selections = normalizeCustomForm(field.customForm, { entries: [] }).entries.map((obj) => {
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
          const multiple = normalizeCustomForm(field.customForm, { multiple: false }).multiple === true;
          return {
            type: 'div',
            props: {
              class: 'ui-dynamic-form-file-wrapper',
            },
            isFileField: true,
            field: field,
            multiple: multiple,
            isReadOnly: isReadOnly,
            hint: hint,
            validation: validation,
            name: name,
          };
        case 'checkbox':
          const options = normalizeCustomForm(field.customForm, { entries: [] }).entries.map((obj) => {
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
          const normalizedCustomForm = normalizeCustomForm(field.customForm);
          if (normalizedCustomForm && normalizedCustomForm.style === 'heading_2') {
            typeToUse = 'h2';
          }
          if (normalizedCustomForm && normalizedCustomForm.style === 'heading_3') {
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
          const normalizedRadioForm = normalizeCustomForm(field.customForm, { entries: [] });
          const radioOptions = normalizedRadioForm.entries.map((obj) => {
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
          const customForm = normalizeCustomForm(field.customForm);
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
          const rows = normalizeCustomForm(field.customForm, {}).rows;
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

      this.originalFileData = {};
      this.previewCache = {};
      this.cleanupObjectUrls();
      this.actions = this.props.options;

      const hasTask = msg.payload && msg.payload.userTask;

      if (hasTask) {
        this.userTask = msg.payload.userTask;
      } else {
        this.userTask = null;
        this.formData = {};
        this.originalFileData = {};
        this.cleanupObjectUrls();
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

      const hasConfirmField = formFields.some((field) => field.type === 'confirm');

      if (formFields) {
        formFields.forEach((field) => {
          this.formData[field.id] = field.defaultValue;

          if (field.type === 'confirm') {
            const customForm = normalizeCustomForm(field.customForm, {});
            const confirmText = customForm.confirmButtonText ?? 'Confirm';
            const declineText = customForm.declineButtonText ?? 'Decline';

            const confirmActions = [
              {
                alignment: this.props.confirm_actions[1]?.alignment || 'left',
                primary: this.props.confirm_actions[1]?.primary || 'destructive',
                label: declineText,
                condition: '',
                isConfirmAction: true,
                confirmFieldId: field.id,
                confirmValue: false,
              },
              {
                alignment: this.props.confirm_actions[0]?.alignment || 'right',
                primary: this.props.confirm_actions[0]?.primary || 'primary',
                label: confirmText,
                condition: '',
                isConfirmAction: true,
                confirmFieldId: field.id,
                confirmValue: true,
              },
            ];

            const filteredActions = this.props.options.filter((action) => {
              if (!action.condition) return true;
              try {
                const usertaskWithContext = {
                  ...this.userTask,
                  isConfirmDialog: true,
                };
                const func = Function('fields', 'usertask', 'msg', '"use strict"; return (' + action.condition + ')');
                const result = func(this.formData, usertaskWithContext, this.msg);
                return Boolean(result);
              } catch (err) {
                console.error('Error while evaluating condition: ' + err);
                return false;
              }
            });

            this.actions = [...filteredActions, ...confirmActions];
          }
        });
      }

      if (!hasConfirmField && this.props.handle_confirmation_dialogs) {
        this.actions = this.props.options.filter((action) => {
          if (!action.condition) return true;
          try {
            const usertaskWithContext = {
              ...this.userTask,
              isConfirmDialog: false,
            };
            const func = Function('fields', 'usertask', 'msg', '"use strict"; return (' + action.condition + ')');
            const result = func(this.formData, usertaskWithContext, this.msg);
            return Boolean(result);
          } catch (err) {
            console.error('Error while evaluating condition: ' + err);
            return false;
          }
        });
      }

      if (initialValues) {
        Object.keys(initialValues)
          .filter((key) => formFieldIds.includes(key))
          .forEach((key) => {
            const field = formFields.find((f) => f.id === key);
            if (field && field.type === 'file') {
              this.formData[key] = this.transformBase64ToFormKitFormat(initialValues[key], field);
            } else {
              this.formData[key] = initialValues[key];
            }
          });
      }

      if (this.formIsFinished) {
        Object.keys(finishedFormData)
          .filter((key) => formFieldIds.includes(key))
          .forEach((key) => {
            const field = formFields.find((f) => f.id === key);
            if (field && field.type === 'file') {
              this.formData[key] = this.transformBase64ToFormKitFormat(finishedFormData[key], field);
            } else {
              this.formData[key] = finishedFormData[key];
            }
          });
      }

      nextTick(() => {
        this.focusFirstFormField();
      });
    },
    async actionFn(action) {
      if (action.isConfirmAction && action.confirmFieldId) {
        this.formData[action.confirmFieldId] = action.confirmValue;
      }

      if (this.checkCondition(action.condition, { isConfirmDialog: this.isConfirmDialog })) {
        this.showError('');

        let processedFormData = { ...this.formData };
        const formFields = this.userTask.userTaskConfig.formFields;

        try {
          processedFormData = await this.processFileFields(processedFormData, formFields);
        } catch (error) {
          this.showError('Fehler beim Verarbeiten der Dateien');
          return;
        }

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

        let outputIndex;
        if (action.isConfirmAction) {
          const confirmActionIndex = action.confirmValue ? 1 : 0;
          outputIndex = this.props.options.length + confirmActionIndex;
        } else {
          outputIndex = this.props.options.findIndex((element) => element.label === action.label);
        }
        this.send(msg, outputIndex);
      } else {
        this.showError(action.errorMessage);
      }
    },
    checkCondition(condition, context = {}) {
      if (condition === '') return true;
      try {
        const usertaskWithContext = {
          ...this.userTask,
          isConfirmDialog: context.isConfirmDialog || false,
        };

        const func = Function('fields', 'usertask', 'msg', '"use strict"; return (' + condition + ')');
        const result = func(this.formData, usertaskWithContext, this.msg);
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
    /**
     * Transforms base64 file data to FormKit-compatible format for display.
     *
     * FormKit file inputs expect an array of objects with 'name' property for display.
     * This function converts the base64 format (with 'data' property) to the display format,
     * while preserving the original data in originalFileData for form submission.
     *
     * Expected input format from initialValues:
     * {
     *   name: "filename.ext",
     *   size: 12345,
     *   type: "image/png",
     *   data: "base64string..."
     * }
     *
     * Output format for FormKit:
     * [
     *   { name: "filename.ext" }
     * ]
     *
     * @param {Object|Array} fileData - The file data from initial values
     * @param {Object} field - The form field configuration
     * @returns {Array} FormKit-compatible file array
     */
    transformBase64ToFormKitFormat(fileData, field) {
      if (
        Array.isArray(fileData) &&
        fileData.length > 0 &&
        typeof fileData[0] === 'object' &&
        fileData[0].name &&
        !fileData[0].data
      ) {
        return fileData;
      }

      const fieldId = field.id;
      const multiple = normalizeCustomForm(field.customForm, { multiple: false }).multiple === true;

      if (fileData && typeof fileData === 'object' && fileData.name && fileData.data) {
        this.originalFileData[fieldId] = fileData;

        const formKitFile = {
          name: fileData.name,
        };

        return multiple ? [formKitFile] : [formKitFile];
      }

      if (Array.isArray(fileData)) {
        this.originalFileData[fieldId] = fileData;

        const formKitFiles = fileData
          .filter((file) => file && typeof file === 'object' && file.name)
          .map((file) => ({
            name: file.name,
          }));

        return formKitFiles;
      }

      return [];
    },
    hasActualFileObjects(value) {
      if (!value) return false;

      if (Array.isArray(value)) {
        return value.some((item) => {
          return (
            item instanceof File ||
            (item && item.file instanceof File) ||
            (item && item.file instanceof FileList && item.file.length > 0)
          );
        });
      }

      return (
        value instanceof File ||
        (value instanceof FileList && value.length > 0) ||
        (value && value.file instanceof File) ||
        (value && value.file instanceof FileList && value.file.length > 0)
      );
    },
    async convertFileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            data: base64,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    async processFileFields(formData, formFields) {
      const processedData = { ...formData };

      for (const field of formFields) {
        if (field.type === 'file') {
          const fieldValue = processedData[field.id];
          const fieldId = field.id;

          if (this.originalFileData[fieldId]) {
            processedData[fieldId] = this.originalFileData[fieldId];
            continue;
          }

          if (fieldValue) {
            const multiple = normalizeCustomForm(field.customForm, { multiple: false }).multiple === true;

            if (multiple && Array.isArray(fieldValue)) {
              const base64Files = [];
              for (const file of fieldValue) {
                const processedFile = await this.processIndividualFile(file);
                if (processedFile) {
                  base64Files.push(processedFile);
                }
              }
              processedData[field.id] = base64Files;
            } else if (Array.isArray(fieldValue)) {
              const base64Files = [];
              for (const file of fieldValue) {
                const processedFile = await this.processIndividualFile(file);
                if (processedFile) {
                  base64Files.push(processedFile);
                }
              }
              processedData[field.id] = multiple ? base64Files : base64Files[0] || null;
            } else if (fieldValue) {
              const processedFile = await this.processIndividualFile(fieldValue);
              if (processedFile) {
                processedData[field.id] = processedFile;
              }
            }
          }
        }
      }

      return processedData;
    },
    async processIndividualFile(fileData) {
      let actualFile = null;

      if (fileData instanceof File) {
        actualFile = fileData;
      } else if (fileData instanceof FileList && fileData.length > 0) {
        actualFile = fileData[0];
      } else if (fileData && fileData.file instanceof File) {
        actualFile = fileData.file;
      } else if (fileData && fileData.file instanceof FileList && fileData.file.length > 0) {
        actualFile = fileData.file[0];
      } else if (Array.isArray(fileData) && fileData.length > 0) {
        if (fileData[0] instanceof File) {
          actualFile = fileData[0];
        } else if (fileData[0] && fileData[0].file instanceof File) {
          actualFile = fileData[0].file;
        } else if (fileData[0] && fileData[0].file instanceof FileList && fileData[0].file.length > 0) {
          actualFile = fileData[0].file[0];
        }
      } else if (typeof fileData === 'object' && fileData.data && fileData.name) {
        return fileData;
      }

      if (actualFile instanceof File) {
        return await this.convertFileToBase64(actualFile);
      }

      if (fileData && typeof fileData === 'object' && !fileData.data) {
        console.warn('Could not process file data:', fileData);
      }

      return fileData;
    },
    isImageFile(fileData) {
      if (!fileData || typeof fileData !== 'object') return false;

      const mimeType = fileData.type;
      if (!mimeType) return false;

      return mimeType.startsWith('image/');
    },
    generateImagePreviewUrl(fileData) {
      if (!fileData || !fileData.data || !fileData.type) return null;

      return `data:${fileData.type};base64,${fileData.data}`;
    },
    getFilePreviewsForField(fieldId) {
      const currentData = this.formData[fieldId] || null;
      const cachedOriginalData = this.originalFileData[fieldId] || null;
      const cacheKey = `${fieldId}_${JSON.stringify(currentData)}_${JSON.stringify(cachedOriginalData)}`;

      if (this.previewCache[cacheKey]) {
        return this.previewCache[cacheKey];
      }

      const currentFormData = this.formData[fieldId];
      const originalFileData = this.originalFileData[fieldId];

      if (!currentFormData && !originalFileData) {
        this.previewCache[cacheKey] = [];
        return [];
      }

      let previews = [];

      const hasNewFileObjects =
        currentFormData &&
        Array.isArray(currentFormData) &&
        currentFormData.length > 0 &&
        this.hasActualFileObjects(currentFormData);

      if (hasNewFileObjects) {
        previews = this.generatePreviewsFromCurrentFiles(currentFormData, fieldId);
      } else if (originalFileData) {
        const fileArray = Array.isArray(originalFileData) ? originalFileData : [originalFileData];
        previews = fileArray
          .filter((file) => this.isImageFile(file))
          .map((file) => ({
            name: file.name,
            url: this.generateImagePreviewUrl(file),
            size: file.size,
            type: file.type,
          }));
      }

      this.previewCache[cacheKey] = previews;

      return previews;
    },
    generatePreviewsFromCurrentFiles(fileArray, fieldId = null) {
      if (fieldId && this.objectUrlsByField[fieldId]) {
        this.objectUrlsByField[fieldId].forEach((url) => URL.revokeObjectURL(url));
        this.objectUrlsByField[fieldId] = [];
      } else if (fieldId) {
        this.objectUrlsByField[fieldId] = [];
      }

      const previews = fileArray
        .filter((fileItem) => {
          let actualFile = null;

          if (fileItem instanceof File) {
            actualFile = fileItem;
          } else if (fileItem && fileItem.file instanceof File) {
            actualFile = fileItem.file;
          } else if (Array.isArray(fileItem) && fileItem[0] instanceof File) {
            actualFile = fileItem[0];
          }

          return actualFile && actualFile.type && actualFile.type.startsWith('image/');
        })
        .map((fileItem) => {
          let actualFile = null;

          if (fileItem instanceof File) {
            actualFile = fileItem;
          } else if (fileItem && fileItem.file instanceof File) {
            actualFile = fileItem.file;
          } else if (Array.isArray(fileItem) && fileItem[0] instanceof File) {
            actualFile = fileItem[0];
          }

          const url = actualFile ? URL.createObjectURL(actualFile) : null;

          if (url && fieldId) {
            if (!this.objectUrlsByField[fieldId]) {
              this.objectUrlsByField[fieldId] = [];
            }
            this.objectUrlsByField[fieldId].push(url);
          }

          return {
            name: actualFile.name,
            url: url,
            size: actualFile.size,
            type: actualFile.type,
            isObjectUrl: true,
          };
        })
        .filter((preview) => preview.url !== null);

      return previews;
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B';

      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    openImageModal(preview) {
      this.modalImage = preview;
      this.imageModalOpen = true;
    },
    closeImageModal() {
      this.imageModalOpen = false;
      this.modalImage = null;
    },
    cleanupObjectUrls(fieldId = null) {
      if (fieldId) {
        if (this.objectUrlsByField[fieldId]) {
          this.objectUrlsByField[fieldId].forEach((url) => {
            URL.revokeObjectURL(url);
          });
          this.objectUrlsByField[fieldId] = [];
        }

        Object.keys(this.previewCache).forEach((key) => {
          if (key.startsWith(fieldId + '_')) {
            delete this.previewCache[key];
          }
        });
      } else {
        Object.keys(this.objectUrlsByField).forEach((fieldId) => {
          this.objectUrlsByField[fieldId].forEach((url) => {
            URL.revokeObjectURL(url);
          });
        });
        this.objectUrlsByField = {};

        this.previewCache = {};
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
@import '../stylesheets/ui-dynamic-form.css';
</style>

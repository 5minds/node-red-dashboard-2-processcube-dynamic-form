<template>
    <div className="ui-dynamic-form-external-sizing-wrapper" :style="props.card_size_styling">
        <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
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
                                                :is="getFieldComponent(field).type"
                                                v-if="getFieldComponent(field).innerHTML"
                                                v-bind="getFieldComponent(field).props"
                                                :class="getFieldComponent(field).class"
                                                v-html="getFieldComponent(field).innerHTML"
                                                :ref="
                                                    (el) => {
                                                        if (index === 0) firstFormFieldRef = el;
                                                    }
                                                "
                                            />
                                            <component
                                                :is="getFieldComponent(field).type"
                                                v-else-if="getFieldComponent(field).innerText"
                                                v-bind="getFieldComponent(field).props"
                                                :ref="
                                                    (el) => {
                                                        if (index === 0) firstFormFieldRef = el;
                                                    }
                                                "
                                                v-model="formData[field.id]"
                                            >
                                                {{ getFieldComponent(field).innerText }}
                                            </component>
                                            <div v-else-if="getFieldComponent(field).type == 'v-slider'">
                                                <p class="formkit-label">{{ field.label }}</p>
                                                <component
                                                    :is="getFieldComponent(field).type"
                                                    v-bind="getFieldComponent(field).props"
                                                    :ref="
                                                        (el) => {
                                                            if (index === 0) firstFormFieldRef = el;
                                                        }
                                                    "
                                                    v-model="field.defaultValue"
                                                />
                                                <p class="formkit-help">
                                                    {{ getFieldHint(field) }}
                                                </p>
                                            </div>
                                            <component
                                                :is="getFieldComponent(field).type"
                                                v-else
                                                v-bind="getFieldComponent(field).props"
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
                                    v-if="props.actions_inside_card && actions.length > 0"
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
        <div v-if="!props.actions_inside_card && actions.length > 0 && hasUserTask" style="padding-top: 32px">
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
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: {
            type: Object,
            default: () => ({ enabled: false, visible: false }),
        },
    },
    setup(props) {
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
            intersectionObserver: null,
            visibleFileFields: new Set(),
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
            return (
                this.props.options.length +
                (this.props.handle_confirmation_dialogs ? 2 : 0) +
                (this.props.trigger_on_change ? 1 : 0)
            );
        },
        isConfirmDialog() {
            return this.userTask?.userTaskConfig?.formFields?.some((field) => field.type === 'confirm') || false;
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
        // Optimized computed property for field components
        fieldComponents() {
            if (!this.userTask?.userTaskConfig?.formFields) {
                return {};
            }

            const components = {};
            const aFields = this.userTask.userTaskConfig.formFields;

            aFields.forEach((field) => {
                components[field.id] = this.createComponent(field);
            });

            return components;
        },
        // Optimized computed property for fields
        computedFields() {
            const aFields = this.userTask?.userTaskConfig?.formFields ?? [];
            return aFields.map((field) => ({
                ...field,
                items: mapItems(field.type, field),
            }));
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

        // Initialize Intersection Observer for lazy loading
        this.initLazyLoading();

        this.$socket.on('widget-load:' + this.id, (msg) => {
            this.init(msg);
        });
        this.$socket.on('msg-input:' + this.id, (msg) => {
            // store the latest message in our client-side vuex store when we receive a new message
            this.init(msg);
        });
        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id);
    },
    unmounted() {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load' + this.id);
        this.$socket?.off('msg-input:' + this.id);

        // Clean up Intersection Observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    },
    methods: {
        // Simplified component getter - now just returns from computed cache
        getFieldComponent(field) {
            return this.fieldComponents[field.id] || this.createComponent(field);
        },

        // Clear cache when form data changes
        clearComponentCache() {
            // This is now handled by computed properties automatically
        },

        // Safe method to get field hint for template use
        getFieldHint(field) {
            try {
                if (field.customForm) {
                    let customForm;
                    if (typeof field.customForm === 'string') {
                        customForm = JSON.parse(field.customForm);
                    } else if (typeof field.customForm === 'object') {
                        customForm = field.customForm;
                    }
                    return customForm?.hint;
                }
            } catch (error) {
                console.warn('Failed to parse customForm hint for field', field.id, error);
            }
            return undefined;
        },

        createComponent(field) {
            // Safe parsing of customForm - handle both string and object cases
            let customForm = {};
            try {
                if (field.customForm) {
                    if (typeof field.customForm === 'string') {
                        customForm = JSON.parse(field.customForm);
                    } else if (typeof field.customForm === 'object') {
                        customForm = field.customForm;
                    }
                }
            } catch (error) {
                console.warn('Failed to parse customForm for field', field.id, error);
                customForm = {};
            }
            const { hint, placeholder, validation, customProperties = [] } = customForm;
            const name = field.id;
            const isReadOnly =
                this.props.readonly ||
                this.formIsFinished ||
                customProperties.some(
                    (entry) => ['readOnly', 'readonly'].includes(entry.name) && entry.value === 'true'
                )
                    ? 'true'
                    : undefined;

            const commonFormKitProps = {
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
            };

            switch (field.type) {
                case 'long':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'number',
                            number: 'integer',
                            min: 0,
                            validation: validation ? `${validation}|number` : 'number',
                        },
                    };
                case 'number':
                    const step = customForm.step;
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'number',
                            step,
                            number: 'float',
                            validation: validation ? `${validation}|number` : 'number',
                        },
                    };
                case 'date':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'date',
                        },
                    };
                case 'string':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'text',
                            placeholder,
                        },
                    };
                case 'email':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'email',
                            placeholder,
                        },
                    };
                case 'password':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'password',
                            placeholder,
                        },
                    };
                case 'tel':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'tel',
                            placeholder,
                        },
                    };
                case 'url':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'url',
                            placeholder,
                        },
                    };
                case 'time':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'time',
                            placeholder,
                        },
                    };
                case 'week':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'week',
                            placeholder,
                        },
                    };
                case 'month':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'month',
                        },
                    };
                case 'datetime-local':
                    return {
                        type: 'FormKit',
                        props: {
                            ...commonFormKitProps,
                            type: 'datetime-local',
                        },
                    };
                case 'enum':
                    const enums = field.enumValues.map((obj) => {
                        return { value: obj.id, label: obj.name };
                    });
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'select', // JSON.parse(field.customForm).displayAs
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            disabled: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'select':
                    const selections = customForm.entries
                        ? customForm.entries.map((obj) => {
                              return { value: obj.key, label: obj.value };
                          })
                        : [];
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'select', // JSON.parse(field.customForm).displayAs
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            disabled: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'file-preview':
                    // Handle file preview display only (no upload functionality)
                    const originalFieldId = field.id.replace('_preview', '');
                    if (this.formData && this.formData[originalFieldId] && this.formData[originalFieldId].length != 0) {
                        const fileDataArray = Array.isArray(this.formData[originalFieldId])
                            ? this.formData[originalFieldId]
                            : [this.formData[originalFieldId]];

                        // Create unique container ID for this field
                        const containerId = `file-preview-${field.id}`;

                        // Check if this field is already visible (for immediate processing)
                        if (this.visibleFileFields.has(field.id)) {
                            // Return loading state initially
                            const loadingContent = `
                                <div id="${containerId}" data-lazy-field="${field.id}">
                                    <label class="ui-dynamic-form-input-label">${field.label} (Vorschau)${
                                field.required ? ' *' : ''
                            }</label>
                                    <div style="margin-top: 8px; padding: 20px; text-align: center; color: #666;">
                                        <div style="font-size: 1.2em; margin-bottom: 8px;">⏳</div>
                                        <div>Dateien werden geladen...</div>
                                    </div>
                                </div>
                            `;

                            // Process files asynchronously
                            setTimeout(() => {
                                this.processFilePreview(containerId, fileDataArray, field);
                            }, 0);

                            return {
                                type: 'div',
                                props: {
                                    innerHTML: loadingContent,
                                },
                            };
                        } else {
                            // Return lazy loading placeholder
                            const lazyContent = `
                                <div id="${containerId}" data-lazy-field="${field.id}" class="lazy-file-preview">
                                    <label class="ui-dynamic-form-input-label">${field.label} (Vorschau)${
                                field.required ? ' *' : ''
                            }</label>
                                    <div style="margin-top: 8px; padding: 40px; text-align: center; color: #999; border: 1px dashed #ddd; border-radius: 4px;">
                                        <div style="font-size: 1.5em; margin-bottom: 12px;">📁</div>
                                        <div>Dateien werden geladen, wenn sie sichtbar werden...</div>
                                        <div style="margin-top: 8px; font-size: 0.9em;">${
                                            fileDataArray.length
                                        } Datei(en)</div>
                                    </div>
                                </div>
                            `;

                            return {
                                type: 'div',
                                props: {
                                    innerHTML: lazyContent,
                                },
                            };
                        }
                    }
                    // If no files to preview, return empty div
                    return {
                        type: 'div',
                        props: {
                            style: 'display: none;',
                        },
                    };
                case 'file':
                    const multiple = customForm.multiple === 'true';
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'file',
                            id: field.id,
                            name,
                            label: field.label,
                            required: field.required,
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
                    const options = customForm.entries
                        ? customForm.entries.map((obj) => {
                              return { value: obj.key, label: obj.value };
                          })
                        : [];
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'header':
                    let typeToUse = 'h1';
                    if (customForm.style === 'heading_2') {
                        typeToUse = 'h2';
                    }
                    if (customForm.style === 'heading_3') {
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'radio':
                    const radioOptions = customForm.entries
                        ? customForm.entries.map((obj) => {
                              return { value: obj.key, label: obj.value };
                          })
                        : [];
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            disabled: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'range':
                    return {
                        type: 'v-slider',
                        props: {
                            id: field.id,
                            name,
                            // label: field.label,
                            required: field.required,
                            // value: this.formData[field.id],
                            // help: hint,
                            min: customForm.min,
                            max: customForm.max,
                            step: customForm.step,
                            thumbLabel: true,
                            // wrapperClass: '$remove:formkit-wrapper',
                            labelClass: 'ui-dynamic-form-input-label',
                            // inputClass: `input-${this.theme}`,
                            // innerClass: ui-dynamic-form-input-outlines `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
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
                            type: 'tel' /* with pro component mask more good */,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'textarea':
                    const rows = customForm.rows;
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'textarea' /* with pro component mask more good */,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
                case 'time':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'time' /* with pro component mask more good */,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
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
                            innerClass: `ui-dynamic-form-input-outlines ${
                                this.theme === 'dark' ? '$remove:formkit-inner' : ''
                            }`,
                            readonly: isReadOnly,
                            validation,
                            validationVisibility: 'live',
                        },
                    };
            }
        },
        initLazyLoading() {
            // Initialize Intersection Observer for lazy loading of file previews
            if (typeof IntersectionObserver !== 'undefined') {
                this.intersectionObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                const element = entry.target;
                                const fieldId = element.getAttribute('data-lazy-field');

                                if (fieldId && !this.visibleFileFields.has(fieldId)) {
                                    this.visibleFileFields.add(fieldId);
                                    this.loadFilePreview(fieldId);
                                    this.intersectionObserver.unobserve(element);
                                }
                            }
                        });
                    },
                    {
                        root: null,
                        rootMargin: '50px', // Start loading 50px before element becomes visible
                        threshold: 0.1,
                    }
                );

                // Observe all lazy file preview elements
                this.$nextTick(() => {
                    this.observeLazyElements();
                });
            } else {
                // Fallback for browsers without Intersection Observer
                // Load all file previews immediately
                this.loadAllFilePreviews();
            }
        },
        observeLazyElements() {
            const lazyElements = document.querySelectorAll('.lazy-file-preview[data-lazy-field]');
            lazyElements.forEach((element) => {
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(element);
                }
            });
        },
        loadFilePreview(fieldId) {
            // Find the field configuration
            const field = this.userTask?.userTaskConfig?.formFields?.find((f) => f.id === fieldId);
            if (!field) return;

            const originalFieldId = fieldId.replace('_preview', '');
            const fileDataArray = this.formData[originalFieldId];

            if (!fileDataArray || fileDataArray.length === 0) return;

            const containerId = `file-preview-${fieldId}`;
            const container = document.getElementById(containerId);

            if (container) {
                // Show loading state
                container.innerHTML = `
                    <label class="ui-dynamic-form-input-label">${field.label} (Vorschau)${
                    field.required ? ' *' : ''
                }</label>
                    <div style="margin-top: 8px; padding: 20px; text-align: center; color: #666;">
                        <div style="font-size: 1.2em; margin-bottom: 8px;">⏳</div>
                        <div>Dateien werden geladen...</div>
                    </div>
                `;

                // Process files
                setTimeout(() => {
                    this.processFilePreview(containerId, fileDataArray, field);
                }, 0);
            }
        },
        loadAllFilePreviews() {
            // Fallback method - load all file previews immediately
            const fileFields =
                this.userTask?.userTaskConfig?.formFields?.filter((f) => f.type === 'file-preview') || [];
            fileFields.forEach((field) => {
                if (!this.visibleFileFields.has(field.id)) {
                    this.visibleFileFields.add(field.id);
                    this.loadFilePreview(field.id);
                }
            });
        },
        processFilePreview(containerId, fileDataArray, field) {
            // Process files in chunks to avoid blocking the UI
            const processInChunks = async () => {
                const images = [];
                const otherFiles = [];

                // Process files in batches to avoid UI blocking
                const batchSize = 3;

                for (let i = 0; i < fileDataArray.length; i += batchSize) {
                    const batch = fileDataArray.slice(i, i + batchSize);

                    for (const fileData of batch) {
                        const fileName = fileData.name || '';
                        const isImage = fileName.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/);

                        if (isImage && fileData.file && fileData.file.data) {
                            // Convert buffer to base64 data URL for image display
                            const uint8Array = new Uint8Array(fileData.file.data);
                            let binaryString = '';

                            // Process in chunks to avoid call stack overflow
                            const chunkSize = 1024;
                            for (let j = 0; j < uint8Array.length; j += chunkSize) {
                                const chunk = uint8Array.slice(j, j + chunkSize);
                                binaryString += String.fromCharCode.apply(null, chunk);
                            }

                            const base64String = btoa(binaryString);
                            const mimeType = fileName.toLowerCase().endsWith('.png')
                                ? 'image/png'
                                : fileName.toLowerCase().endsWith('.gif')
                                ? 'image/gif'
                                : 'image/jpeg';
                            const dataURL = `data:${mimeType};base64,${base64String}`;

                            images.push({ fileName, dataURL, fileData });
                        } else {
                            otherFiles.push({ fileName, fileData });
                        }
                    }

                    // Allow UI to update between batches
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }

                // Build the final content
                let content = `<label class="ui-dynamic-form-input-label">${field.label} (Vorschau)${
                    field.required ? ' *' : ''
                }</label>`;

                // Display images
                if (images.length > 0) {
                    content += '<div style="margin-top: 8px;">';
                    content += '<div style="font-weight: bold; margin-bottom: 8px;">Bilder:</div>';
                    images.forEach((img, index) => {
                        const downloadId = `download-img-${field.id}-${index}`;
                        content += `
                            <div style="display: inline-block; margin: 8px; text-align: center; vertical-align: top;">
                                <img src="${img.dataURL}" alt="${img.fileName}"
                                     style="max-width: 300px; max-height: 200px; border: 1px solid #ccc; display: block; cursor: pointer;"
                                     onclick="document.getElementById('${downloadId}').click();" />
                                <div style="margin-top: 4px; font-size: 0.9em; color: #666; max-width: 300px; word-break: break-word;">
                                    ${img.fileName}
                                </div>
                                <a id="${downloadId}" href="${img.dataURL}" download="${img.fileName}" style="display: none;"></a>
                            </div>
                        `;
                    });
                    content += '</div>';
                }

                // Display other files as list
                if (otherFiles.length > 0) {
                    content +=
                        '<div style="margin-top: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">';
                    content += '<div style="font-weight: bold; margin-bottom: 8px;">Weitere Dateien:</div>';
                    otherFiles.forEach((file, index) => {
                        const downloadId = `download-file-${field.id}-${index}`;
                        const uint8Array = new Uint8Array(file.fileData.file.data);
                        let binaryString = '';

                        // Process in chunks for download
                        const chunkSize = 1024;
                        for (let j = 0; j < uint8Array.length; j += chunkSize) {
                            const chunk = uint8Array.slice(j, j + chunkSize);
                            binaryString += String.fromCharCode.apply(null, chunk);
                        }

                        const base64String = btoa(binaryString);
                        const dataURL = `data:application/octet-stream;base64,${base64String}`;

                        content += `
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; padding: 4px; border-radius: 3px; cursor: pointer;"
                                 onclick="document.getElementById('${downloadId}').click();"
                                 onmouseover="this.style.backgroundColor='#e6e6e6';"
                                 onmouseout="this.style.backgroundColor='transparent';">
                                <span style="font-size: 1.2em;">📎</span>
                                <span style="flex: 1; word-break: break-word;">${file.fileName}</span>
                                <span style="font-size: 0.8em; color: #007bff;">Download</span>
                                <a id="${downloadId}" href="${dataURL}" download="${file.fileName}" style="display: none;"></a>
                            </div>
                        `;
                    });
                    content += '</div>';
                }

                // Update the container with the final content
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = content;
                }
            };

            processInChunks().catch((error) => {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `
                        <label class="ui-dynamic-form-input-label">${field.label} (Vorschau)${
                        field.required ? ' *' : ''
                    }</label>
                        <div style="margin-top: 8px; padding: 20px; text-align: center; color: #d32f2f;">
                            <div style="font-size: 1.2em; margin-bottom: 8px;">⚠️</div>
                            <div>Fehler beim Laden der Dateien</div>
                        </div>
                    `;
                }
            });
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
            return this.computedFields;
        },
        /*
                            widget-action just sends a msg to Node-RED, it does not store the msg state server-side
                            alternatively, you can use widget-change, which will also store the msg in the Node's datastore
                        */
        send(msg, index) {
            const msgArr = [];
            msgArr[index] = msg;
            this.$socket.emit('widget-action', this.id, msgArr);
        },
        init(msg) {
            this.msg = msg;
            this.clearComponentCache();

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
                // Reset lazy loading state
                this.visibleFileFields.clear();
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

            // Reset lazy loading state for new task
            this.visibleFileFields.clear();

            if (formFields) {
                formFields.forEach((field) => {
                    this.formData[field.id] = field.defaultValue;

                    if (field.type === 'confirm') {
                        let customForm = {};
                        try {
                            if (field.customForm) {
                                if (typeof field.customForm === 'string') {
                                    customForm = JSON.parse(field.customForm);
                                } else if (typeof field.customForm === 'object') {
                                    customForm = field.customForm;
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to parse customForm for confirm field', field.id, error);
                            customForm = {};
                        }
                        const confirmText = customForm.confirmButtonText ?? 'Confirm';
                        const declineText = customForm.declineButtonText ?? 'Decline';
                        this.actions = [
                            {
                                alignment: 'right',
                                primary: 'false',
                                label: declineText,
                                condition: '',
                            },
                            {
                                alignment: 'right',
                                primary: 'true',
                                label: confirmText,
                                condition: '',
                            },
                        ];
                    }
                });

                // Check for file fields and duplicate them as file-preview if initial values exist
                // Insert preview fields directly before their corresponding file fields
                for (let i = formFields.length - 1; i >= 0; i--) {
                    const field = formFields[i];
                    if (field.type === 'file' && initialValues && initialValues[field.id]) {
                        const previewField = { ...field };
                        previewField.type = 'file-preview';
                        previewField.id = `${field.id}_preview`; // Give it a unique ID
                        this.userTask.userTaskConfig.formFields.splice(i, 0, previewField);
                    }
                }
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

            // Force update of computed properties by triggering reactivity
            this.$nextTick(() => {
                this.focusFirstFormField();
                // Re-observe lazy elements after DOM update
                this.observeLazyElements();
            });
        },
        actionFn(action) {
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
                // TODO: mm - end
            } else {
                this.showError(action.errorMessage);
            }
        },
        checkCondition(condition) {
            if (condition === '') return true;
            try {
                // eslint-disable-next-line no-new-func
                const func = Function('fields', 'userTask', 'msg', '"use strict"; return (' + condition + ')');
                const result = func(this.formData, this.userTask, this.msg);
                return Boolean(result);
            } catch (err) {
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
                        inputElement = this.firstFormFieldRef.$el.querySelector(
                            'input:not([type="hidden"]), textarea, select'
                        );
                    }
                }

                if (inputElement) {
                    inputElement.focus();
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

/* Lazy loading styles */
.lazy-file-preview {
    transition: opacity 0.3s ease-in-out;
}

.lazy-file-preview .lazy-placeholder {
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    background-size: 200% 200%;
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% -200%;
    }
    100% {
        background-position: 200% 200%;
    }
}

.lazy-file-preview:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

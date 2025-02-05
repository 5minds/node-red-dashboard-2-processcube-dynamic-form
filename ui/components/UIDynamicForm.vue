<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dynamic-form-wrapper">
        <p v-if="hasFields()">
            <v-form ref="form" v-model="form" :class="dynamicClass">
                <h3 style="padding: 16px">{{ this.props.name }}</h3>
                <div style="padding: 16px; max-height: 550px; overflow-y: auto">
                    <v-row v-for="(field, index) in fields()" :key="field">
                        <v-col cols="12">
                            <component
                                v-if="createComponent(field).innerText"
                                :is="createComponent(field).type"
                                v-bind="createComponent(field).props"
                                v-model="formData[field.id]"
                            >
                                {{ createComponent(field).innerText }}
                            </component>
                            <div v-else-if="createComponent(field).type == 'v-slider'">
                                <p class="formkit-label">{{ field.label }}</p>
                                <component
                                    :is="createComponent(field).type"
                                    v-bind="createComponent(field).props"
                                    v-model="field.defaultValue"
                                />
                                <p class="formkit-help">
                                    {{ field.customForm ? JSON.parse(field.customForm).hint : undefined }}
                                </p>
                            </div>
                            <component
                                v-else
                                :is="createComponent(field).type"
                                v-bind="createComponent(field).props"
                                v-model="formData[field.id]"
                            />
                        </v-col>
                    </v-row>
                </div>
                <v-row :class="dynamicFooterClass">
                    <v-row v-if="error" style="padding: 12px">
                        <v-alert v-if="error" type="error">Error: {{ errorMsg }}</v-alert>
                    </v-row>
                    <div style="display: flex; gap: 8px">
                        <div v-for="(action, index) in actions" :key="index" style="flex-grow: 1">
                            <v-btn
                                :key="index"
                                style="width: 100% !important; min-height: 36px"
                                @click="actionFn(action)"
                            >
                                {{ action.label }}
                            </v-btn>
                        </div>
                    </div>
                </v-row>
            </v-form>
        </p>
        <p v-else>
            <v-alert :text="waiting_info" :title="waiting_title" />
        </p>
    </div>
</template>

<script>
import { markRaw, h, getCurrentInstance } from 'vue';
import { mapState } from 'vuex';
import { plugin, defaultConfig } from '@formkit/vue';
import '@formkit/themes/genesis';
import { FormKit } from '@formkit/vue';

export default {
    name: 'UIDynamicForm',
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
        console.info('UIDynamicForm setup with:', props);
        console.debug('Vue function loaded correctly', markRaw);
        const instance = getCurrentInstance();
        const app = instance.appContext.app;
        const formkitConfig = defaultConfig({
            theme: 'genesis',
        });
        app.use(plugin, formkitConfig);
    },
    data() {
        return {
            actions: [],
            form: {},
            formData: {},
            taskInput: {},
            theme: '',
            error: false,
            errorMsg: '',
        };
    },
    created() {
        const currentPath = window.location.pathname;
        const lastPart = currentPath.substring(currentPath.lastIndexOf('/'));

        const store = this.$store.state;

        for (let key in store.ui.pages) {
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
    computed: {
        ...mapState('data', ['messages']),
        waiting_title() {
            return this.props.waiting_title || 'Warten auf den Usertask...';
        },
        waiting_info() {
            return (
                this.props.waiting_info ||
                'Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist.'
            );
        },

        dynamicClass() {
            return `ui-dynamic-form-${this.theme}`;
        },

        dynamicFooterClass() {
            return `ui-dynamic-form-footer-${this.theme}`;
        },
    },
    mounted() {
        const elements = document.querySelectorAll('.formkit-input');

        elements.forEach((element) => {
            element.classList.add('test');
        });

        this.$socket.on('widget-load:' + this.id, (msg) => {
            this.init();
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg,
            });
        });
        this.$socket.on('msg-input:' + this.id, (msg) => {
            // store the latest message in our client-side vuex store when we receive a new message
            this.init();

            this.messages[this.id] = msg;

            const hasTask = msg.payload && msg.payload.userTask;
            const defaultValues = msg.payload.userTask.userTaskConfig.formFields;
            const initialValues = msg.payload.userTask.startToken;

            if (hasTask) {
                this.taskInput = msg.payload.userTask;
            }

            if (hasTask && defaultValues) {
                defaultValues.forEach((field) => {
                    this.formData[field.id] = field.defaultValue;
                });
            }

            if (hasTask && initialValues) {
                Object.keys(initialValues).forEach((key) => {
                    this.formData[key] = initialValues[key];
                });
            }

            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg,
            });
        });
        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id);
    },
    unmounted() {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load' + this.id);
        this.$socket?.off('msg-input:' + this.id);
    },
    components: {
        FormKit,
    },
    methods: {
        createComponent(field) {
            console.log(field)
            const hint = field.customForm ? JSON.parse(field.customForm).hint : undefined;
            const placeholder = field.customForm ? JSON.parse(field.customForm).placeholder : undefined;
            switch (field.type) {
                case 'long':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'number',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            number: 'integer',
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'number':
                    const step = field.customForm ? JSON.parse(field.customForm).step : undefined;
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'number',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            step: step,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'date':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'date',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
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
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            options: enums,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'select':
                    const selections = JSON.parse(field.customForm).entries.map((obj) => {
                        return { value: obj.key, label: obj.value };
                    });
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'select', // JSON.parse(field.customForm).displayAs
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            options: selections,
                            placeholder: placeholder,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'string':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'text',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'boolean':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'checkbox',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'file':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'file',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            innerClass: 'reset-background',
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            // innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'checkbox':
                    const options = JSON.parse(field.customForm).entries.map((obj) => {
                        return { value: obj.key, label: obj.value };
                    });
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'checkbox',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            options: options,
                            help: hint,
                            fieldsetClass: 'custom-fieldset',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'color':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'color',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                        },
                    };
                case 'datetime-local':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'datetime-local',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'email':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'email',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            validation: 'email',
                            validationVisibility: 'live',
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'header':
                    let typeToUse = 'h1';
                    if (field.customForm && JSON.parse(field.customForm).style == 'heading_2') {
                        typeToUse = 'h2';
                    }
                    if (field.customForm && JSON.parse(field.customForm).style == 'heading_3') {
                        typeToUse = 'h3';
                    }
                    return {
                        type: typeToUse,
                        innerText: field.defaultValue,
                    };
                case 'hidden':
                    return {
                        type: 'input',
                        props: {
                            type: 'hidden',
                            value: field.defaultValue,
                        },
                    };
                case 'month':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'month',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'paragraph':
                    return {
                        type: 'p',
                        innerText: field.defaultValue,
                    };
                case 'password':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'password',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'radio':
                    const radioOptions = JSON.parse(field.customForm).entries.map((obj) => {
                        return { value: obj.key, label: obj.value };
                    });
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'radio',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            options: radioOptions,
                            help: hint,
                            fieldsetClass: 'custom-fieldset',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'range':
                    const customForm = JSON.parse(field.customForm);
                    return {
                        type: 'v-slider',
                        props: {
                            id: field.id,
                            // label: field.label,
                            required: field.required,
                            // value: field.defaultValue,
                            // help: hint,
                            min: customForm.min,
                            max: customForm.max,
                            step: customForm.step,
                            thumbLabel: true,
                            // wrapperClass: '$remove:formkit-wrapper',
                            // inputClass: `input-${this.theme}`,
                            // innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'tel':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'tel' /* with pro component mask more good */,
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'textarea':
                    const rows = field.customForm ? JSON.parse(field.customForm).rows : undefined;
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'textarea' /* with pro component mask more good */,
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            rows: rows,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'time':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'time' /* with pro component mask more good */,
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'url':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'url',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            validation: 'url',
                            validationVisibility: 'live',
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                case 'week':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'week',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            placeholder: placeholder,
                            wrapperClass: '$remove:formkit-wrapper',
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
                default:
                    return {
                        type: 'FormKit',
                        props: {
                            type: field.type,
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            inputClass: `input-${this.theme}`,
                            innerClass: `${this.theme == 'dark' ? '$remove:formkit-inner' : ''}`,
                        },
                    };
            }
        },
        checkFormState(state) {
            // const field = this.$formkit.get('field_01');
            // console.info(field.context.state.valid);

            return true;

            // loop over fields then this.$formkit.get(this.id) -> check error state if all ok return true else return false
            // ?? wie unterscheiden wir welche actions dieser validierungsfehler betrifft ??
            // ?? wie machen wir formkit validierung auch im Studio available ??
            // \_ vllt macht es sinn das schema von formkit zu übernehmen oder alternativ nur unsere validierung zu nutzen.
        },
        hasUserTask() {
            return this.messages && this.messages[this.id] && this.messages[this.id].payload.userTask;
        },
        userTask() {
            return this.hasUserTask() ? this.messages[this.id].payload.userTask : {};
        },
        fields() {
            const aFields = this.hasUserTask() ? this.userTask().userTaskConfig.formFields : [];
            const fieldMap = aFields.map((field) => ({
                ...field,
                items: mapItems(field.type, field),
            }));

            return fieldMap;
        },
        hasFields() {
            return this.messages && this.messages[this.id] && this.messages[this.id].payload.userTask !== undefined;
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
        init() {
            this.actions = this.props.options;
        },
        actionFn(action) {
            // this.checkFormState();
            if (this.checkCondition(action.condition)) {
                this.showError(false, '');
                // TODO: MM - begin
                // this.send(
                //    { payload: { formData: this.formData, userTask: this.userTask() } },
                //    this.actions.findIndex((element) => element.label === action.label)
                // );
                const msg = this.messages[this.id] || {};
                msg.payload = { formData: this.formData, userTask: this.userTask() };
                this.send(
                    msg,
                    this.actions.findIndex((element) => element.label === action.label)
                );
                // TODO: mm - end
            } else {
                this.showError(true, action.errorMessage);
            }
        },
        checkCondition(condition) {
            if (condition == '') return true;
            try {
                const func = Function('fields', 'userTask', 'msg', '"use strict"; return (' + condition + ')');
                const result = func(this.formData, this.taskInput, this.messages[this.id]);
                console.log(this.formData, result);
                return Boolean(result);
            } catch (err) {
                console.error('Error while evaluating condition: ' + err);
                return false;
            }
        },
        showError(bool, errMsg) {
            this.error = bool;
            this.errorMsg = errMsg;
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

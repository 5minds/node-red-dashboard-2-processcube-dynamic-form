<template>
    <div className="ui-dynamic-form-external-sizing-wrapper" :style="props.card_size_styling">
        <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
        <div className="ui-dynamic-form-wrapper">
            <p v-if="hasUserTask()">
                <v-form ref="form" v-model="form" :class="dynamicClass">
                    <h3 v-if="props.name?.length > 0" style="padding: 16px">{{ props.name }}</h3>
                    <div style="padding: 16px; max-height: 550px; overflow-y: auto; display: flex; flex-wrap: wrap; flex-direction: row; column-gap: 20px">
                        <v-row v-for="(field, index) in fields()" :key="field" :style="getRowWidthStyling(field, index)">
                            <v-col cols="12">
                                <component
                                    :is="createComponent(field).type"
                                    v-if="createComponent(field).innerText"
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
                                    :is="createComponent(field).type"
                                    v-else
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
                        <UIDynamicFormFooterAction v-if="props.actions_inside_card" :actions="actions" :actionCallback="actionFn" style="padding: 16px" />
                    </v-row>
                </v-form>
            </p>
            <p v-else>
                <v-alert :text="waiting_info" :title="waiting_title" />
            </p>
        </div>
        <div v-if="!props.actions_inside_card && hasUserTask()" style="padding-top: 32px;">
            <UIDynamicFormFooterAction :actions="actions" :actionCallback="actionFn" />
        </div>
    </div>
</template>

<!-- eslint-disable no-case-declarations -->
<script>
import { FormKit, defaultConfig, plugin } from '@formkit/vue'
import { getCurrentInstance, markRaw } from 'vue'
import { mapState } from 'vuex'

// eslint-disable-next-line import/no-unresolved
import '@formkit/themes/genesis'
import UIDynamicFormFooterAction from './FooterActions.vue'

export default {
    name: 'UIDynamicForm',
    components: {
        FormKit, UIDynamicFormFooterAction
    },
    inject: ['$socket'],
    props: {
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: {
            type: Object,
            default: () => ({ enabled: false, visible: false })
        }
    },
    setup (props) {
        console.info('UIDynamicForm setup with:', props)
        console.debug('Vue function loaded correctly', markRaw)
        const instance = getCurrentInstance()
        const app = instance.appContext.app
        const formkitConfig = defaultConfig({
            theme: 'genesis'
        })
        app.use(plugin, formkitConfig)
    },
    data () {
        return {
            actions: [],
            form: {},
            formData: {},
            taskInput: {},
            theme: '',
            error: false,
            errorMsg: ''
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        waiting_title () {
            return this.props.waiting_title || 'Warten auf den Usertask...'
        },
        waiting_info () {
            return (
                this.props.waiting_info ||
                'Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist.'
            )
        },

        dynamicClass () {
            return `ui-dynamic-form-${this.theme} ui-dynamic-form-common`
        },

        dynamicFooterClass () {
            return `ui-dynamic-form-footer-${this.theme} ui-dynamic-form-footer-common`
        }
    },
    created () {
        const currentPath = window.location.pathname
        const lastPart = currentPath.substring(currentPath.lastIndexOf('/'))

        const store = this.$store.state

        for (const key in store.ui.pages) {
            if (store.ui.pages[key].path === lastPart) {
                const theme = store.ui.pages[key].theme
                if (store.ui.themes[theme].name === 'ProcessCube Lightmode') {
                    this.theme = 'light'
                } else if (store.ui.themes[theme].name === 'ProcessCube Darkmode') {
                    this.theme = 'dark'
                } else {
                    this.theme = 'default'
                }
                break
            }
        }
    },
    mounted () {
        const elements = document.querySelectorAll('.formkit-input')

        elements.forEach((element) => {
            element.classList.add('test')
        })

        this.$socket.on('widget-load:' + this.id, (msg) => {
            this.init()
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
        })
        this.$socket.on('msg-input:' + this.id, (msg) => {
            // store the latest message in our client-side vuex store when we receive a new message
            this.init()

            this.messages[this.id] = msg

            const hasTask = msg.payload && msg.payload.userTask
            const defaultValues = msg.payload.userTask.userTaskConfig.formFields
            const initialValues = msg.payload.userTask.startToken

            if (hasTask) {
                this.taskInput = msg.payload.userTask
            }

            if (hasTask && defaultValues) {
                defaultValues.forEach((field) => {
                    this.formData[field.id] = field.defaultValue
                })
            }

            if (hasTask && initialValues) {
                Object.keys(initialValues).forEach((key) => {
                    this.formData[key] = initialValues[key]
                })
            }

            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
        })
        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id)
    },
    unmounted () {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load' + this.id)
        this.$socket?.off('msg-input:' + this.id)
    },
    methods: {
        createComponent (field) {
            const hint = field.customForm ? JSON.parse(field.customForm).hint : undefined
            const placeholder = field.customForm ? JSON.parse(field.customForm).placeholder : undefined
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'number':
                const step = field.customForm ? JSON.parse(field.customForm).step : undefined
                return {
                    type: 'FormKit',
                    props: {
                        type: 'number',
                        id: field.id,
                        label: field.label,
                        required: field.required,
                        value: field.defaultValue,
                        step,
                        help: hint,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'enum':
                const enums = field.enumValues.map((obj) => {
                    return { value: obj.id, label: obj.name }
                })
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'select':
                const selections = JSON.parse(field.customForm).entries.map((obj) => {
                    return { value: obj.key, label: obj.value }
                })
                return {
                    type: 'FormKit',
                    props: {
                        type: 'select', // JSON.parse(field.customForm).displayAs
                        id: field.id,
                        label: field.label,
                        required: field.required,
                        value: field.defaultValue,
                        options: selections,
                        placeholder,
                        help: hint,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        // innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'checkbox':
                const options = JSON.parse(field.customForm).entries.map((obj) => {
                    return { value: obj.key, label: obj.value }
                })
                return {
                    type: 'FormKit',
                    props: {
                        type: 'checkbox',
                        id: field.id,
                        label: field.label,
                        required: field.required,
                        value: field.defaultValue,
                        options,
                        help: hint,
                        fieldsetClass: 'custom-fieldset',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'header':
                let typeToUse = 'h1'
                if (field.customForm && JSON.parse(field.customForm).style === 'heading_2') {
                    typeToUse = 'h2'
                }
                if (field.customForm && JSON.parse(field.customForm).style === 'heading_3') {
                    typeToUse = 'h3'
                }
                return {
                    type: typeToUse,
                    innerText: field.defaultValue
                }
            case 'hidden':
                return {
                    type: 'input',
                    props: {
                        type: 'hidden',
                        value: field.defaultValue
                    }
                }
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'paragraph':
                return {
                    type: 'p',
                    innerText: field.defaultValue
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'radio':
                const radioOptions = JSON.parse(field.customForm).entries.map((obj) => {
                    return { value: obj.key, label: obj.value }
                })
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'range':
                const customForm = JSON.parse(field.customForm)
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
                        // innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined,
                        disabled: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            case 'textarea':
                const rows = field.customForm ? JSON.parse(field.customForm).rows : undefined
                return {
                    type: 'FormKit',
                    props: {
                        type: 'textarea' /* with pro component mask more good */,
                        id: field.id,
                        label: field.label,
                        required: field.required,
                        value: field.defaultValue,
                        rows,
                        help: hint,
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        validation: 'url',
                        validationVisibility: 'live',
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        placeholder,
                        wrapperClass: '$remove:formkit-wrapper',
                        inputClass: `input-${this.theme}`,
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
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
                        innerClass: `${this.theme === 'dark' ? '$remove:formkit-inner' : ''}`,
                        readonly: this.props.readonly ? 'true' : undefined
                    }
                }
            }
        },
        checkFormState (state) {
            // const field = this.$formkit.get('field_01');
            // console.info(field.context.state.valid);

            return true

            // loop over fields then this.$formkit.get(this.id) -> check error state if all ok return true else return false
            // ?? wie unterscheiden wir welche actions dieser validierungsfehler betrifft ??
            // ?? wie machen wir formkit validierung auch im Studio available ??
            // \_ vllt macht es sinn das schema von formkit zu übernehmen oder alternativ nur unsere validierung zu nutzen.
        },
        hasUserTask () {
            return this.messages && this.messages[this.id] && this.messages[this.id].payload?.userTask
        },
        userTask () {
            return this.hasUserTask() ? this.messages[this.id].payload.userTask : {}
        },
        getRowWidthStyling (field, index) {
            let style = ''
            if (index === 0) {
                style += 'margin-top: 12px;'
            }
            if (field.type === 'header') {
                style += 'flex-basis: 100%;'
            } else {
                style += `flex-basis: ${1 / this.props.form_columns * 100}%;`
            }
            return style
        },
        fields () {
            const aFields = this.userTask()?.userTaskConfig?.formFields ?? []
            const fieldMap = aFields.map((field) => ({
                ...field,
                items: mapItems(field.type, field)
            }))

            return fieldMap
        },
        /*
            widget-action just sends a msg to Node-RED, it does not store the msg state server-side
            alternatively, you can use widget-change, which will also store the msg in the Node's datastore
        */
        send (msg, index) {
            const msgArr = []
            msgArr[index] = msg
            this.$socket.emit('widget-action', this.id, msgArr)
        },
        init () {
            this.actions = this.props.options
        },
        actionFn (action) {
            // this.checkFormState();
            if (this.checkCondition(action.condition)) {
                this.showError(false, '')
                // TODO: MM - begin
                // this.send(
                //    { payload: { formData: this.formData, userTask: this.userTask() } },
                //    this.actions.findIndex((element) => element.label === action.label)
                // );
                const msg = this.messages[this.id] || {}
                msg.payload = { formData: this.formData, userTask: this.userTask() }
                this.send(
                    msg,
                    this.actions.findIndex((element) => element.label === action.label)
                )
                // TODO: mm - end
            } else {
                this.showError(true, action.errorMessage)
            }
        },
        checkCondition (condition) {
            if (condition === '') return true
            try {
                // eslint-disable-next-line no-new-func
                const func = Function('fields', 'userTask', 'msg', '"use strict"; return (' + condition + ')')
                const result = func(this.formData, this.taskInput, this.messages[this.id])
                return Boolean(result)
            } catch (err) {
                console.error('Error while evaluating condition: ' + err)
                return false
            }
        },
        showError (bool, errMsg) {
            this.error = bool
            this.errorMsg = errMsg
        }
    }
}

function mapItems (type, field) {
    if (type === 'enum') {
        return field.enumValues.map((enumValue) => ({
            title: enumValue.name,
            value: enumValue.id
        }))
    } else {
        return null
    }
}
</script>

<style>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

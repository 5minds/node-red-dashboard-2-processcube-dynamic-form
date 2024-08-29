<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dynamic-form-wrapper">
        <p v-if="hasFields()">
            <v-form ref="form" v-model="form">
                <v-row v-for="(field, index) in fields()" :key="index">
                    <v-col cols="12">
                        <component :is="createComponent(field).type" v-bind="createComponent(field).props" />
                    </v-col>
                </v-row>
                <v-row style="padding: 12px">
                    <v-alert v-if="error" type="error">Error: {{ errorMsg }}</v-alert>
                </v-row>
                <v-row style="display: flex; gap: 8px; padding: 12px">
                    <div v-for="(action, index) in actions" :key="index" style="flex-grow: 1">
                        <v-btn :key="index" style="width: 100%" @click="actionFn(action)">
                            {{ action.label }}
                        </v-btn>
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
import { markRaw, h } from 'vue';
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
    },
    data() {
        return {
            actions: [],
            form: {},
            formData: {},
            msg: {},
            taskInput: {},
            error: false,
            errorMsg: '',
        };
    },
    created() {
        const formkitConfig = defaultConfig({
            theme: 'genesis',
        });
        window.app.use(plugin, formkitConfig);
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
    },
    mounted() {
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
            const hint = field.customForm ? JSON.parse(field.customForm).hint : undefined;
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
                        },
                    };
                case 'number':
                    return {
                        type: 'FormKit',
                        props: {
                            type: 'number',
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            value: field.defaultValue,
                            help: hint,
                            wrapperClass: '$remove:formkit-wrapper',
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
                            wrapperClass: '$remove:formkit-wrapper',
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
                        },
                    };
            }
        },
        checkFormState(state) {
            const field = this.$formkit.get('field_01');
            console.info(field.context.state.valid);

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
            this.checkFormState();
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
                const result = func(this.formData, this.taskInput, this.msg);
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

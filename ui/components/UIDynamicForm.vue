<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dynamic-form-wrapper">
        <p v-if="hasFields()">
            <v-form ref="form" v-model="form">
                <v-row v-for="(field, index) in fields()" :key="index">
                    <v-col cols="12">
                        <component
                            :is="`FormKit`"
                            :type="field.component"
                            :id="field.id"
                            v-model="formData[field.id]"
                            :required="field.required"
                            :items="field.items"
                            :label="field.label"
                            wrapper-class="$remove:formkit-wrapper dynamicstyle"
                        />
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
import { markRaw } from 'vue';
import { mapState } from 'vuex';
import { plugin, defaultConfig } from '@formkit/vue';
import '@formkit/themes/genesis';

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
        this.$socket.on('ui-config', (topic, payload) => {
            const firstThemeKey = Object.keys(payload.themes)[0];
            localStorage.setItem('styles', JSON.stringify(payload.themes[firstThemeKey].colors));
            this.injectDynamicStyles();
        });
        this.injectDynamicStyles();
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

            this.msg = msg;

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
    methods: {
        injectDynamicStyles() {
            try {
                const styleTag = document.createElement('style');
                const colors = JSON.parse(localStorage.getItem('styles'));
                styleTag.type = 'text/css';
                styleTag.innerHTML = `
                .dynamicstyle {
                    background-color: ${colors.primary};
                }
            `;
                document.head.appendChild(styleTag);
            } catch (e) {
                console.log('style injection failed: ' + e);
            }
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
                component: mapFieldTypes(field.type),
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
            if (this.checkCondition(action.condition)) {
                this.showError(false, '');
                this.send(
                    { payload: { formData: this.formData, userTask: this.userTask() } },
                    this.actions.findIndex((element) => element.label === action.label)
                );
            } else {
                this.showError(true, action.errorMessage);
            }
        },
        checkCondition(condition) {
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

function mapFieldTypes(fieldType) {
    switch (fieldType) {
        case 'string':
            return 'text';
        case 'long':
            return 'number';
        case 'date':
            return 'date';
        case 'enum':
            return 'select';
        case 'boolean':
            return 'checkbox';
        case 'text':
            return 'text';
        case 'select':
            return 'select';
        case 'checkbox':
            return 'checkbox';
        case 'radio':
            return 'radio';
        case 'switch':
            return 'v-switch';
        case 'slider':
            return 'slider';
        case 'time':
            return 'time';
        case 'datetime':
            return 'datetime-local';
        case 'color':
            return 'color';
        case 'file':
            return 'file';
        case 'textarea':
            return 'textarea';
        case 'password':
            return 'password';
        case 'number':
            return 'number';
        case 'email':
            return 'email';
        case 'tel':
            return 'tel';
        case 'url':
            return 'url';
        default:
            return 'text';
    }
}
</script>

<style scoped>
/* CSS is auto scoped, but using named classes is still recommended */
@import '../stylesheets/ui-dynamic-form.css';
</style>

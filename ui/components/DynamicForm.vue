<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="dynamic-form-wrapper">
        <p v-if="hasFields">
            <v-form ref="form" v-model="form">
                <v-row v-for="(field, index) in fields()" :key="index">
                    <v-col cols="12">
                        <component
                            :is="field.component"
                            :id="field.id"
                            v-model="formData[field.id]"
                            :required="field.required"
                            :items="field.items"
                            :label="field.label"
                        />
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="6">
                        <v-btn variant="outlined" block @click="cancel">{{ cancel_title }}</v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn block @click="submit">{{ submit_title }}</v-btn>
                    </v-col>
                </v-row>
            </v-form>
        </p>
        <p v-else>
            <v-alert :text="waiting_info" :title="waiting_title" />
        </p>
    </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapState } from 'vuex'

export default {
    name: 'DynamicForm',
    inject: ['$socket'],
    props: {
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    setup (props) {
        console.info('DynamicForm setup with:', props)
        console.debug('Vue function loaded correctly', markRaw)
    },
    data () {
        return {
            form: {},
            formData: {}
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        waiting_title () {
            return this.props.waiting_title || 'Warten auf den Usertask...'
        },
        waiting_info () {
            return this.props.waiting_info || 'Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist.'
        },
        submit_title () {
            return this.props.submit_title || 'Submit your task'
        },
        cancel_title () {
            return this.props.cancel_title || 'Cancel your task'
        }
    },
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            // load the latest message from the Node-RED datastore when this widget is loaded
            // storing it in our vuex store so that we have it saved as we navigate around
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
        })
        this.$socket.on('msg-input:' + this.id, (msg) => {
            // store the latest message in our client-side vuex store when we receive a new message

            console.info(msg)

            if (msg.payload.formFields) {
                const formData = msg.payload.formFields.reduce((acc, field) => {
                    console.info('field:', field)
                    console.info('field.id:', field.id)

                    acc[field.id] = field.value || ''
                    return acc
                }, {})

                console.info('formData: ', formData)
                console.info('this.formData (1):', this.formData)

                this.formData = formData
                console.info('this.formData (2):', this.formData)
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
        hasUserTask () {
            return this.messages && this.messages[this.id] && this.messages[this.id].payload.userTask
        },
        userTask () {
            return this.hasUserTask() ? this.messages[this.id].payload.userTask : {}
        },
        fields () {
            const aFields = this.hasUserTask() ? this.userTask().userTaskConfig.formFields : []

            const fieldMap = aFields.map(field => ({
                ...field,
                component: mapFieldTypes(field.type)
            }))

            return fieldMap
        },
        hasFields () {
            return this.hasUserTask && this.userTask.userTaskConfig.formFields.length > 0
        },
        /*
            widget-action just sends a msg to Node-RED, it does not store the msg state server-side
            alternatively, you can use widget-change, which will also store the msg in the Node's datastore
        */
        send (msg) {
            this.$socket.emit('widget-action', this.id, msg)
        },
        submit () {
            this.send({ payload: { formData: this.formData, userTask: this.userTask(), action: 'submit' } })
        },
        cancel () {
            this.send({ payload: { formData: this.formData, userTask: this.userTask(), action: 'cancel' } })
        }
    }
}

function mapFieldTypes (fieldType) {
    switch (fieldType) {
    case 'string':
    case 'long':
    case 'date':
    case 'enum':
    case 'boolean':
        return 'v-text-field'
    case 'text':
        return 'v-text-field'
    case 'select':
        return 'v-select'
    case 'checkbox':
        return 'v-checkbox'
    case 'radio':
        return 'v-radio'
    case 'switch':
        return 'v-switch'
    case 'slider':
        return 'v-slider'
    case 'time':
        return 'v-time-picker'
    case 'datetime':
        return 'v-datetime-picker'
    case 'color':
        return 'v-color-picker'
    case 'file':
        return 'v-file-input'
    case 'textarea':
        return 'v-textarea'
    case 'password':
        return 'v-text-field'
    case 'number':
        return 'v-text-field'
    case 'email':
        return 'v-text-field'
    case 'tel':
        return 'v-text-field'
    case 'url':
        return 'v-text-field'
    default:
        return 'v-text-field'
    }
}

</script>

<style scoped>
/* CSS is auto scoped, but using named classes is still recommended */
@import "../stylesheets/dynamic-form.css";
</style>

<template>
  <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
  <div className="dynamic-form-wrapper">
    <p v-if="hasFields()">
      <v-form ref="form" v-model="form">
        <v-row v-for="(field, index) in fields()" :key="index">
          <v-col cols="12">
            <component
              :is="field.component"
              :id="field.id"
              v-model="formData[field.id]"
              :required="field.required"
              :items="field.items"
              :label="field.label" />
          </v-col>
        </v-row>

        <v-row style="display: flex; gap: 8px; padding: 12px">
          <div
            v-for="(action, index) in actions"
            :key="index"
            style="flex-grow: 1">
            <v-btn
              :key="index"
              style="width: 100%"
              @click="actionFn(action.label)">
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
import { markRaw } from "vue";
import { mapState } from "vuex";

export default {
  name: "DynamicForm",
  inject: ["$socket"],
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
    console.info("DynamicForm setup with:", props);
    console.debug("Vue function loaded correctly", markRaw);
  },
  data() {
    return {
      actions: [],
      form: {},
      formData: {},
    };
  },
  computed: {
    ...mapState("data", ["messages"]),
    waiting_title() {
      return this.props.waiting_title || "Warten auf den Usertask...";
    },
    waiting_info() {
      return (
        this.props.waiting_info ||
        "Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist."
      );
    },
  },
  mounted() {
    this.$socket.on("widget-load:" + this.id, (msg) => {
      this.init()

      this.$store.commit("data/bind", {
        widgetId: this.id,
        msg,
      });
    });
    this.$socket.on("msg-input:" + this.id, (msg) => {
      // store the latest message in our client-side vuex store when we receive a new message
      this.init()

      if (msg.payload && msg.payload.userTask && msg.payload.userTask.startToken && msg.payload.userTask.startToken.formData) {
              this.formData = { ...msg.payload.userTask.startToken.formData };
              console.info(this.formData)
      }

      this.$store.commit("data/bind", {
        widgetId: this.id,
        msg,
      });
    });
    // tell Node-RED that we're loading a new instance of this widget
    this.$socket.emit("widget-load", this.id);
  },
  unmounted() {
    /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
    this.$socket?.off("widget-load" + this.id);
    this.$socket?.off("msg-input:" + this.id);
  },
  methods: {
    hasUserTask() {
      return (
        this.messages &&
        this.messages[this.id] &&
        this.messages[this.id].payload.userTask
      );
    },
    userTask() {
      return this.hasUserTask() ? this.messages[this.id].payload.userTask : {};
    },
    fields() {
      const aFields = this.hasUserTask()
        ? this.userTask().userTaskConfig.formFields
        : [];

      const fieldMap = aFields.map((field) => ({
        ...field,
        component: mapFieldTypes(field.type),
        items: mapItems(field.type, field),
      }));

      return fieldMap;
    },
    hasFields() {
      return (
        this.messages &&
        this.messages[this.id] &&
        this.messages[this.id].payload.userTask !== undefined
      );
    },
    /*
            widget-action just sends a msg to Node-RED, it does not store the msg state server-side
            alternatively, you can use widget-change, which will also store the msg in the Node's datastore
        */
    send(msg, index) {
      const msgArr = [];
      msgArr[index] = msg;
      console.info(msgArr);
      this.$socket.emit("widget-action", this.id, msgArr);
    },
    init() {
      this.actions = this.props.options;
    },
    actionFn(action) {
      this.send(
        { payload: { formData: this.formData, userTask: this.userTask() } },
        this.actions.findIndex((element) => element.label === action)
      );
    },
  },
};

function mapItems(type, field) {
  if (type === "enum") {
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
    case "string":
      return "v-text-field";
    case "long":
    case "date":
      return "v-text-field";
    case "enum":
      return "v-select";
    case "boolean":
      return "v-checkbox";
    case "text":
      return "v-text-field";
    case "select":
      return "v-select";
    case "checkbox":
      return "v-checkbox";
    case "radio":
      return "v-radio";
    case "switch":
      return "v-switch";
    case "slider":
      return "v-slider";
    case "time":
      return "v-time-picker";
    case "datetime":
      return "v-datetime-picker";
    case "color":
      return "v-color-picker";
    case "file":
      return "v-file-input";
    case "textarea":
      return "v-textarea";
    case "password":
      return "v-text-field";
    case "number":
      return "v-text-field";
    case "email":
      return "v-text-field";
    case "tel":
      return "v-text-field";
    case "url":
      return "v-text-field";
    default:
      return "v-text-field";
  }
}
</script>

<style scoped>
/* CSS is auto scoped, but using named classes is still recommended */
@import "../stylesheets/dynamic-form.css";
</style>

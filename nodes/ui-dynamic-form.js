module.exports = function (RED) {
  function UIDynamicFormNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const group = RED.nodes.getNode(config.group);
    const base = group.getBase();

    const evts = {
      onAction: true,
      onInput: function (msg, send, done) {
        if (config.title_text_type && config.title_text_type !== 'str') {
          msg.dynamicTitle = RED.util.evaluateNodeProperty(config.title_text, config.title_text_type, node, msg);
        }

        base.stores.data.save(base, node, msg);

        if (done) done();
      },
    };

    if (group) {
      group.register(node, config, evts);
    } else {
      node.error('No group configured');
    }
  }

  RED.nodes.registerType('ui-dynamic-form', UIDynamicFormNode, {
    defaults: {
      outputs: { value: 1 },
    },
    outputs: function (config) {
      return config.outputs || 1;
    },
  });
};

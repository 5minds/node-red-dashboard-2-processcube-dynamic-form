module.exports = function (RED) {
    function UIDynamicFormNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group);

        const base = group.getBase();

        // server-side event handlers
        const evts = {
            onAction: true,
            onInput: function (msg, send, done) {
                // store the latest value in our Node-RED datastore
                base.stores.data.save(base, node, msg);
            },
            // TODO: mm - begin
            // onSocket: {
            //     'my-custom-event': function (conn, id, msg) {
            //         console.info('"my-custom-event" received:', conn.id, id, msg);
            //         console.info('conn.id:', conn.id);
            //         console.info('id:', id);
            //         console.info('msg:', msg);
            //         console.info('node.id:', node.id);
            //         // emit a msg in Node-RED from this node
            //         node.send(msg);
            //     },
            //},
            // TODO: mm - end
        };

        // inform the dashboard UI that we are adding this node
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

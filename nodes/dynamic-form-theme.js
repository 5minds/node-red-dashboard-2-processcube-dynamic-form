module.exports = function (RED) {
    function DynamicFormTheme(n) {
        RED.nodes.createNode(this, n);
    }
    RED.nodes.registerType('dynamic-form-theme', DynamicFormTheme);
};

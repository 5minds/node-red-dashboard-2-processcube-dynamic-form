module.exports = function (RED) {
    function DynamicFormTheme(n) {
        RED.nodes.createNode(this, n);

        this.name = n.name;

        this.colors = n.colors;
    }
    RED.nodes.registerType('dynamic-form-theme', DynamicFormTheme);
};

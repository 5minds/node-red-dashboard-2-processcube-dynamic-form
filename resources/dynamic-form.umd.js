(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode(".dynamic-form-wrapper[data-v-19b58e9c]{padding:10px;margin:10px;border:1px solid black}.dynamic-form-class[data-v-19b58e9c]{color:green;font-weight:700}h1[data-v-19b58e9c]{margin-bottom:10px}h2[data-v-19b58e9c]{margin-top:1.5rem;margin-bottom:.75rem}h3[data-v-19b58e9c]{margin-top:1rem}p[data-v-19b58e9c]{margin-bottom:5px}ul li[data-v-19b58e9c]{list-style-type:circle;list-style-position:inside;margin-left:15px}pre[data-v-19b58e9c]{padding:12px;margin:12px;background-color:#eee}code[data-v-19b58e9c]{font-size:.825rem;color:#ae0000}")),document.head.appendChild(e)}}catch(a){console.error("vite-plugin-css-injected-by-js",a)}})();
(function(a,e){typeof exports=="object"&&typeof module<"u"?e(exports,require("vue"),require("vuex")):typeof define=="function"&&define.amd?define(["exports","vue","vuex"],e):(a=typeof globalThis<"u"?globalThis:a||self,e(a["dynamic-form"]={},a.Vue,a.vuex))})(this,function(a,e,u){"use strict";const f=(t,o)=>{const s=t.__vccOpts||t;for(const[n,c]of o)s[n]=c;return s},p={name:"DynamicForm",inject:["$socket"],props:{id:{type:String,required:!0},props:{type:Object,default:()=>({})},state:{type:Object,default:()=>({enabled:!1,visible:!1})}},setup(t){console.info("DynamicForm setup with:",t),console.debug("Vue function loaded correctly",e.markRaw)},data(){return{form:{},formData:{}}},computed:{...u.mapState("data",["messages"]),waiting_title(){return this.props.waiting_title||"Warten auf den Usertask..."},waiting_info(){return this.props.waiting_info||"Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist."},submit_title(){return this.props.submit_title||"Submit your task"},cancel_title(){return this.props.cancel_title||"Cancel your task"}},mounted(){this.$socket.on("widget-load:"+this.id,t=>{this.$store.commit("data/bind",{widgetId:this.id,msg:t})}),this.$socket.on("msg-input:"+this.id,t=>{if(console.info(t),t.payload.formFields){const o=t.payload.formFields.reduce((s,n)=>(console.info("field:",n),console.info("field.id:",n.id),s[n.id]=n.value||"",s),{});console.info("formData: ",o),console.info("this.formData (1):",this.formData),this.formData=o,console.info("this.formData (2):",this.formData)}this.$store.commit("data/bind",{widgetId:this.id,msg:t})}),this.$socket.emit("widget-load",this.id)},unmounted(){var t,o;(t=this.$socket)==null||t.off("widget-load"+this.id),(o=this.$socket)==null||o.off("msg-input:"+this.id)},methods:{hasUserTask(){return this.messages&&this.messages[this.id]&&this.messages[this.id].payload.userTask},userTask(){return this.hasUserTask()?this.messages[this.id].payload.userTask:{}},fields(){return(this.hasUserTask()?this.userTask().userTaskConfig.formFields:[]).map(s=>({...s,component:k(s.type),items:h(s.type,s)}))},hasFields(){return this.hasUserTask&&this.userTask.userTaskConfig.formFields.length>0},send(t){this.$socket.emit("widget-action",this.id,t)},submit(){this.send({payload:{formData:this.formData,userTask:this.userTask(),action:"submit"}})},cancel(){this.send({payload:{formData:this.formData,userTask:this.userTask(),action:"cancel"}})}}};function h(t,o){return t==="enum"?o.enumValues.map(s=>({title:s.name,value:s.id})):null}function k(t){switch(t){case"string":return"v-text-field";case"long":case"date":return"v-text-field";case"enum":return"v-select";case"boolean":return"v-checkbox";case"text":return"v-text-field";case"select":return"v-select";case"checkbox":return"v-checkbox";case"radio":return"v-radio";case"switch":return"v-switch";case"slider":return"v-slider";case"time":return"v-time-picker";case"datetime":return"v-datetime-picker";case"color":return"v-color-picker";case"file":return"v-file-input";case"textarea":return"v-textarea";case"password":return"v-text-field";case"number":return"v-text-field";case"email":return"v-text-field";case"tel":return"v-text-field";case"url":return"v-text-field";default:return"v-text-field"}}const _={className:"dynamic-form-wrapper"},y={key:0},b={key:1};function x(t,o,s,n,c,i){const l=e.resolveComponent("v-col"),d=e.resolveComponent("v-row"),m=e.resolveComponent("v-btn"),g=e.resolveComponent("v-form"),C=e.resolveComponent("v-alert");return e.openBlock(),e.createElementBlock(e.Fragment,null,[e.createCommentVNode(" Component must be wrapped in a block so props such as className and style can be passed in from parent "),e.createElementVNode("div",_,[i.hasFields?(e.openBlock(),e.createElementBlock("p",y,[e.createVNode(g,{ref:"form",modelValue:c.form,"onUpdate:modelValue":o[0]||(o[0]=r=>c.form=r)},{default:e.withCtx(()=>[(e.openBlock(!0),e.createElementBlock(e.Fragment,null,e.renderList(i.fields(),(r,D)=>(e.openBlock(),e.createBlock(d,{key:D},{default:e.withCtx(()=>[e.createVNode(l,{cols:"12"},{default:e.withCtx(()=>[(e.openBlock(),e.createBlock(e.resolveDynamicComponent(r.component),{id:r.id,modelValue:c.formData[r.id],"onUpdate:modelValue":T=>c.formData[r.id]=T,required:r.required,items:r.items,label:r.label},null,8,["id","modelValue","onUpdate:modelValue","required","items","label"]))]),_:2},1024)]),_:2},1024))),128)),e.createVNode(d,null,{default:e.withCtx(()=>[e.createVNode(l,{cols:"6"},{default:e.withCtx(()=>[e.createVNode(m,{variant:"outlined",block:"",onClick:i.cancel},{default:e.withCtx(()=>[e.createTextVNode(e.toDisplayString(i.cancel_title),1)]),_:1},8,["onClick"])]),_:1}),e.createVNode(l,{cols:"6"},{default:e.withCtx(()=>[e.createVNode(m,{block:"",onClick:i.submit},{default:e.withCtx(()=>[e.createTextVNode(e.toDisplayString(i.submit_title),1)]),_:1},8,["onClick"])]),_:1})]),_:1})]),_:1},8,["modelValue"])])):(e.openBlock(),e.createElementBlock("p",b,[e.createVNode(C,{text:i.waiting_info,title:i.waiting_title},null,8,["text","title"])]))])],2112)}const w=f(p,[["render",x],["__scopeId","data-v-19b58e9c"],["__file","/Users/moellenbeck/projects/5minds/reps/node-red-dashboard-2-processcube-dynamic-form/ui/components/DynamicForm.vue"]]);a.DynamicForm=w,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=dynamic-form.umd.js.map

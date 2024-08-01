(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode(".dynamic-form-wrapper[data-v-0d226515]{padding:10px;margin:10px;border:1px solid black}.dynamic-form-class[data-v-0d226515]{color:green;font-weight:700}h1[data-v-0d226515]{margin-bottom:10px}h2[data-v-0d226515]{margin-top:1.5rem;margin-bottom:.75rem}h3[data-v-0d226515]{margin-top:1rem}p[data-v-0d226515]{margin-bottom:5px}ul li[data-v-0d226515]{list-style-type:circle;list-style-position:inside;margin-left:15px}pre[data-v-0d226515]{padding:12px;margin:12px;background-color:#eee}code[data-v-0d226515]{font-size:.825rem;color:#ae0000}")),document.head.appendChild(e)}}catch(a){console.error("vite-plugin-css-injected-by-js",a)}})();
(function(n,e){typeof exports=="object"&&typeof module<"u"?e(exports,require("vue"),require("vuex")):typeof define=="function"&&define.amd?define(["exports","vue","vuex"],e):(n=typeof globalThis<"u"?globalThis:n||self,e(n["ui-dynamic-form"]={},n.Vue,n.vuex))})(this,function(n,e,h){"use strict";const f=(t,r)=>{const s=t.__vccOpts||t;for(const[d,i]of r)s[d]=i;return s},u={name:"DynamicForm",inject:["$socket"],props:{id:{type:String,required:!0},props:{type:Object,default:()=>({})},state:{type:Object,default:()=>({enabled:!1,visible:!1})}},setup(t){console.info("DynamicForm setup with:",t),console.debug("Vue function loaded correctly",e.markRaw)},data(){return{actions:[],form:{},formData:{},error:!1,errorMsg:""}},computed:{...h.mapState("data",["messages"]),waiting_title(){return this.props.waiting_title||"Warten auf den Usertask..."},waiting_info(){return this.props.waiting_info||"Der Usertask wird automatisch angezeigt, wenn ein entsprechender Task vorhanden ist."}},mounted(){this.$socket.on("widget-load:"+this.id,t=>{this.init(),this.$store.commit("data/bind",{widgetId:this.id,msg:t})}),this.$socket.on("msg-input:"+this.id,t=>{this.init(),t.payload&&t.payload.userTask&&t.payload.userTask.startToken&&(this.formData={...t.payload.userTask.startToken},console.info(this.formData)),this.$store.commit("data/bind",{widgetId:this.id,msg:t})}),this.$socket.emit("widget-load",this.id)},unmounted(){var t,r;(t=this.$socket)==null||t.off("widget-load"+this.id),(r=this.$socket)==null||r.off("msg-input:"+this.id)},methods:{hasUserTask(){return this.messages&&this.messages[this.id]&&this.messages[this.id].payload.userTask},userTask(){return this.hasUserTask()?this.messages[this.id].payload.userTask:{}},fields(){return(this.hasUserTask()?this.userTask().userTaskConfig.formFields:[]).map(s=>({...s,component:_(s.type),items:k(s.type,s)}))},hasFields(){return this.messages&&this.messages[this.id]&&this.messages[this.id].payload.userTask!==void 0},send(t,r){const s=[];s[r]=t,console.info(s),this.$socket.emit("widget-action",this.id,s)},init(){console.info(this.props.options),this.actions=this.props.options},actionFn(t){this.checkCondition(t.condition)?(this.showError(!1,""),this.send({payload:{formData:this.formData,userTask:this.userTask()}},this.actions.findIndex(r=>r.label===t.label))):this.showError(!0,t.errorMessage)},checkCondition(t){try{return!!Function("fields",'"use strict"; return ('+t+")")(this.formData)}catch(r){return console.error("Error while evaluating condition: "+r),!1}},showError(t,r){this.error=t,this.errorMsg=r}}};function k(t,r){return t==="enum"?r.enumValues.map(s=>({title:s.name,value:s.id})):null}function _(t){switch(t){case"string":return"v-text-field";case"long":case"date":return"v-text-field";case"enum":return"v-select";case"boolean":return"v-checkbox";case"text":return"v-text-field";case"select":return"v-select";case"checkbox":return"v-checkbox";case"radio":return"v-radio";case"switch":return"v-switch";case"slider":return"v-slider";case"time":return"v-time-picker";case"datetime":return"v-datetime-picker";case"color":return"v-color-picker";case"file":return"v-file-input";case"textarea":return"v-textarea";case"password":return"v-text-field";case"number":return"v-text-field";case"email":return"v-text-field";case"tel":return"v-text-field";case"url":return"v-text-field";default:return"v-text-field"}}const y={className:"dynamic-form-wrapper"},g={key:0},x={key:1};function w(t,r,s,d,i,a){const b=e.resolveComponent("v-col"),l=e.resolveComponent("v-row"),m=e.resolveComponent("v-alert"),B=e.resolveComponent("v-btn"),C=e.resolveComponent("v-form");return e.openBlock(),e.createElementBlock("div",y,[a.hasFields()?(e.openBlock(),e.createElementBlock("p",g,[e.createVNode(C,{ref:"form",modelValue:i.form,"onUpdate:modelValue":r[0]||(r[0]=o=>i.form=o)},{default:e.withCtx(()=>[(e.openBlock(!0),e.createElementBlock(e.Fragment,null,e.renderList(a.fields(),(o,c)=>(e.openBlock(),e.createBlock(l,{key:c},{default:e.withCtx(()=>[e.createVNode(b,{cols:"12"},{default:e.withCtx(()=>[(e.openBlock(),e.createBlock(e.resolveDynamicComponent(o.component),{id:o.id,modelValue:i.formData[o.id],"onUpdate:modelValue":p=>i.formData[o.id]=p,required:o.required,items:o.items,label:o.label},null,8,["id","modelValue","onUpdate:modelValue","required","items","label"]))]),_:2},1024)]),_:2},1024))),128)),e.createVNode(l,{style:{padding:"12px"}},{default:e.withCtx(()=>[i.error?(e.openBlock(),e.createBlock(m,{key:0,type:"error"},{default:e.withCtx(()=>[e.createTextVNode("Error: "+e.toDisplayString(i.errorMsg),1)]),_:1})):e.createCommentVNode("",!0)]),_:1}),e.createVNode(l,{style:{display:"flex",gap:"8px",padding:"12px"}},{default:e.withCtx(()=>[(e.openBlock(!0),e.createElementBlock(e.Fragment,null,e.renderList(i.actions,(o,c)=>(e.openBlock(),e.createElementBlock("div",{key:c,style:{"flex-grow":"1"}},[(e.openBlock(),e.createBlock(B,{key:c,style:{width:"100%"},onClick:p=>a.actionFn(o)},{default:e.withCtx(()=>[e.createTextVNode(e.toDisplayString(o.label),1)]),_:2},1032,["onClick"]))]))),128))]),_:1})]),_:1},8,["modelValue"])])):(e.openBlock(),e.createElementBlock("p",x,[e.createVNode(m,{text:a.waiting_info,title:a.waiting_title},null,8,["text","title"])]))])}const T=f(u,[["render",w],["__scopeId","data-v-0d226515"]]);n.DynamicForm=T,Object.defineProperty(n,Symbol.toStringTag,{value:"Module"})});

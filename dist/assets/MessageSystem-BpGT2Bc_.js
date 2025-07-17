class r{constructor(e={}){this.config=this.mergeDefaultConfig(e),this.messageQueue=[],this.activeMessages=new Set,this.container=null,this.messageIdCounter=0,this.isInitialized=!1}mergeDefaultConfig(e){const s={position:"top-right",duration:3e3,maxMessages:5,animation:!0,animationDuration:300,spacing:10,types:{info:{className:"message-info",icon:"ℹ️",duration:3e3},success:{className:"message-success",icon:"✅",duration:3e3},error:{className:"message-error",icon:"❌",duration:5e3},warning:{className:"message-warning",icon:"⚠️",duration:4e3},win:{className:"message-win",icon:"🎉",duration:5e3}}};return this.deepMerge(s,e)}deepMerge(e,s){const i={...e};for(const t in s)s[t]&&typeof s[t]=="object"&&!Array.isArray(s[t])?i[t]=this.deepMerge(e[t]||{},s[t]):i[t]=s[t];return i}async init(){return this.createContainer(),this.injectStyles(),this.isInitialized=!0,Promise.resolve()}createContainer(){if(this.config.container&&typeof this.config.container=="string"){const s=document.querySelector(this.config.container);if(s){this.container=s,this.container.className=`message-container message-${this.config.position}`;return}}let e=document.getElementById("message-container");if(e){this.container=e;return}this.container=document.createElement("div"),this.container.id="message-container",this.container.className=`message-container message-${this.config.position}`,document.body.appendChild(this.container)}injectStyles(){if(document.getElementById("message-system-styles"))return;const e=document.createElement("style");e.id="message-system-styles",e.textContent=`
            .message-container {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }

            .message-container.message-top-right {
                top: 20px;
                right: 20px;
            }

            .message-container.message-top-left {
                top: 20px;
                left: 20px;
            }

            .message-container.message-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .message-container.message-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .message-container.message-top-center {
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .message-container.message-bottom-center {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .message-toast {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                color: #1f2937;
                padding: 16px 20px;
                border-radius: 16px;
                margin-bottom: ${this.config.spacing}px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                font-weight: 500;
                max-width: 100%;
                word-wrap: break-word;
                transition: all ${this.config.animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .message-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }

            .message-toast.message-entering {
                opacity: 0;
                transform: translateX(120%) scale(0.9);
            }

            .message-toast.message-entered {
                opacity: 1;
                transform: translateX(0) scale(1);
            }

            .message-toast.message-exiting {
                opacity: 0;
                transform: translateX(120%) scale(0.9);
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
                max-height: 0;
            }

            .message-toast:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15);
            }

            .message-toast.message-info {
                background: rgba(59, 130, 246, 0.95);
                color: white;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }

            .message-toast.message-info::before {
                background: linear-gradient(90deg, #93c5fd, #3b82f6, #1d4ed8);
            }

            .message-toast.message-success {
                background: rgba(34, 197, 94, 0.95);
                color: white;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }

            .message-toast.message-success::before {
                background: linear-gradient(90deg, #86efac, #22c55e, #15803d);
            }

            .message-toast.message-error {
                background: rgba(239, 68, 68, 0.95);
                color: white;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .message-toast.message-error::before {
                background: linear-gradient(90deg, #fca5a5, #ef4444, #dc2626);
            }

            .message-toast.message-warning {
                background: rgba(245, 158, 11, 0.95);
                color: white;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .message-toast.message-warning::before {
                background: linear-gradient(90deg, #fcd34d, #f59e0b, #d97706);
            }

            .message-toast.message-win {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(59, 130, 246, 0.95));
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                animation: winPulse 2s ease-in-out infinite;
            }

            .message-toast.message-win::before {
                background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                background-size: 200% 100%;
                animation: gradientShift 3s ease-in-out infinite;
            }

            @keyframes winPulse {
                0%, 100% { 
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                50% { 
                    box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 8px 16px rgba(59, 130, 246, 0.3);
                }
            }

            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            .message-icon {
                flex-shrink: 0;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .message-content {
                flex: 1;
                font-weight: 500;
                letter-spacing: 0.01em;
            }

            .message-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 6px;
                margin-left: 8px;
                opacity: 0.8;
                font-size: 16px;
                line-height: 1;
                flex-shrink: 0;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .message-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .message-close:active {
                transform: scale(0.95);
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .message-toast {
                    background: rgba(31, 41, 55, 0.95);
                    color: white;
                    border: 1px solid rgba(75, 85, 99, 0.3);
                }
                
                .message-icon {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .message-close {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .message-close:hover {
                    background: rgba(255, 255, 255, 0.25);
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 640px) {
                .message-container {
                    left: 10px !important;
                    right: 10px !important;
                    top: 10px !important;
                    max-width: none;
                    transform: none !important;
                }
                
                .message-toast {
                    padding: 14px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    margin-bottom: 8px;
                }
                
                .message-icon {
                    width: 28px;
                    height: 28px;
                    font-size: 16px;
                }
                
                .message-close {
                    width: 24px;
                    height: 24px;
                    font-size: 14px;
                }
            }
        `,document.head.appendChild(e)}show(e,s="info",i={}){this.isInitialized||this.init();const t=this.generateMessageId(),a=this.config.types&&this.config.types[s]||this.config.types&&this.config.types.info||{duration:3e3,className:"message-info",icon:"ℹ️"},n={id:t,content:e,type:s,typeConfig:a,options:{duration:i.duration!==void 0?i.duration:a.duration,dismissible:i.dismissible!==!1,persistent:i.persistent||!1,...i},timestamp:Date.now()};return this.messageQueue.push(n),this.processQueue(),t}info(e,s={}){return this.show(e,"info",s)}success(e,s={}){return this.show(e,"success",s)}error(e,s={}){return this.show(e,"error",s)}warning(e,s={}){return this.show(e,"warning",s)}win(e,s={}){return this.show(e,"win",s)}processQueue(){if(this.container){for(;this.activeMessages.size>=this.config.maxMessages&&this.activeMessages.size>0;){const e=Array.from(this.activeMessages)[0];this.hide(e)}for(;this.messageQueue.length>0&&this.activeMessages.size<this.config.maxMessages;){const e=this.messageQueue.shift();this.displayMessage(e)}}}displayMessage(e){if(!this.container)return;const s=this.createMessageElement(e);this.container.appendChild(s),this.activeMessages.add(e.id),this.config.animation&&this.animateIn(s),e.options.duration>0&&!e.options.persistent&&setTimeout(()=>{this.hide(e.id)},e.options.duration),e.element=s}createMessageElement(e){const s=document.createElement("div");s.className=`message message-toast ${e.typeConfig.className}`,s.dataset.messageId=e.id;const i=document.createElement("span");i.className="message-icon",i.textContent=e.typeConfig.icon||"";const t=document.createElement("div");t.className="message-content",t.textContent=e.content;let a=null;return e.options.dismissible&&(a=document.createElement("button"),a.className="message-close",a.innerHTML="×",a.addEventListener("click",()=>this.hide(e.id))),s.appendChild(i),s.appendChild(t),a&&s.appendChild(a),s}animateIn(e){e.classList.add("message-entering"),e.offsetHeight,requestAnimationFrame(()=>{e.classList.remove("message-entering"),e.classList.add("message-entered")})}animateOut(e){return new Promise(s=>{if(!this.config.animation){s();return}e.classList.remove("message-entered"),e.classList.add("message-exiting"),setTimeout(()=>{s()},this.config.animationDuration)})}async hide(e){if(!this.container)return!1;const s=this.container.querySelector(`[data-message-id="${e}"]`);return s?(this.activeMessages.delete(e),await this.animateOut(s),s.parentNode&&s.parentNode.removeChild(s),this.processQueue(),!0):!1}async hideAll(){const e=Array.from(this.activeMessages);let s=0;for(const i of e)await this.hide(i)&&s++;return s}clear(){this.container&&(this.container.innerHTML=""),this.activeMessages.clear(),this.messageQueue.length=0}getActiveCount(){return this.activeMessages.size}getQueuedCount(){return this.messageQueue.length}isActive(e){return this.activeMessages.has(e)}generateMessageId(){return`msg_${Date.now()}_${++this.messageIdCounter}`}setPosition(e){this.container.className=`message-container message-${e}`,this.config.position=e}updateConfig(e){if(this.config=this.deepMerge(this.config,e),e.animationDuration||e.spacing){const s=document.getElementById("message-system-styles");s&&s.remove(),this.injectStyles()}}getDebugInfo(){return{activeMessages:this.activeMessages.size,queuedMessages:this.messageQueue.length,position:this.config.position,maxMessages:this.config.maxMessages,config:{...this.config}}}showMessage(e,s="info",i={}){return this.show(e,s,i)}removeMessage(e){if(!this.container)return!1;const s=this.container.querySelector(`[data-message-id="${e}"]`);return s?(s.parentNode&&s.parentNode.removeChild(s),this.activeMessages.delete(e),!0):!1}clearAllMessages(){return this.hideAll()}clearMessagesByType(e){if(!this.container)return 0;const s=this.container.querySelectorAll(`.message-${e}`);let i=0;return Array.from(s).forEach(t=>{const a=t.dataset.messageId;a&&(t.parentNode&&t.parentNode.removeChild(t),this.activeMessages.delete(a),i++)}),i}getMessageCount(e=null){return this.container?e?this.container.querySelectorAll(`.message-${e}`).length:this.activeMessages.size:0}showProgress(e,s=0,i={}){this.isInitialized||this.init();const t=this.generateMessageId();({...i});const a=this.createProgressElement(e,s,t);this.container&&(this.container.appendChild(a),this.activeMessages.add(t));const n={id:t,element:a,progress:s,content:e};return this.progressMessages=this.progressMessages||new Map,this.progressMessages.set(t,n),t}updateProgress(e,s){const i=this.progressMessages&&this.progressMessages.get(e);if(!i)return!1;const t=i.element.querySelector(".progress-bar");return t?(t.style.width=`${Math.max(0,Math.min(100,s))}%`,i.progress=s,!0):!1}completeProgress(e,s="Completed!"){const i=this.progressMessages&&this.progressMessages.get(e);if(!i)return!1;const t=i.element.querySelector(".message-content");t&&(t.textContent=s);const a=i.element.querySelector(".progress-bar");return a&&a.remove(),setTimeout(()=>{this.hide(e),this.progressMessages&&this.progressMessages.delete(e)},2e3),!0}showLoading(e,s={}){this.isInitialized||this.init();const i=this.generateMessageId();({...s});const t=this.createLoadingElement(e,i);return this.container&&(this.container.appendChild(t),this.activeMessages.add(i)),i}createProgressElement(e,s,i){const t=document.createElement("div");return t.className="message message-toast message-info",t.dataset.messageId=i,t.innerHTML=`
            <span class="message-icon">📊</span>
            <div class="message-content">${e}</div>
            <div class="progress-bar" style="position: absolute; bottom: 0; left: 0; height: 3px; background: #3498db; width: ${s}%; transition: width 0.3s ease; border-radius: 0 0 8px 8px;"></div>
        `,t}createLoadingElement(e,s){const i=document.createElement("div");if(i.className="message message-toast message-info",i.dataset.messageId=s,i.innerHTML=`
            <div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid #e3e3e3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div class="message-content">${e}</div>
        `,!document.getElementById("spinner-animation")){const t=document.createElement("style");t.id="spinner-animation",t.textContent=`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `,document.head.appendChild(t)}return i}setModalContent(e,s){return!1}getModalContent(e){return""}setModalTitle(e,s){return!1}getDebugInfo(){let e=[];return this.container&&(e=Array.from(new Set(Array.from(this.container.querySelectorAll(".message-toast")).map(s=>s.className.split(" ").find(t=>t.startsWith("message-")&&t!=="message-toast")))).filter(Boolean)),{isInitialized:this.isInitialized,messageCount:this.activeMessages.size,messageTypes:e,config:{...this.config},container:this.container?"found":"missing",position:this.config.position,activeMessages:this.activeMessages.size,queuedMessages:this.messageQueue.length,maxMessages:this.config.maxMessages}}getStatistics(){const e={};return this.container&&this.container.querySelectorAll(".message-toast").forEach(i=>{const a=i.className.split(" ").find(n=>n.startsWith("message-")&&n!=="message-toast");if(a){const n=a.replace("message-","");e[n]=(e[n]||0)+1}}),{totalMessages:this.activeMessages.size,messagesByType:e,averageDisplayTime:this.config.duration,currentMessages:this.activeMessages.size,messagesByCurrentType:e}}validateConfiguration(){const e=[],s=[];return["top-left","top-right","top-center","bottom-left","bottom-right","bottom-center"].includes(this.config.position)||s.push(`Invalid position "${this.config.position}"`),(typeof this.config.duration!="number"||this.config.duration<0)&&e.push("Duration must be a non-negative number"),(typeof this.config.maxMessages!="number"||this.config.maxMessages<1)&&e.push("maxMessages must be a positive number"),(!this.config.types||typeof this.config.types!="object")&&e.push("Message types configuration is missing or invalid"),{valid:e.length===0,errors:e,warnings:s}}hasVisibleModal(){return this.activeMessages.size>0}getVisibleModals(){return Array.from(this.activeMessages)}destroy(){this.clear(),this.container&&this.container.parentNode&&this.container.parentNode.removeChild(this.container);const e=document.getElementById("message-system-styles");e&&e.remove();const s=document.getElementById("spinner-animation");s&&s.remove(),this.progressMessages&&this.progressMessages.clear()}}export{r as MessageSystem};
//# sourceMappingURL=MessageSystem-BpGT2Bc_.js.map

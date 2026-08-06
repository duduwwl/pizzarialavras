const pizzas = [
  {id:'mussarela',category:'tradicionais',name:'Mussarela Clássica',description:'Molho da casa, mussarela derretida, tomate fresco e orégano.',media:38,grande:49},
  {id:'calabresa',category:'tradicionais',name:'Calabresa da Vila',description:'Calabresa fatiada, cebola roxa, mussarela e orégano.',media:41,grande:53},
  {id:'marguerita',category:'tradicionais',name:'Marguerita',description:'Mussarela, tomate, manjericão fresco e um toque de azeite.',media:42,grande:54},
  {id:'portuguesa',category:'tradicionais',name:'Portuguesa',description:'Presunto, ovos, cebola, pimentão, ervilha, mussarela e azeitonas.',media:45,grande:57},
  {id:'frango',category:'tradicionais',name:'Frango com Catupiry',description:'Frango bem temperado, Catupiry cremoso, mussarela e orégano.',media:46,grande:58},
  {id:'lavras',category:'especiais',name:'Lavras Especial',description:'Frango cremoso, bacon crocante, milho, mussarela e molho da casa.',media:48,grande:61},
  {id:'lombo',category:'especiais',name:'Lombo Mineiro',description:'Lombo defumado, requeijão, cebola caramelizada e mussarela.',media:49,grande:62},
  {id:'quatro',category:'especiais',name:'Quatro Queijos',description:'Mussarela, provolone, parmesão, gorgonzola e um toque de orégano.',media:51,grande:65},
  {id:'rucula',category:'especiais',name:'Rúcula & Tomate Seco',description:'Mussarela, tomate seco, rúcula fresca e pesto suave.',media:50,grande:64},
  {id:'romeu',category:'doces',name:'Romeu & Julieta',description:'Mussarela dourada, goiabada cremosa e pitada de canela.',media:43,grande:55},
  {id:'chocolate',category:'doces',name:'Chocolate Crocante',description:'Chocolate ao leite, granulado crocante e borda levemente dourada.',media:45,grande:57},
  {id:'banana',category:'doces',name:'Banana Caramelada',description:'Banana, canela, leite condensado e farofa crocante da casa.',media:44,grande:56}
];

const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let firebaseOrderStorePromise;

function getFirebaseOrderStore(){
  if(!firebaseOrderStorePromise){
    firebaseOrderStorePromise=import('./firebase-order-store.js?v=15').catch(error=>{
      firebaseOrderStorePromise=null;
      throw error;
    });
  }
  return firebaseOrderStorePromise;
}

document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());

// Shared account experience ----------------------------------------------------------
const authDialog=document.querySelector('[data-auth-dialog]');
let customerSession=null;
let authMode='login';

function authErrorCopy(error){
  const code=error?.code||'';
  const messages={
    'auth/invalid-email':'Confira o e-mail informado.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/user-not-found':'Não encontramos uma conta com este e-mail.',
    'auth/wrong-password':'E-mail ou senha incorretos.',
    'auth/email-already-in-use':'Já existe uma conta com este e-mail. Entre com ela.',
    'auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.',
    'auth/popup-closed-by-user':'A janela do Google foi fechada antes da conclusão.',
    'auth/operation-not-allowed':'Este método de login ainda não está habilitado no Firebase.',
    'auth/unauthorized-domain':'Este domínio ainda não está autorizado no Firebase.'
  };
  return messages[code]||'Não foi possível concluir o login agora. Tente novamente.';
}

function setAuthFeedback(message='',isError=false){
  document.querySelectorAll('[data-auth-feedback]').forEach(node=>{
    node.textContent=message;
    node.classList.toggle('is-error',Boolean(message&&isError));
  });
}

function setAuthLoading(isLoading,label=''){ 
  document.querySelectorAll('[data-auth-email-submit],[data-auth-google]').forEach(button=>button.disabled=isLoading);
  document.querySelectorAll('[data-auth-email-submit]').forEach(button=>{
    button.textContent=isLoading?label:(authMode==='signup'?'Criar minha conta':'Entrar na minha conta');
  });
}

function userLabel(session){
  return session?.displayName||session?.email?.split('@')[0]||'Sua conta';
}

function renderSession(session){
  customerSession=session?.isAuthenticated?session:null;
  const signedIn=Boolean(customerSession);
  document.querySelectorAll('[data-auth-signed-out]').forEach(node=>node.hidden=signedIn);
  document.querySelectorAll('[data-auth-signed-in]').forEach(node=>node.hidden=!signedIn);
  document.querySelectorAll('[data-auth-trigger-label]').forEach(node=>node.textContent=signedIn?'Minha conta':'Entrar');
  document.querySelectorAll('[data-auth-profile]').forEach(node=>node.textContent=signedIn?`${userLabel(customerSession)} · ${customerSession.email}`:'');
  document.querySelectorAll('[data-checkout-signed-out]').forEach(node=>node.hidden=signedIn);
  document.querySelectorAll('[data-checkout-signed-in]').forEach(node=>node.hidden=!signedIn);
  document.querySelectorAll('[data-checkout-account-name]').forEach(node=>node.textContent=signedIn?userLabel(customerSession):'Conta conectada');
  document.querySelectorAll('[data-checkout-account-email]').forEach(node=>node.textContent=signedIn?customerSession.email:'');
  const nameInput=document.querySelector('input[name="name"]');
  if(signedIn&&nameInput&&!nameInput.value&&customerSession.displayName)nameInput.value=customerSession.displayName;
}

function updateAuthMode(mode){
  authMode=mode==='signup'?'signup':'login';
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.classList.toggle('active',button.dataset.authMode===authMode));
  document.querySelectorAll('[data-auth-email-submit]').forEach(button=>button.textContent=authMode==='signup'?'Criar minha conta':'Entrar na minha conta');
  document.querySelectorAll('[data-auth-password]').forEach(input=>input.autocomplete=authMode==='signup'?'new-password':'current-password');
  setAuthFeedback(authMode==='signup'?'Crie sua conta para acompanhar o pedido.':'');
}

function openAuthDialog(){
  if(!authDialog)return;
  if(typeof authDialog.showModal==='function'&&!authDialog.open)authDialog.showModal();
  else authDialog.setAttribute('open','');
  document.querySelector('[data-auth-email]')?.focus();
}

function closeAuthDialog(){
  if(!authDialog)return;
  if(typeof authDialog.close==='function'&&authDialog.open)authDialog.close();
  else authDialog.removeAttribute('open');
}

if(authDialog){
  document.querySelectorAll('[data-open-auth]').forEach(button=>button.addEventListener('click',openAuthDialog));
  document.querySelectorAll('[data-auth-close]').forEach(button=>button.addEventListener('click',closeAuthDialog));
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>updateAuthMode(button.dataset.authMode)));
  document.querySelectorAll('[data-auth-signout]').forEach(button=>button.addEventListener('click',async()=>{
    try{
      const store=await getFirebaseOrderStore();
      await store.signOutUser();
      setAuthFeedback('Você saiu da sua conta.');
    }catch(error){setAuthFeedback('Não foi possível sair da conta agora.',true)}
  }));
  document.querySelectorAll('[data-auth-email-submit]').forEach(button=>button.addEventListener('click',async()=>{
    const email=String(document.querySelector('[data-auth-email]')?.value||'').trim();
    const password=String(document.querySelector('[data-auth-password]')?.value||'');
    if(!email||!password){setAuthFeedback('Informe seu e-mail e sua senha.',true);return}
    setAuthLoading(true,authMode==='signup'?'Criando conta…':'Entrando…');
    setAuthFeedback();
    try{
      const store=await getFirebaseOrderStore();
      const name=String(document.querySelector('input[name="name"]')?.value||'').trim();
      if(authMode==='signup')await store.signUpWithEmail(email,password,name);
      else await store.signInWithEmail(email,password);
      setAuthFeedback(authMode==='signup'?'Conta criada. Enviamos um e-mail de confirmação para você.':'Login realizado com sucesso.');
      closeAuthDialog();
    }catch(error){setAuthFeedback(authErrorCopy(error),true)}
    finally{setAuthLoading(false)}
  }));
  document.querySelectorAll('[data-auth-google]').forEach(button=>button.addEventListener('click',async()=>{
    setAuthLoading(true,'Abrindo Google…');
    setAuthFeedback();
    try{
      const store=await getFirebaseOrderStore();
      await store.signInWithGoogle();
      closeAuthDialog();
    }catch(error){setAuthFeedback(authErrorCopy(error),true)}
    finally{setAuthLoading(false)}
  }));
  getFirebaseOrderStore().then(store=>{
    renderSession(store.getCurrentSession());
    store.onSessionChange(renderSession);
  }).catch(()=>setAuthFeedback('O login estará disponível quando o Firebase estiver conectado.',true));
}

// Ordering flow ---------------------------------------------------------------------
const menuGrid=document.querySelector('[data-menu-grid]');
if(menuGrid){
  const MAX_CART_ITEMS=6;
  const state={filter:'todos',mode:'single',size:'media',fulfillment:'delivery',flavors:[],cart:[]};
  const category={tradicionais:'Tradicional',especiais:'Especial',doces:'Doce'};
  const pizzaImages={
    tradicionais:{src:'./assets/pizza-calabresa-real.png',alt:'Pizza de calabresa com queijo derretido e cebola roxa'},
    especiais:{src:'./assets/pizza-especial-real.png',alt:'Pizza especial de frango, bacon, milho e mussarela'},
    doces:{src:'./assets/pizza-doce-real.png',alt:'Pizza doce com queijo e goiabada cremosa'}
  };
  const flavors=document.querySelector('[data-selected-flavors]');
  const builderMessage=document.querySelector('[data-builder-message]');
  const cartItems=document.querySelector('[data-cart-items]');
  const cartCount=document.querySelector('[data-cart-count]');
  const subtotal=document.querySelector('[data-subtotal]');
  const delivery=document.querySelector('[data-delivery]');
  const fulfillmentFeeLabel=document.querySelector('[data-fulfillment-fee-label]');
  const total=document.querySelector('[data-total]');
  const form=document.querySelector('[data-checkout-form]');
  const feedback=document.querySelector('[data-feedback]');
  let isSavingOrder=false;
  const modeNeeded=()=>state.mode==='duo'?2:1;
  const priceOf=pizza=>pizza[state.size];

  function renderMenu(){
    const visible=state.filter==='todos'?pizzas:pizzas.filter(pizza=>pizza.category===state.filter);
    menuGrid.innerHTML=visible.map(pizza=>{
      const picked=state.flavors.some(item=>item.id===pizza.id);
      const visual=pizzaImages[pizza.category];
      return `<article class="pizza-card pizza-card-photo ${picked?'selected':''}"><div class="pizza-photo"><img src="${visual.src}" alt="${visual.alt}" /><span>${category[pizza.category]}</span></div><div class="pizza-card-content"><h3>${pizza.name}</h3><p class="description">${pizza.description}</p><div class="pizza-bottom"><span class="price"><small>${state.size==='media'?'Média · 6 fatias':'Grande · 8 fatias'}</small><strong>${money(priceOf(pizza))}</strong></span><button class="pick" type="button" data-pick="${pizza.id}" aria-pressed="${picked}">${picked?'Escolhida ✓':'Escolher'}</button></div></div></article>`;
    }).join('');
  }

  function renderBuilder(){
    document.querySelectorAll('.option').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));
    document.querySelectorAll('.size').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));
    builderMessage.textContent=state.mode==='duo'?'Escolha duas metades. O valor será o do sabor de maior preço.':'Escolha o sabor que vai ocupar todos os pedaços.';
    if(!state.flavors.length){flavors.innerHTML='<span>Nenhum sabor escolhido ainda.</span>'}
    else{flavors.innerHTML=state.flavors.map((pizza,index)=>`<span class="flavor-chip">${state.mode==='duo'?`${index+1}º sabor: `:''}${pizza.name}<button type="button" data-remove-flavor="${pizza.id}" aria-label="Remover ${pizza.name}">×</button></span>`).join('')}
  }

  function renderCart(){
    if(!state.cart.length){cartItems.innerHTML='<p class="empty">Seu pedido está vazio.<small>Escolha um sabor no cardápio.</small></p>'}
    else{cartItems.innerHTML=state.cart.map(item=>`<article class="cart-item"><div class="cart-line"><div><h4>${item.mode==='duo'?'Pizza meio a meio':item.flavors[0].name}</h4><p>${item.size==='media'?'Média · 6 fatias':'Grande · 8 fatias'}${item.mode==='duo'?` · ${item.flavors.map(pizza=>pizza.name).join(' + ')}`:''}</p></div><strong>${money(item.price)}</strong></div><button type="button" data-remove-cart="${item.id}">Remover</button></article>`).join('')}
    const sub=state.cart.reduce((sum,item)=>sum+item.price,0);
    const fee=state.cart.length&&state.fulfillment==='delivery'?8:0;
    const isPickup=state.fulfillment==='pickup';
    cartCount.textContent=state.cart.length;
    subtotal.textContent=money(sub);
    if(fulfillmentFeeLabel)fulfillmentFeeLabel.textContent=isPickup?'Retirada':'Entrega';
    delivery.textContent=state.cart.length?(isPickup?'Grátis':money(fee)):'—';
    total.textContent=money(sub+fee);
  }

  function refresh(){renderMenu();renderBuilder();renderCart()}
  function addCurrentPizza(){
    if(state.flavors.length!==modeNeeded())return false;
    if(state.cart.length>=MAX_CART_ITEMS){feedback.textContent=`Você pode adicionar até ${MAX_CART_ITEMS} pizzas por pedido.`;return false}
    const id=globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random()}`;
    state.cart.push({id,mode:state.mode,size:state.size,flavors:[...state.flavors],price:Math.max(...state.flavors.map(priceOf))});
    state.flavors=[];
    feedback.textContent=state.mode==='duo'?'Pizza meio a meio adicionada ao pedido.':'Pizza adicionada ao pedido.';
    refresh();
    return true;
  }

  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('active',item===button));renderMenu()}));
  document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',()=>{state.mode=input.value;state.flavors=state.flavors.slice(0,modeNeeded());if(state.mode==='single'&&state.flavors.length===1)addCurrentPizza();else{renderMenu();renderBuilder()}}));
  document.querySelectorAll('input[name="size"]').forEach(input=>input.addEventListener('change',()=>{state.size=input.value;renderMenu();renderBuilder()}));
  menuGrid.addEventListener('click',event=>{const button=event.target.closest('[data-pick]');if(!button)return;const pizza=pizzas.find(item=>item.id===button.dataset.pick);const existing=state.flavors.findIndex(item=>item.id===pizza.id);if(existing>=0){state.flavors.splice(existing,1);renderMenu();renderBuilder();return}if(state.mode==='single'){state.flavors=[pizza];addCurrentPizza();return}if(state.flavors.length<modeNeeded())state.flavors.push(pizza);if(state.flavors.length===modeNeeded())addCurrentPizza();else{renderMenu();renderBuilder()}});
  flavors.addEventListener('click',event=>{const button=event.target.closest('[data-remove-flavor]');if(!button)return;state.flavors=state.flavors.filter(pizza=>pizza.id!==button.dataset.removeFlavor);renderMenu();renderBuilder()});
  cartItems.addEventListener('click',event=>{const button=event.target.closest('[data-remove-cart]');if(!button)return;state.cart=state.cart.filter(item=>item.id!==button.dataset.removeCart);feedback.textContent='Item removido do pedido.';renderCart()});

  const routeInputs=document.querySelectorAll('input[name="checkout-route"]');
  const fulfillmentInputs=document.querySelectorAll('input[name="fulfillment"]');
  const methodInputs=document.querySelectorAll('input[name="online-method"]');
  const onlinePanel=document.querySelector('[data-online-panel]');
  const whatsappPanel=document.querySelector('[data-whatsapp-panel]');
  const onlineTitle=document.querySelector('[data-online-method-title]');
  const onlineCopy=document.querySelector('[data-online-method-copy]');
  const simulateButton=document.querySelector('[data-simulate-payment]');
  const whatsappButton=document.querySelector('[data-order-whatsapp]');
  const deliveryFields=document.querySelectorAll('[data-delivery-fields]');
  const customerDetailsHeading=document.querySelector('[data-customer-details-heading]');
  const fulfillmentCopy=document.querySelector('[data-fulfillment-copy]');
  const paymentStep=document.querySelector('[data-payment-step]');
  const currentMethod=()=>document.querySelector('input[name="online-method"]:checked').value;

  function validateCheckout(){
    if(!state.cart.length){feedback.textContent='Adicione pelo menos uma pizza antes de finalizar.';return false}
    return form.reportValidity();
  }
  function currentAmounts(){
    const subtotal=state.cart.reduce((sum,item)=>sum+item.price,0);
    const deliveryFee=state.cart.length&&state.fulfillment==='delivery'?8:0;
    return {subtotalCents:Math.round(subtotal*100),deliveryFeeCents:Math.round(deliveryFee*100),totalCents:Math.round((subtotal+deliveryFee)*100)};
  }
  function checkoutValue(data,name){return String(data.get(name)??'').trim()}
  function normalizedZipCode(data){return checkoutValue(data,'zipCode').replace(/\D/g,'')}
  function displayZipCode(zipCode){return zipCode?zipCode.replace(/(\d{5})(\d{3})/,'$1-$2'):''}
  function buildOrderPayload(route){
    const data=new FormData(form),amounts=currentAmounts();
    const fulfillmentMethod=state.fulfillment;
    const payload={
      customer:{name:checkoutValue(data,'name'),phone:checkoutValue(data,'phone')},
      items:state.cart.map(item=>({size:item.size,flavors:item.flavors.map(pizza=>pizza.id),unitPriceCents:Math.round(item.price*100)})),
      subtotalCents:amounts.subtotalCents,
      deliveryFeeCents:amounts.deliveryFeeCents,
      totalCents:amounts.totalCents,
      fulfillmentMethod,
      checkoutRoute:route,
      paymentMethod:route==='whatsapp'?'whatsapp':(currentMethod()==='PIX'?'pix':'card')
    };
    if(fulfillmentMethod==='delivery'){
      payload.delivery={
        zipCode:normalizedZipCode(data),
        street:checkoutValue(data,'street'),
        number:checkoutValue(data,'number'),
        neighborhood:checkoutValue(data,'neighborhood'),
        complement:checkoutValue(data,'complement')
      };
    }
    return payload;
  }
  function orderSummary(finalization){
    const data=new FormData(form),amounts=currentAmounts();
    const order=state.cart.map((item,index)=>`${index+1}. ${item.mode==='duo'?`Meio a meio: ${item.flavors.map(pizza=>pizza.name).join(' / ')}`:item.flavors[0].name} (${item.size==='media'?'Média':'Grande'}) — ${money(item.price)}`).join('\n');
    const extra=data.get('complement')?`, ${data.get('complement')}`:'';
    const fulfillment=state.fulfillment==='pickup'
      ? 'Retirada: vou buscar o pedido na Pizza Lavras.'
      : `Entrega:\nEndereço: ${data.get('street')}, ${data.get('number')} — ${data.get('neighborhood')}${extra}\nCEP: ${displayZipCode(normalizedZipCode(data))}`;
    const message=`Olá, Pizza Lavras! Quero fazer este pedido:\n\n${order}\n\n${fulfillment}\nNome: ${data.get('name')}\nTelefone: ${data.get('phone')}\nFinalização: ${finalization}\n\nTotal: ${money(amounts.totalCents/100)}`;
    return {message,total:amounts.totalCents/100};
  }
  async function persistOrder(payload){
    const {ensureOrderSession,saveOrder}=await getFirebaseOrderStore();
    await ensureOrderSession();
    return saveOrder(payload);
  }
  function firestoreErrorCopy(error){
    if(['auth/operation-not-allowed','auth/admin-restricted-operation'].includes(error?.code))return 'O pedido sem conta ainda não foi habilitado no Firebase. Ative o login Anônimo e tente novamente.';
    if(error?.code==='auth/requires-authenticated-user')return 'Não foi possível criar uma sessão temporária para registrar o pedido.';
    if(error?.code==='permission-denied')return 'O Firestore recusou o pedido. Confira se as regras atualizadas foram publicadas.';
    if(error?.code==='unavailable')return 'O Firebase está indisponível no momento. Verifique sua conexão e tente novamente.';
    return 'Não foi possível registrar o pedido no sistema.';
  }
  function setSaving(button,isSaving,originalText){
    [simulateButton,whatsappButton].forEach(control=>control.disabled=isSaving);
    button.textContent=isSaving?'Registrando pedido…':originalText;
  }
  function showWhatsAppLink(summary,prefix){
    const href=`https://wa.me/5535998764545?text=${encodeURIComponent(summary.message)}`;
    const link=document.createElement('a');
    link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir conversa no WhatsApp →';
    feedback.replaceChildren(document.createTextNode(`${prefix} `),link);
    globalThis.open?.(href,'_blank','noopener,noreferrer');
  }
  function updateRoute(){
    const route=document.querySelector('input[name="checkout-route"]:checked').value;
    document.querySelectorAll('.route-card:not(.fulfillment-option)').forEach(card=>card.classList.toggle('selected',card.querySelector('input').checked));
    onlinePanel.hidden=route!=='online';whatsappPanel.hidden=route!=='whatsapp';
  }
  function updateFulfillment(){
    const selected=document.querySelector('input[name="fulfillment"]:checked');
    state.fulfillment=selected?.value==='pickup'?'pickup':'delivery';
    const isDelivery=state.fulfillment==='delivery';
    document.querySelectorAll('.fulfillment-option').forEach(card=>card.classList.toggle('selected',card.querySelector('input').checked));
    deliveryFields.forEach(field=>{
      field.hidden=!isDelivery;
      field.querySelectorAll('input,select,textarea').forEach(control=>control.disabled=!isDelivery);
    });
    if(customerDetailsHeading)customerDetailsHeading.textContent=isDelivery?'Dados para entrega':'Dados para retirada';
    if(paymentStep)paymentStep.textContent='4';
    if(fulfillmentCopy)fulfillmentCopy.textContent=isDelivery?'Receba onde estiver: a taxa de entrega é de R$ 8,00.':'Retire na Pizza Lavras no horário combinado. Não há taxa de atendimento.';
    renderCart();
  }
  function updateOnlineMethod(){
    const method=currentMethod();
    document.querySelectorAll('.kind-card').forEach(card=>card.classList.toggle('selected',card.querySelector('input').checked));
    onlineTitle.textContent=method==='PIX'?'PIX instantâneo':'Cartão de crédito ou débito';
    onlineCopy.textContent=method==='PIX'?'A cobrança seria criada aqui, sem sair do pedido.':'Você seguiria para uma página segura do provedor de pagamento.';
    simulateButton.textContent=method==='PIX'?'Registrar pedido via PIX →':'Registrar pedido com cartão →';
  }
  async function saveCheckout(route,button){
    if(!validateCheckout()||isSavingOrder)return null;
    const originalText=button.textContent;
    const summary=orderSummary(route==='whatsapp'?'Pedido pelo WhatsApp':`Pagamento online via ${currentMethod()} (demonstração)`);
    const payload=buildOrderPayload(route);
    isSavingOrder=true;setSaving(button,true,originalText);feedback.textContent='Registrando seu pedido…';
    try{
      const saved=await persistOrder(payload);
      state.cart=[];renderCart();
      if(route==='whatsapp')showWhatsAppLink(summary,`Pedido registrado (protocolo ${saved.id.slice(0,8).toUpperCase()}).`);
      else feedback.textContent=`Pedido registrado no sistema (protocolo ${saved.id.slice(0,8).toUpperCase()}). Nenhuma cobrança foi realizada nesta demonstração.`;
      return saved;
    }catch(error){
      if(route==='whatsapp')showWhatsAppLink(summary,`${firestoreErrorCopy(error)} Você ainda pode enviar o pedido pelo WhatsApp.`);
      else feedback.textContent=`${firestoreErrorCopy(error)} Nenhuma cobrança foi realizada.`;
      return null;
    }finally{isSavingOrder=false;setSaving(button,false,originalText)}
  }

  routeInputs.forEach(input=>input.addEventListener('change',updateRoute));
  fulfillmentInputs.forEach(input=>input.addEventListener('change',updateFulfillment));
  methodInputs.forEach(input=>input.addEventListener('change',updateOnlineMethod));
  simulateButton.addEventListener('click',()=>saveCheckout('online',simulateButton));
  whatsappButton.addEventListener('click',()=>saveCheckout('whatsapp',whatsappButton));
  form.addEventListener('submit',event=>event.preventDefault());
  updateRoute();updateFulfillment();updateOnlineMethod();refresh();
}

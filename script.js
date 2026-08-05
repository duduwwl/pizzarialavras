const pizzas = [
  {id:'mussarela',category:'tradicionais',name:'Mussarela Clássica',description:'Molho da casa, mussarela derretida, tomate fresco e orégano.',media:38,grande:49},
  {id:'calabresa',category:'tradicionais',name:'Calabresa da Vila',description:'Calabresa fatiada, cebola roxa, muçarela e orégano.',media:41,grande:53},
  {id:'marguerita',category:'tradicionais',name:'Marguerita',description:'Muçarela, tomate, manjericão fresco e um toque de azeite.',media:42,grande:54},
  {id:'portuguesa',category:'tradicionais',name:'Portuguesa',description:'Presunto, ovos, cebola, pimentão, ervilha, muçarela e azeitonas.',media:45,grande:57},
  {id:'frango',category:'tradicionais',name:'Frango com Catupiry',description:'Frango bem temperado, Catupiry cremoso, muçarela e orégano.',media:46,grande:58},
  {id:'lavras',category:'especiais',name:'Lavras Especial',description:'Frango cremoso, bacon crocante, milho, muçarela e molho da casa.',media:48,grande:61},
  {id:'lombo',category:'especiais',name:'Lombo Mineiro',description:'Lombo defumado, requeijão, cebola caramelizada e muçarela.',media:49,grande:62},
  {id:'quatro',category:'especiais',name:'Quatro Queijos',description:'Muçarela, provolone, parmesão, gorgonzola e um toque de orégano.',media:51,grande:65},
  {id:'rucula',category:'especiais',name:'Rúcula & Tomate Seco',description:'Muçarela, tomate seco, rúcula fresca e pesto suave.',media:50,grande:64},
  {id:'romeu',category:'doces',name:'Romeu & Julieta',description:'Muçarela dourada, goiabada cremosa e pitada de canela.',media:43,grande:55},
  {id:'chocolate',category:'doces',name:'Chocolate Crocante',description:'Chocolate ao leite, granulado crocante e borda levemente dourada.',media:45,grande:57},
  {id:'banana',category:'doces',name:'Banana Caramelada',description:'Banana, canela, leite condensado e farofa crocante da casa.',media:44,grande:56}
];
const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());

const menuGrid=document.querySelector('[data-menu-grid]');
if(menuGrid){
  const state={filter:'todos',mode:'single',size:'media',flavors:[],cart:[]};
  const category={tradicionais:'Tradicional',especiais:'Especial',doces:'Doce'};
  const pizzaImages={
    tradicionais:{src:'./assets/pizza-calabresa-real.png',alt:'Pizza de calabresa com queijo derretido e cebola roxa'},
    especiais:{src:'./assets/pizza-especial-real.png',alt:'Pizza especial de frango, bacon, milho e muçarela'},
    doces:{src:'./assets/pizza-doce-real.png',alt:'Pizza doce com queijo e goiabada cremosa'}
  };
  const flavors=document.querySelector('[data-selected-flavors]');
  const builderMessage=document.querySelector('[data-builder-message]');
  const cartItems=document.querySelector('[data-cart-items]');
  const cartCount=document.querySelector('[data-cart-count]');
  const subtotal=document.querySelector('[data-subtotal]');
  const delivery=document.querySelector('[data-delivery]');
  const total=document.querySelector('[data-total]');
  const form=document.querySelector('[data-checkout-form]');
  const feedback=document.querySelector('[data-feedback]');
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
    builderMessage.textContent=state.mode==='duo'?'Escolha dois sabores. O valor será o do sabor de maior preço.':'Escolha o sabor que vai virar protagonista.';
    if(!state.flavors.length){flavors.innerHTML='<span>Nenhum sabor escolhido ainda.</span>'}
    else{flavors.innerHTML=state.flavors.map((pizza,index)=>`<span class="flavor-chip">${state.mode==='duo'?`${index+1}º sabor: `:''}${pizza.name}<button type="button" data-remove-flavor="${pizza.id}" aria-label="Remover ${pizza.name}">×</button></span>`).join('')}
  }
  function renderCart(){
    if(!state.cart.length){cartItems.innerHTML='<p class="empty">Seu pedido está vazio.<small>Escolha um sabor no cardápio.</small></p>'}
    else{cartItems.innerHTML=state.cart.map(item=>`<article class="cart-item"><div class="cart-line"><div><h4>${item.mode==='duo'?'Pizza meio a meio':item.flavors[0].name}</h4><p>${item.size==='media'?'Média · 6 fatias':'Grande · 8 fatias'}${item.mode==='duo'?` · ${item.flavors.map(pizza=>pizza.name).join(' + ')}`:''}</p></div><strong>${money(item.price)}</strong></div><button type="button" data-remove-cart="${item.id}">Remover</button></article>`).join('')}
    const sub=state.cart.reduce((sum,item)=>sum+item.price,0), fee=state.cart.length?8:0;
    cartCount.textContent=state.cart.length;subtotal.textContent=money(sub);delivery.textContent=fee?money(fee):'—';total.textContent=money(sub+fee);
  }
  function refresh(){renderMenu();renderBuilder();renderCart()}

  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('active',item===button));renderMenu()}));
  function addCurrentPizza(){
    if(state.flavors.length!==modeNeeded())return false;
    const id=globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}-${Math.random()}`;
    state.cart.push({id,mode:state.mode,size:state.size,flavors:[...state.flavors],price:Math.max(...state.flavors.map(priceOf))});
    state.flavors=[];
    feedback.textContent=state.mode==='duo'?'Pizza meio a meio adicionada ao pedido.':'Pizza adicionada ao pedido.';
    refresh();
    return true;
  }
  document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',()=>{state.mode=input.value;state.flavors=state.flavors.slice(0,modeNeeded());if(state.mode==='single'&&state.flavors.length===1)addCurrentPizza();else{renderMenu();renderBuilder()}}));
  document.querySelectorAll('input[name="size"]').forEach(input=>input.addEventListener('change',()=>{state.size=input.value;renderMenu();renderBuilder()}));
  menuGrid.addEventListener('click',event=>{const button=event.target.closest('[data-pick]');if(!button)return;const pizza=pizzas.find(item=>item.id===button.dataset.pick);const existing=state.flavors.findIndex(item=>item.id===pizza.id);if(existing>=0){state.flavors.splice(existing,1);renderMenu();renderBuilder();return}if(state.mode==='single'){state.flavors=[pizza];addCurrentPizza();return}if(state.flavors.length<modeNeeded())state.flavors.push(pizza);if(state.flavors.length===modeNeeded())addCurrentPizza();else{renderMenu();renderBuilder()}});
  flavors.addEventListener('click',event=>{const button=event.target.closest('[data-remove-flavor]');if(!button)return;state.flavors=state.flavors.filter(pizza=>pizza.id!==button.dataset.removeFlavor);renderMenu();renderBuilder()});
  cartItems.addEventListener('click',event=>{const button=event.target.closest('[data-remove-cart]');if(!button)return;state.cart=state.cart.filter(item=>item.id!==button.dataset.removeCart);feedback.textContent='Item removido do pedido.';renderCart()});
  const routeInputs=document.querySelectorAll('input[name="checkout-route"]');
  const methodInputs=document.querySelectorAll('input[name="online-method"]');
  const onlinePanel=document.querySelector('[data-online-panel]');
  const whatsappPanel=document.querySelector('[data-whatsapp-panel]');
  const onlineTitle=document.querySelector('[data-online-method-title]');
  const onlineCopy=document.querySelector('[data-online-method-copy]');
  const simulateButton=document.querySelector('[data-simulate-payment]');
  const whatsappButton=document.querySelector('[data-order-whatsapp]');
  const currentMethod=()=>document.querySelector('input[name="online-method"]:checked').value;
  function validateCheckout(){
    if(!state.cart.length){feedback.textContent='Adicione pelo menos uma pizza antes de finalizar.';return false}
    return form.reportValidity();
  }
  function orderSummary(finalization){
    const data=new FormData(form),sub=state.cart.reduce((sum,item)=>sum+item.price,0),fee=8;
    const order=state.cart.map((item,index)=>`${index+1}. ${item.mode==='duo'?`Meio a meio: ${item.flavors.map(pizza=>pizza.name).join(' / ')}`:item.flavors[0].name} (${item.size==='media'?'Média':'Grande'}) — ${money(item.price)}`).join('\n');
    const extra=data.get('complement')?`, ${data.get('complement')}`:'';
    const message=`Olá, Pizza Lavras! Quero fazer este pedido:\n\n${order}\n\nEntrega:\nNome: ${data.get('name')}\nEndereço: ${data.get('street')}, ${data.get('number')} — ${data.get('neighborhood')}${extra}\nTelefone: ${data.get('phone')}\nFinalização: ${finalization}\n\nTotal: ${money(sub+fee)}`;
    return {message,total:sub+fee};
  }
  function updateRoute(){
    const route=document.querySelector('input[name="checkout-route"]:checked').value;
    document.querySelectorAll('.route-card').forEach(card=>card.classList.toggle('selected',card.querySelector('input').checked));
    onlinePanel.hidden=route!=='online';
    whatsappPanel.hidden=route!=='whatsapp';
  }
  function updateOnlineMethod(){
    const method=currentMethod();
    document.querySelectorAll('.kind-card').forEach(card=>card.classList.toggle('selected',card.querySelector('input').checked));
    onlineTitle.textContent=method==='PIX'?'PIX instantâneo':'Cartão de crédito ou débito';
    onlineCopy.textContent=method==='PIX'?'A cobrança seria criada aqui, sem sair do pedido.':'Você seguiria para uma página segura do provedor de pagamento.';
    simulateButton.textContent=method==='PIX'?'Simular cobrança PIX →':'Simular pagamento com cartão →';
  }
  routeInputs.forEach(input=>input.addEventListener('change',updateRoute));
  methodInputs.forEach(input=>input.addEventListener('change',updateOnlineMethod));
  simulateButton.addEventListener('click',()=>{
    if(!validateCheckout())return;
    const method=currentMethod();
    const summary=orderSummary(`Pagamento online via ${method} (demonstração)`);
    feedback.textContent=`Pedido simulado com ${method}. Nenhuma cobrança foi feita. Em produção, o total de ${money(summary.total)} seria enviado ao provedor de pagamento seguro.`;
  });
  whatsappButton.addEventListener('click',()=>{
    if(!validateCheckout())return;
    const summary=orderSummary('Pedido pelo WhatsApp');
    const href=`https://wa.me/5535998764545?text=${encodeURIComponent(summary.message)}`;
    feedback.innerHTML=`Seu pedido está pronto. <a href="${href}" target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp →</a>`;
    globalThis.open?.(href,'_blank','noopener,noreferrer');
  });
  form.addEventListener('submit',event=>event.preventDefault());
  updateRoute();
  updateOnlineMethod();
  refresh();
}

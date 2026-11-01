self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(e){data={title:'Meu Assento',body:event.data?event.data.text():''}}
  const title=data.title||'Meu Assento';
  const options={
    body:data.body||'',
    icon:'/favicon.svg',
    badge:'/favicon.svg',
    tag:data.tag||undefined,
    renotify:true,
    data:{url:data.url||'/'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification?.data?.url||'/';
  event.waitUntil((async()=>{
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      try{
        const target=new URL(url,self.location.origin).href;
        if('navigate' in client)await client.navigate(target);
        return client.focus();
      }catch(e){}
    }
    return self.clients.openWindow(url);
  })());
});

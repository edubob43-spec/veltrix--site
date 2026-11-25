import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenNeedsRefresh, refreshDiscordOAuth} from '../src/oauth-refresh.js';

test('token é renovado antes da expiração, mas não desnecessariamente',()=>{
  const now=1_700_000_000_000;
  assert.equal(tokenNeedsRefresh({accessToken:'ok',expiresAt:now+3600_000},now),false);
  assert.equal(tokenNeedsRefresh({accessToken:'ok',expiresAt:now+30_000},now),true);
  assert.equal(tokenNeedsRefresh(null,now),true);
});
test('renova token com grant_type refresh_token e guarda token rotativo',async()=>{
  const now=1_700_000_000_000;
  let called=0;
  const current={accessToken:'oldaccess',refreshToken:'oldrefresh',expiresAt:now-1};
  const result=await refreshDiscordOAuth(current,{clientId:'app',clientSecret:'secret',now,fetchFn:async(url,args)=>{
    called++;
    assert.equal(url,'https://discord.com/api/v10/oauth2/token');
    assert.equal(args.method,'POST');
    assert.equal(args.body.get('grant_type'),'refresh_token');
    assert.equal(args.body.get('refresh_token'),'oldrefresh');
    return {ok:true,json:async()=>({access_token:'newaccess',refresh_token:'newrefresh',expires_in:3600})};
  }});
  assert.equal(called,1);
  assert.deepEqual(result,{accessToken:'newaccess',refreshToken:'newrefresh',expiresAt:now+3600_000});
});
test('não tenta renovar sessão que não possui refresh token',async()=>{
  await assert.rejects(refreshDiscordOAuth({accessToken:'a'},{clientId:'id',clientSecret:'secret',fetchFn:async()=>{throw Error('não deveria chamar');}}),/OAUTH_NO_REFRESH_TOKEN/);
});
test('não aceita resposta sem refresh token novo',async()=>{
  await assert.rejects(refreshDiscordOAuth({refreshToken:'r'},{clientId:'id',clientSecret:'s',fetchFn:async()=>({ok:true,json:async()=>({access_token:'a',expires_in:300})})}),/OAUTH_REFRESH_RESPONSE_INVALID/);
});
test('retorna erro de invalid token sem expor segredo',async()=>{
  await assert.rejects(refreshDiscordOAuth({refreshToken:'r'},{clientId:'id',clientSecret:'s',fetchFn:async()=>({ok:false,status:401})}),/OAUTH_REFRESH_HTTP_401/);
});

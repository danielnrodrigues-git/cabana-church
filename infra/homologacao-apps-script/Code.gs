const SPREADSHEET_ID = '1iQyxm5BXgr8SbRDNu_SGCP8vmDrRDxIyma6ZeX45wmI';
const ENVIRONMENT = 'HOMOLOGACAO';

function doGet() {
  return json_({ ok: true, service: 'Meu Assento V6 Homologacao', environment: ENVIRONMENT });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const method = String(payload.method || '').trim();
    const args = Array.isArray(payload.args) ? payload.args : [];
    if (!method) return json_({ ok:false, message:'Método não informado.' });

    switch (method) {
      case 'health': return json_({ ok:true, environment:ENVIRONMENT });
      case 'getBootstrap': return json_(getBootstrap_());
      default:
        return json_({ ok:false, code:'METHOD_PENDING', message:'Função ainda não implementada na homologação: ' + method });
    }
  } catch (err) {
    return json_({ ok:false, message:'Erro interno da homologação.', detail:String(err && err.message ? err.message : err) });
  }
}

function getBootstrap_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = rowsAsObjects_(ss.getSheetByName('CONFIGURACOES'));
  const leaders = rowsAsObjects_(ss.getSheetByName('LIDERANCAS')).filter(r => String(r.ativo).toUpperCase() === 'SIM');
  const services = rowsAsObjects_(ss.getSheetByName('CULTOS'));
  return {
    ok:true,
    version:'V6-HML',
    environment:ENVIRONMENT,
    config:config,
    leaders:leaders,
    cultos:services
  };
}

function rowsAsObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(r => r.some(v => v !== '')).map(row => {
    const out = {};
    headers.forEach((h,i) => out[h] = row[i]);
    return out;
  });
}

function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

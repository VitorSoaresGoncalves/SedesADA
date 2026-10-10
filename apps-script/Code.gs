/* Code.gs — backend da plataforma (Google Apps Script, vinculado a uma planilha "registro").
   - Aba "Sedes": uma linha por sede. VOCÊ controla o que aparece editando as colunas:
       status   : pendente | publicado | oculto
       listar   : sim | nao        (aparece na página inicial?)
       linkHub  : sim | nao        (a sede mostra link de volta para a página inicial?)
   - Cada sede ganha a própria planilha de inscrições (compartilhada com o organizador).
   - Imagens vão para uma pasta do Drive e são servidas por link público.
   - CRIAR SEDE exige senha. Defina-a em: Configurações do projeto (engrenagem) → Propriedades do script →
     adicionar propriedade  SENHA_CRIACAO  com o valor da senha. Ela nunca vai para o site. */

var CFG = {
  URL_SITE: 'https://SEU-DOMINIO.vercel.app/',   // com a barra final
  AUTO_PUBLICAR: false,                           // false = você aprova mudando status para "publicado"
  MAX_SEDES_POR_EMAIL: 3,
  PASTA: 'Ada Lovelace · Sedes',
  RESERVADOS: ['admin', 'api', 'criar', 'criar-sede', 'sede', 'sedes', 's', 'index', 'components', 'images']
};
var COLUNAS = ['slug', 'status', 'listar', 'linkHub', 'criadoEm', 'email', 'token', 'planilhaId', 'json'];
var CAMPOS_INSC = ['nome_participante', 'nascimento', 'ano_escolar', 'escola', 'nome_responsavel', 'documento_responsavel',
  'parentesco', 'telefone', 'email', 'observacoes', 'origem', 'consentimento_dados', 'autorizacao_imagem'];

/* ============ entrada ============ */
function doGet(e) {
  var p = e.parameter || {};
  try {
    if (p.acao === 'listar') return saida({ ok: true, sedes: listar() });
    if (p.acao === 'sede') return saida(obterSede(String(p.s || ''), String(p.preview || '')));
    return saida({ ok: false, erro: 'acao-invalida' });
  } catch (err) { return saida({ ok: false, erro: String(err.message || err) }); }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var d = corpo(e);
    if (d.acao === 'autenticar') return saida(autenticar(d));
    if (d.acao === 'criar') return saida(criar(d));
    if (d.acao === 'inscricao') return saida(inscrever(d));
    return saida({ ok: false, erro: 'acao-invalida' });
  } catch (err) {
    return saida({ ok: false, erro: String(err.message || err) });
  } finally { lock.releaseLock(); }
}

function corpo(e) {
  var t = e.postData && e.postData.type || '';
  if (/json|text\/plain/.test(t)) { try { return JSON.parse(e.postData.contents); } catch (x) {} }
  return e.parameter || {};     // formulário de inscrição (application/x-www-form-urlencoded)
}
function saida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ============ registro ============ */
function aba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), a = ss.getSheetByName('Sedes');
  if (!a) { a = ss.insertSheet('Sedes'); a.appendRow(COLUNAS); a.setFrozenRows(1); }
  return a;
}
function todas() {
  return aba().getDataRange().getValues().slice(1).map(function (r, i) {
    var o = { _linha: i + 2 }; COLUNAS.forEach(function (c, j) { o[c] = r[j]; }); return o;
  });
}
function achar(slug) { return todas().filter(function (r) { return r.slug === slug; })[0]; }

function listar() {
  return todas().filter(function (r) { return r.status === 'publicado' && r.listar !== 'nao'; }).map(function (r) {
    var s = JSON.parse(r.json), li = (s.logos || {}).instituicao || {};
    return { slug: r.slug, nome: s.nomeSede || s.nome, instituicao: (s.instituicao || {}).nome || '', cidade: s.cidade || '',
             data: (s.evento || {}).dataTexto || '', logo: li.img || '' };
  });
}

function obterSede(slug, preview) {
  var r = achar(slug);
  if (!r) return { ok: false, erro: 'nao-encontrada' };
  if (r.status !== 'publicado' && !(preview && preview === r.token)) {
    return { ok: false, erro: r.status === 'pendente' ? 'em-analise' : 'nao-encontrada' };
  }
  var s = JSON.parse(r.json);
  s.opcoes = { linkHub: r.linkHub === 'sim' };      // controlado pela planilha, nunca pelo formulário
  return { ok: true, sede: s };
}

/* ============ senha de criação ============ */
// confere a senha e devolve um token de sessão (2 h). Após 5 erros, bloqueia por 15 min (vale para todos).
function autenticar(d) {
  var cache = CacheService.getScriptCache();
  var falhas = Number(cache.get('falhas') || 0);
  if (falhas >= 5) throw new Error('muitas-tentativas');
  var senha = PropertiesService.getScriptProperties().getProperty('SENHA_CRIACAO');
  if (!senha) throw new Error('senha-nao-configurada');
  if (String(d.senha || '') !== senha) {
    cache.put('falhas', String(falhas + 1), 900);
    throw new Error('senha-incorreta');
  }
  cache.remove('falhas');
  var token = Utilities.getUuid();
  cache.put('sess:' + token, '1', 7200);
  return { ok: true, token: token };
}
function exigirSessao(d) {
  if (!d.token || !CacheService.getScriptCache().get('sess:' + d.token)) throw new Error('nao-autorizado');
}

/* ============ criar sede ============ */
function criar(d) {
  exigirSessao(d);
  if (!d.sede || !d.sede.nome) throw new Error('dados-incompletos');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) throw new Error('email-invalido');
  var email = String(d.email).toLowerCase();
  var jaTem = todas().filter(function (r) { return String(r.email).toLowerCase() === email; }).length;
  if (jaTem >= CFG.MAX_SEDES_POR_EMAIL) throw new Error('limite-por-email');

  var slug = slugUnico(d.slug || d.sede.nome);
  var sede = higienizar(d.sede);
  delete sede.opcoes;                                 // quem manda nisso é a planilha
  sede = salvarImagens(sede, slug, { n: 0, pasta: pasta() });

  var nomePlanilha = 'Inscrições · ' + (sede.nomeSede || sede.nome);
  var ss = SpreadsheetApp.create(nomePlanilha);
  var folha = ss.getSheets()[0]; folha.setName('Inscrições');
  folha.appendRow(['Data de envio'].concat(CAMPOS_INSC)); folha.setFrozenRows(1);
  try { DriveApp.getFileById(ss.getId()).moveTo(pasta()); } catch (x) {}
  try { ss.addEditor(email); } catch (x) {}           // falha se o e-mail não for conta Google

  var token = Utilities.getUuid();
  var status = CFG.AUTO_PUBLICAR ? 'publicado' : 'pendente';
  aba().appendRow([slug, status, 'sim', 'nao', new Date(), email, token, ss.getId(), JSON.stringify(sede)]);

  var urlSede = CFG.URL_SITE + 's/' + slug;
  var urlPrevia = CFG.URL_SITE + 'sede/index.html?s=' + slug + '&preview=' + token;
  MailApp.sendEmail({
    to: email, name: 'Jornada Ada Lovelace',
    subject: 'Sua sede foi criada: ' + (sede.nomeSede || sede.nome),
    body: 'Olá, ' + (d.organizador || '') + '!\n\nSua sede foi criada.\n\n' +
      'Endereço público: ' + urlSede + (status === 'pendente' ? ' (ficará no ar assim que for aprovada)' : '') + '\n' +
      'Prévia privada: ' + urlPrevia + '\n' +
      'Planilha de inscrições: ' + ss.getUrl() + '\n\nGuarde este e-mail.'
  });
  if (status === 'pendente') {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Nova sede para aprovar: ' + slug,
      'Sede: ' + (sede.nomeSede || sede.nome) + '\nPrévia: ' + urlPrevia + '\nAprove mudando "status" para "publicado" na aba Sedes.');
  }
  CacheService.getScriptCache().remove('sess:' + d.token);   // cada senha digitada cria uma sede
  return { ok: true, slug: slug, status: status, urlSede: urlSede, urlPrevia: urlPrevia, planilha: ss.getUrl() };
}

function slugUnico(base) {
  var s = String(base).toLowerCase().replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sede';
  var usados = todas().map(function (r) { return r.slug; }), c = s, i = 2;
  while (usados.indexOf(c) > -1 || CFG.RESERVADOS.indexOf(c) > -1) c = s + '-' + i++;
  return c;
}

// remove < > ", limita tamanho e só aceita URLs http(s)
function higienizar(v, k, pk) {
  if (typeof v === 'string') {
    if (/^data:image\//.test(v)) return v;
    v = v.replace(/[<>"]/g, '').slice(0, 3000);
    if ((k === 'url' || pk === 'links') && v && !/^https?:\/\//i.test(v)) return '';
    return v;
  }
  if (Array.isArray(v)) return v.slice(0, 60).map(function (x) { return higienizar(x, k, pk); });
  if (v && typeof v === 'object') { var o = {}; for (var c in v) o[c] = higienizar(v[c], c, k); return o; }
  return v;
}

// troca qualquer data:image/... por um link público no Drive
function salvarImagens(v, slug, ctx) {
  if (typeof v === 'string') {
    var m = v.match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
    if (!m) return v;
    if (++ctx.n > 40) throw new Error('imagens-demais');
    var bytes = Utilities.base64Decode(m[2]);
    if (bytes.length > 4 * 1024 * 1024) throw new Error('imagem-grande');
    var ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    var f = ctx.pasta.createFile(Utilities.newBlob(bytes, 'image/' + m[1], slug + '-' + ctx.n + '.' + ext));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://lh3.googleusercontent.com/d/' + f.getId();
  }
  if (Array.isArray(v)) return v.map(function (x) { return salvarImagens(x, slug, ctx); });
  if (v && typeof v === 'object') { var o = {}; for (var k in v) o[k] = salvarImagens(v[k], slug, ctx); return o; }
  return v;
}
function pasta() {
  var it = DriveApp.getFoldersByName(CFG.PASTA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CFG.PASTA);
}

/* ============ inscrição numa sede ============ */
function inscrever(d) {
  if (d.website) return { ok: true };                 // honeypot
  var r = achar(String(d.slug || ''));
  if (!r || r.status !== 'publicado') throw new Error('sede-indisponivel');
  var sede = JSON.parse(r.json), ev = sede.evento || {};
  var ss = SpreadsheetApp.openById(r.planilhaId);
  var folha = ss.getSheetByName('Inscrições') || ss.getSheets()[0];
  folha.appendRow([new Date()].concat(CAMPOS_INSC.map(function (c) { return protege(d[c]); })));

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) {
    MailApp.sendEmail({
      to: d.email, name: sede.nome, replyTo: r.email,
      subject: 'Inscrição recebida · ' + (sede.nomeSede || sede.nome),
      body: 'Olá, ' + (d.nome_responsavel || '') + '!\n\nRecebemos a inscrição de ' + (d.nome_participante || '') +
        ' na sede ' + (sede.nomeSede || sede.nome) + '.\n\n' + (ev.dataTexto || '') + ', ' + (ev.horario || '') +
        '\nLocal: ' + (ev.local || '') + (ev.endereco ? ' – ' + ev.endereco : '') +
        '\n\nEste e-mail confirma o recebimento dos dados.'
    });
  }
  return { ok: true };
}
// evita que "=..." digitado no formulário vire fórmula na planilha
function protege(v) { v = v == null ? '' : String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
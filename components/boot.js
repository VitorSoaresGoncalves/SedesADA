/* boot.js — substitui o antigo config.js.
   1) descobre qual sede é (?s=slug ou /s/slug)
   2) busca os dados dela (API ou sedes/<slug>.json)
   3) monta window.SITE (mesmo formato que os componentes já usam)
   4) preenche o HTML (data-t, data-src, data-href, data-if)
   5) carrega header, footer, carrossel, contador, cronograma e formulário
   Incluir no <head> de cada página da sede, logo depois de plataforma.js. */
(function () {
  var P = window.PLATAFORMA, root = P.root;
  var PAGINAS = ['index', 'quem-somos', 'mulheres-na-stem', 'formulario'];
  var COMPONENTES = ['header', 'footer', 'carrossel-membros', 'contador', 'cronograma-evento', 'formulario'];

  var q = new URLSearchParams(location.search);
  var mPath = location.pathname.match(/\/s\/([^\/]+)/);
  var slug = (q.get('s') || (mPath && mPath[1]) || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  var preview = q.get('preview') || '';

  // esconde a página até estar tudo preenchido
  document.documentElement.classList.add('carregando');
  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = root + 'components/plataforma.css';
  document.head.appendChild(css);

  /* ---------- valores padrão (usados quando a sede não preencheu algo) ---------- */
  var PADRAO = {
    nome: 'STEM para meninas',
    nomeSede: '',
    subtitulo: 'Jornada Ada Lovelace',
    descricaoCurta: 'Projeto que leva ciência, tecnologia, engenharia e matemática para meninas.',
    cidade: '',
    instituicao: { nome: '', sigla: '' },
    evento: { idadeMin: 10, idadeMax: 12, local: '', endereco: '', horario: '' },
    cronograma: [
      { inicio: '08:00', fim: '08:30', titulo: 'Credenciamento e recepção das participantes', cor: 'roxo' },
      { inicio: '08:30', fim: '09:00', titulo: 'Abertura do evento', cor: 'vermelho' },
      { inicio: '09:00', fim: '09:30', titulo: 'Palestra', cor: 'amarelo' },
      { inicio: '09:30', fim: '10:45', titulo: 'Oficina STEM 1', cor: 'verde' },
      { inicio: '10:45', fim: '11:15', titulo: 'Intervalo para lanche', cor: 'neutro' },
      { inicio: '11:15', fim: '12:30', titulo: 'Oficina STEM 2', cor: 'azul' },
      { inicio: '12:30', fim: '13:00', titulo: 'Discussão sobre as atividades e encerramento', cor: 'roxo' }
    ],
    links: { ada: 'https://adalovelace.net.ar', instituicao: '', projeto: '' },
    linksExtras: [], instagram: [], logos: {}, apoiadores: [],
    organizacao: { titulo: 'Organização', logos: [] },
    membros: [], textos: {}, tema: {},
    imagens: Object.assign({}, P.imagensPadrao),   // padrão = imagens do site modelo; a sede troca só o que enviar
    // créditos do site (rodapé) — valem para todas as sedes
    desenvolvedores: [
      { nome: 'Vitor Soares', linkedin: 'https://www.linkedin.com/in/vitor-soares-goncalves-807213366/' },
      { nome: 'Clara Yumi', linkedin: 'https://www.linkedin.com/in/clara-yumi-shiraishi/' }
    ],
    opcoes: { linkHub: false }            // controlado por você na planilha (coluna linkHub)
  };

  /* ---------- utilidades ---------- */
  // remove < > " de qualquer texto e bloqueia URLs que não sejam http(s) (proteção contra injeção de HTML)
  function limpar(v, k, pk) {
    if (typeof v === 'string') {
      if (/^data:image\//.test(v)) return v;
      v = v.replace(/[<>"]/g, '');
      if ((k === 'url' || k === 'linkedin' || pk === 'links') && v && !/^(https?:\/\/|#)/i.test(v)) return '';
      return v;
    }
    if (Array.isArray(v)) return v.map(function (x) { return limpar(x, k, pk); });
    if (v && typeof v === 'object') { var o = {}; for (var c in v) o[c] = limpar(v[c], c, k); return o; }
    return v;
  }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function juntar(a, b) {
    if (!isObj(a) || !isObj(b)) return b;
    var o = {}, k;
    for (k in a) o[k] = a[k];
    for (k in b) o[k] = isObj(a[k]) && isObj(b[k]) ? juntar(a[k], b[k]) : b[k];
    return o;
  }
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }

  /* ---------- busca dos dados da sede ---------- */
  function carregarSede() {
    if (!slug) return Promise.reject('sem-slug');
    var url = P.apiUrl
      ? P.apiUrl + '?acao=sede&s=' + slug + (preview ? '&preview=' + encodeURIComponent(preview) : '')
      : P.url('sedes/' + slug + '.json');
    return fetch(url)
      .then(function (r) { if (!r.ok) throw 'nao-encontrada'; return r.json(); })
      .then(function (d) { if (d.ok === false) throw d.erro || 'nao-encontrada'; return d.sede || d; });
  }

  /* ---------- monta window.SITE ---------- */
  function montar(sede) {
    var S = juntar(PADRAO, limpar(sede));
    if (!S.cronograma.length) S.cronograma = PADRAO.cronograma;
    S.slug = slug; S.root = root;
    S.nomeSede = S.nomeSede || S.nome;

    // URL de uma página da sede preserva ?s=slug (a sede nunca "cai" no hub)
    S.url = function (c) {
      var m = c.match(/^(?:\.\.\/|\.\/|pages\/|sede\/)?([\w-]+)\.html(?:\?.*)?$/);
      if (m && PAGINAS.indexOf(m[1]) > -1)
        return root + 'sede/' + m[1] + '.html?s=' + slug + (preview ? '&preview=' + encodeURIComponent(preview) : '');
      return /^(https?:|data:)/.test(c) ? c : root + c;
    };

    var e = S.evento;
    e.idadeTexto = e.idadeMin + ' a ' + e.idadeMax + ' anos';

    // logos da instituição da sede (e as do Ada Lovelace Day, que são comuns a todas)
    var sigla = S.instituicao.sigla || S.instituicao.nome || 'Instituição';
    var li = S.logos.instituicao || { nome: sigla };
    S.logos.instituicao = li;
    S.logos.instituicao.link = S.links.instituicao || '#';
    // logo para o cabeçalho escuro: se a sede não enviou a versão branca, usa a colorida sobre fundo claro
    S.logos.instituicaoBranco = S.logos.instituicaoBranco
      ? Object.assign({}, S.logos.instituicaoBranco, { link: S.links.instituicao || '#' })
      : Object.assign({}, li, { fundoClaro: true });
    S.logos.ada = S.logos.ada || { nome: 'Ada Lovelace Day', img: 'images/logo-ada.png', link: 'ada' };
    S.logos.adaBranco = S.logos.adaBranco || { nome: 'Ada Lovelace Day', img: 'images/logo-ada-branco.png', link: 'ada' };

    // links externos exibidos no menu "Outros links" e no rodapé
    S.externos = [
      { nome: 'Site oficial Ada Lovelace Day', url: S.links.ada },
      { nome: 'Site da ' + sigla, url: S.links.instituicao },
      { nome: 'Site do projeto', url: S.links.projeto }
    ].concat(S.linksExtras).filter(function (l) { return l && l.url; });

    // logos clicáveis (igual ao config.js antigo)
    S.logo = function (item, classe) {
      var url = item.link || item.url || '#';
      if (S.links[url]) url = S.links[url];
      var externo = /^https?:/.test(url);
      var attrs = 'href="' + url + '"' + (externo ? ' target="_blank" rel="noopener"' : '') +
        ' aria-label="' + item.nome + (externo ? ' (abre em nova aba)' : '') + '"';
      if (item.img) return '<a class="logo-link ' + (classe || '') + (item.fundoClaro ? ' logo-sobre-claro' : '') + '" ' + attrs + '><img src="' + S.url(item.img) + '" alt="' + item.nome + '"></a>';
      return '<a class="logo-ph ' + (classe || '') + '" ' + attrs + '>LOGO<br>' + item.nome + '</a>';
    };

    // inscrições vão para o backend da plataforma, a menos que a sede tenha o próprio endereço
    S.formularioUrl = S.formularioUrl || P.apiUrl;

    // cores da sede
    var hex = /^#[0-9a-f]{6}$/i, st = document.documentElement.style;
    if (hex.test(S.tema.corPrincipal || '')) st.setProperty('--verde-unifesp', S.tema.corPrincipal);
    if (hex.test(S.tema.corCabecalho || '')) st.setProperty('--grafite1', S.tema.corCabecalho);
    return S;
  }

  /* ---------- preenche o HTML ----------
     data-t="evento.local"      → texto
     data-src="imagens.hero"    → <img src> (sem imagem = espaço reservado)
     data-href="links.projeto"  → href
     data-if="links.projeto"    → some se estiver vazio
     data-link="ada|instituicao|projeto" e data-evento="dataTexto|..." continuam funcionando */
  function ligar(S) {
    var d = document;
    d.querySelectorAll('[data-t]').forEach(function (el) {
      var v = get(S, el.dataset.t); if (v != null && v !== '') el.textContent = v;
    });
    d.querySelectorAll('[data-if]').forEach(function (el) { if (!get(S, el.dataset.if)) el.style.display = 'none'; });
    d.querySelectorAll('[data-href]').forEach(function (a) { var v = get(S, a.dataset.href); if (v) a.href = S.url(v); });
    d.querySelectorAll('img[data-src]').forEach(function (img) {
      var v = get(S, img.dataset.src);
      function ph() { var p = d.createElement('div'); p.className = 'imagem-ph imagem-ph--roxo'; p.textContent = 'Imagem'; img.replaceWith(p); }
      if (!v) return ph();
      img.addEventListener('error', ph, { once: true });
      img.src = S.url(v);
    });
    d.querySelectorAll('[data-evento]').forEach(function (el) { var v = S.evento[el.dataset.evento]; if (v) el.textContent = v; });
    d.querySelectorAll('a[data-link]').forEach(function (a) {
      var destino = S.links[a.dataset.link];
      if (destino) { a.href = destino; a.target = '_blank'; a.rel = 'noopener'; } else a.style.display = 'none';
    });
    // links entre páginas da sede ("formulario.html", "../index.html"...) mantêm a sede
    d.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(?:\.\.\/|\.\/|pages\/)?(?:index|quem-somos|mulheres-na-stem|formulario)\.html$/.test(h)) a.href = S.url(h);
    });
    var t = d.title.split('|')[0].trim();
    d.title = t + ' | ' + S.nomeSede + (S.instituicao.sigla ? ' · ' + S.instituicao.sigla : '');
  }

  // ícone da aba: troca o padrão pelo da sede, sempre com ?v2 para driblar o cache do navegador
  function icone(S) {
    var href = S.url(S.imagens.icone);
    if (!/^data:/.test(href)) href += (href.indexOf('?') > -1 ? '&v2' : P.versaoIcone);
    document.querySelectorAll('link[rel~="icon"]').forEach(function (l) { l.remove(); });
    var l = document.createElement('link');
    l.rel = 'icon'; l.href = href;
    document.head.appendChild(l);
  }

  function carregarScripts(i) {
    if (i >= COMPONENTES.length) return Promise.resolve();
    return new Promise(function (ok) {
      var s = document.createElement('script');
      s.src = root + 'components/' + COMPONENTES[i] + '.js';
      s.onload = s.onerror = ok;
      document.body.appendChild(s);
    }).then(function () { return carregarScripts(i + 1); });
  }

  function falha(tipo) {
    document.documentElement.classList.remove('carregando');
    var msg = {
      'sem-slug': ['Qual sede você procura?', 'O endereço não indica nenhuma sede.'],
      'em-analise': ['Sede em análise', 'Esta sede foi criada e será publicada assim que for aprovada.'],
      'nao-encontrada': ['Sede não encontrada', 'Confira o endereço ou escolha uma sede na lista.']
    }[tipo] || ['Não foi possível abrir a sede', 'Tente de novo em instantes.'];
    document.body.innerHTML = '<main class="container" style="padding:96px 0"><h1>' + msg[0] + '</h1><p class="lead">' + msg[1] +
      '</p><a class="botao botao--roxo" href="' + root + 'index.html">Ver todas as sedes</a></main>';
  }

  var pronto = new Promise(function (r) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r, { once: true }); else r();
  });

  carregarSede().then(function (sede) {
    return pronto.then(function () {
      var S = window.SITE = montar(sede);
      ligar(S);
      icone(S);
      return carregarScripts(0).then(function () {
        // formulario.js espera o evento DOMContentLoaded, que já passou
        document.dispatchEvent(new Event('DOMContentLoaded'));
        document.documentElement.classList.remove('carregando');
      });
    });
  }).catch(function (e) {
    pronto.then(function () { falha(typeof e === 'string' ? e : 'erro'); });
    if (typeof e !== 'string') console.error(e);
  });
})();
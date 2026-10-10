/* criar-sede.js — porta de senha + formulário de criação de sede.
   A senha é conferida pelo BACKEND (Code.gs). Sem token válido o backend recusa a criação,
   mesmo que alguém abra o formulário pelo console do navegador. */
(function () {
  var P = window.PLATAFORMA;
  var form = document.getElementById('form-sede');
  var gate = document.getElementById('gate');
  var gateStatus = document.getElementById('gate-status');
  var gateBtn = document.getElementById('gate-entrar');
  var statusEl = document.getElementById('form-status');
  var resultado = document.getElementById('resultado');
  var botao = form.querySelector('[type="submit"]');
  var CORES = ['roxo', 'vermelho', 'amarelo', 'verde', 'azul', 'neutro'];
  var token = '';

  var ERROS = {
    'senha-incorreta': 'Senha incorreta.',
    'muitas-tentativas': 'Muitas tentativas erradas. Aguarde 15 minutos.',
    'senha-nao-configurada': 'A senha ainda não foi configurada no servidor.',
    'nao-autorizado': 'Sua sessão expirou. Digite a senha de novo; o que você preencheu foi mantido.',
    'email-invalido': 'O e-mail informado não parece válido.',
    'limite-por-email': 'Este e-mail já atingiu o limite de sedes. Fale com a organização para criar outra.',
    'imagem-grande': 'Uma das imagens ficou grande demais. Tente uma versão menor.',
    'imagens-demais': 'Imagens demais. Remova algumas e tente de novo.',
    'dados-incompletos': 'Faltam dados obrigatórios.'
  };

  function chamar(obj) {
    return fetch(P.apiUrl, { method: 'POST', body: JSON.stringify(obj) })   // text/plain: evita preflight
      .then(function (r) { return r.json(); })
      .catch(function () { throw new Error('Sem conexão com o servidor. Tente de novo.'); });
  }

  /* ---------- porta de senha ---------- */
  function liberar() { gate.hidden = true; form.hidden = false; }
  function bloquear(msg) {
    token = ''; form.hidden = true; gate.hidden = false;
    gateStatus.textContent = msg || '';
    gate.elements.senha.focus();
  }
  if (P.apiUrl) bloquear(); else liberar();      // sem backend (modo local) não há como validar a senha

  gate.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var senha = gate.elements.senha.value;
    if (!senha) { gateStatus.textContent = 'Digite a senha.'; return; }
    gateBtn.disabled = true; gateStatus.textContent = 'Verificando…';
    try {
      var r = await chamar({ acao: 'autenticar', senha: senha });
      if (!r.ok) throw new Error(ERROS[r.erro] || 'Não foi possível entrar (' + r.erro + ').');
      token = r.token; gate.elements.senha.value = ''; gateStatus.textContent = '';
      liberar();
    } catch (err) { gateStatus.textContent = err.message; }
    finally { gateBtn.disabled = false; }
  });

  /* ---------- grupos repetíveis: [chave, rótulo, tipo] ---------- */
  var GRUPOS = {
    cronograma: [['inicio', 'Início', 'time'], ['fim', 'Fim', 'time'], ['titulo', 'Atividade', 'text'], ['cor', 'Cor', 'select']],
    membros: [['nome', 'Nome', 'text'], ['funcao', 'Função', 'text'], ['curso', 'Curso / departamento', 'text'], ['foto', 'Foto', 'file']],
    organizacao: [['nome', 'Nome', 'text'], ['url', 'Site (https://…)', 'url'], ['img', 'Logo', 'file']],
    apoiadores: [['nome', 'Nome', 'text'], ['url', 'Site (https://…)', 'url'], ['img', 'Logo', 'file']],
    instagram: [['nome', '@perfil', 'text'], ['url', 'Link do perfil', 'url']],
    extras: [['nome', 'Nome do link', 'text'], ['url', 'Endereço (https://…)', 'url']]
  };
  var CRONO = [
    ['08:00', '08:30', 'Credenciamento e recepção das participantes', 'roxo'],
    ['08:30', '09:00', 'Abertura do evento', 'vermelho'],
    ['09:00', '09:30', 'Palestra', 'amarelo'],
    ['09:30', '10:45', 'Oficina STEM 1', 'verde'],
    ['10:45', '11:15', 'Intervalo para lanche', 'neutro'],
    ['11:15', '12:30', 'Oficina STEM 2', 'azul'],
    ['12:30', '13:00', 'Discussão sobre as atividades e encerramento', 'roxo']
  ];

  function campoHtml(c) {
    var n = c[0], l = c[1], t = c[2];
    if (t === 'select') return '<label>' + l + '<select data-c="' + n + '">' + CORES.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></label>';
    return '<label>' + l + '<input data-c="' + n + '" type="' + t + '"' + (t === 'file' ? ' accept="image/*"' : '') + '></label>';
  }
  function addLinha(g, vals) {
    var div = document.createElement('div');
    div.className = 'linha-rep';
    div.innerHTML = GRUPOS[g].map(campoHtml).join('') + '<button type="button" class="linha-rep__x" aria-label="Remover">×</button>';
    if (vals) GRUPOS[g].forEach(function (c, i) {
      if (vals[i] != null && c[2] !== 'file') div.querySelector('[data-c="' + c[0] + '"]').value = vals[i];
    });
    div.querySelector('.linha-rep__x').addEventListener('click', function () { div.remove(); });
    form.querySelector('[data-grupo="' + g + '"]').appendChild(div);
  }
  form.querySelectorAll('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () { addLinha(b.dataset.add); });
  });
  CRONO.forEach(function (r) { addLinha('cronograma', r); });
  addLinha('membros'); addLinha('organizacao'); addLinha('apoiadores'); addLinha('instagram');

  /* ---------- imagens com padrão: mostra a atual do site da Unifesp e deixa escolher ---------- */
  var IMGS = [
    ['hero', 'Foto principal da home'],
    ['sobre', 'Imagem de "O que é a Jornada"'],
    ['cartaz', 'Cartaz de inscrições'],
    ['mulheres', 'Imagem de "Mulheres na STEM"'],
    ['mapa', 'Mapa da região'],
    ['icone', 'Ícone do site (aba do navegador)']
  ];
  var listaImgs = document.getElementById('imagens-padrao');
  IMGS.forEach(function (it) {
    var k = it[0], div = document.createElement('div');
    div.className = 'img-escolha'; div.dataset.img = k;
    div.innerHTML =
      '<figure class="img-escolha__atual"><img alt="" src="' + P.url(P.imagensPadrao[k]) + '"><figcaption>Usada hoje no site da Unifesp</figcaption></figure>' +
      '<div class="img-escolha__opcoes"><strong>' + it[1] + '</strong>' +
        '<label class="radio"><input type="radio" name="modo_' + k + '" value="padrao" checked> Usar esta imagem</label>' +
        '<label class="radio"><input type="radio" name="modo_' + k + '" value="outra"> Enviar outra</label>' +
        '<input type="file" accept="image/*" hidden aria-label="Enviar outra imagem: ' + it[1].replace(/"/g, '') + '">' +
      '</div>';
    var arq = div.querySelector('input[type="file"]');
    div.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var outra = div.querySelector('input[type="radio"]:checked').value === 'outra';
        arq.hidden = !outra; arq.required = outra;
        if (!outra) arq.value = '';
      });
    });
    listaImgs.appendChild(div);
  });
  // '' = mantém a padrão (o site usa a imagem do modelo); senão devolve a imagem enviada, já reduzida
  async function escolha(k) {
    var d = listaImgs.querySelector('[data-img="' + k + '"]');
    if (d.querySelector('input[type="radio"]:checked').value !== 'outra') return '';
    var ico = k === 'icone';
    return img(d.querySelector('input[type="file"]'), ico ? 192 : 1400, ico, ico);
  }

  /* ---------- endereço (slug) automático ---------- */
  function slugify(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }
  var slugEl = form.elements.slug, previa = document.getElementById('slug-previa'), slugManual = false;
  function atualizarPrevia() { previa.textContent = slugEl.value ? 'Seu site: ' + P.root + 's/' + slugEl.value : ''; }
  slugEl.addEventListener('input', function () { slugManual = true; slugEl.value = slugify(slugEl.value); atualizarPrevia(); });
  ['sigla', 'cidade'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () {
      if (!slugManual) { slugEl.value = slugify(form.elements.sigla.value + '-' + form.elements.cidade.value.split('-')[0]); atualizarPrevia(); }
    });
  });

  /* ---------- imagens: reduz no navegador antes de enviar ---------- */
  // png = mantém transparência; quadrado = recorta o centro em max × max (ícone)
  function lerImagem(file, max, png, quadrado) {
    return new Promise(function (ok, no) {
      var r = new FileReader();
      r.onerror = no;
      r.onload = function () {
        var im = new Image();
        im.onerror = function () { no(new Error('Não consegui ler a imagem "' + file.name + '".')); };
        im.onload = function () {
          var c = document.createElement('canvas'), x = c.getContext('2d');
          if (quadrado) {
            var l = Math.min(im.width, im.height);
            c.width = c.height = max;
            x.drawImage(im, (im.width - l) / 2, (im.height - l) / 2, l, l, 0, 0, max, max);
          } else {
            var k = Math.min(1, max / Math.max(im.width, im.height));
            c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
            if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
            x.drawImage(im, 0, 0, c.width, c.height);
          }
          ok(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  async function img(input, max, png, quadrado) {
    var f = input && input.files && input.files[0];
    return f ? lerImagem(f, max || 1400, png, quadrado) : '';
  }
  async function lerGrupo(g) {
    var saida = [], linhas = form.querySelectorAll('[data-grupo="' + g + '"] .linha-rep');
    for (var i = 0; i < linhas.length; i++) {
      var o = {};
      for (var j = 0; j < GRUPOS[g].length; j++) {
        var c = GRUPOS[g][j], el = linhas[i].querySelector('[data-c="' + c[0] + '"]');
        o[c[0]] = c[2] === 'file' ? await img(el, g === 'membros' ? 800 : 600, g !== 'membros') : el.value.trim();
      }
      saida.push(o);
    }
    return saida;
  }

  /* ---------- formatação de data/hora ---------- */
  function h(t) { var p = t.split(':'); return +p[0] + 'h' + (p[1] === '00' ? '' : p[1]); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function semVazio(o) { var r = {}; for (var k in o) if (o[k]) r[k] = o[k]; return r; }

  /* ---------- envio ---------- */
  function msg(t) { statusEl.textContent = t; }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (form.elements.website.value) return;
    if (P.apiUrl && !token) { bloquear(ERROS['nao-autorizado']); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var f = form.elements;
    if (+f.idadeMin.value > +f.idadeMax.value) { msg('A idade mínima não pode ser maior que a máxima.'); f.idadeMin.focus(); return; }

    botao.disabled = true; msg('Preparando imagens…');
    try {
      var crono = (await lerGrupo('cronograma')).filter(function (r) { return r.inicio && r.fim && r.titulo; })
        .sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
      if (!crono.length) throw new Error('Adicione ao menos uma atividade ao cronograma.');

      var membros = (await lerGrupo('membros')).filter(function (m) { return m.nome; }).map(function (m) {
        return semVazio({ nome: m.nome, funcao: m.funcao, curso: m.curso, foto: m.foto });
      });
      var logos = function (l) { return l.nome ? semVazio({ nome: l.nome, url: l.url, img: l.img }) : null; };
      var org = (await lerGrupo('organizacao')).map(logos).filter(Boolean);
      var apoio = (await lerGrupo('apoiadores')).map(logos).filter(Boolean);
      var insta = (await lerGrupo('instagram')).filter(function (i) { return i.nome && i.url; });
      var extras = (await lerGrupo('extras')).filter(function (i) { return i.nome && i.url; });

      var sigla = f.sigla.value.trim();
      var dia = new Date(f.data.value + 'T12:00:00');
      var brancoImg = await img(f.logo_inst_branco, 600, true);
      var sede = {
        nome: f.nome.value.trim(),
        nomeSede: f.nomeSede.value.trim(),
        subtitulo: 'Jornada Ada Lovelace · ' + sigla,
        descricaoCurta: f.descricao.value.trim(),
        cidade: f.cidade.value.trim(),
        instituicao: { nome: f.inst_nome.value.trim(), sigla: sigla },
        evento: {
          data: f.data.value + 'T' + crono[0].inicio + ':00-03:00',
          dataTexto: cap(dia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
          dataCurta: dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
          diaSemana: dia.toLocaleDateString('pt-BR', { weekday: 'long' }),
          horario: 'das ' + h(crono[0].inicio) + ' às ' + h(crono[crono.length - 1].fim),
          local: f.local.value.trim(), endereco: f.endereco.value.trim(),
          idadeMin: +f.idadeMin.value, idadeMax: +f.idadeMax.value
        },
        cronograma: crono,
        links: semVazio({ instituicao: f.link_inst.value.trim(), projeto: f.link_projeto.value.trim() }),
        linksExtras: extras,
        instagram: insta,
        logos: { instituicao: { nome: sigla, img: await img(f.logo_inst, 600, true) } },
        apoiadores: apoio,
        organizacao: { titulo: 'Organização', logos: org },
        membros: membros,
        // só vai o que a pessoa trocou; o resto o site completa com as imagens padrão
        imagens: semVazio({
          hero: await escolha('hero'), sobre: await escolha('sobre'), cartaz: await escolha('cartaz'),
          mulheres: await escolha('mulheres'), mapa: await escolha('mapa'), icone: await escolha('icone'),
          sede: await img(f.img_sede)
        }),
        textos: semVazio({ sobreSede: f.textoSobre.value.trim(), participacao: f.textoParticipacao.value.trim() }),
        tema: { corPrincipal: f.corPrincipal.value, corCabecalho: f.corCabecalho.value }
      };
      if (brancoImg) sede.logos.instituicaoBranco = { nome: sigla, img: brancoImg };

      var payload = { acao: 'criar', token: token, slug: f.slug.value, email: f.email.value.trim(), organizador: f.organizador.value.trim(), sede: sede };

      if (!P.apiUrl) return modoLocal(payload);

      msg('Enviando… isso pode levar até um minuto (imagens e planilha estão sendo criadas).');
      var r = await chamar(payload);
      if (!r.ok) {
        if (r.erro === 'nao-autorizado') { botao.disabled = false; msg(''); bloquear(ERROS['nao-autorizado']); return; }
        throw new Error(ERROS[r.erro] || 'Não foi possível criar a sede (' + r.erro + ').');
      }
      token = '';
      sucesso(r);
    } catch (err) {
      botao.disabled = false;
      msg(err.message || 'Erro inesperado. Tente de novo.');
    }
  });

  function mostrar(html) {
    form.hidden = true; resultado.innerHTML = html; resultado.hidden = false;
    resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }); resultado.focus();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function sucesso(r) {
    mostrar('<h2>Sede criada!</h2>' +
      '<p>Enviamos um e-mail para <strong>' + esc(form.elements.email.value) + '</strong> com todos os links. Confira também o spam.</p>' +
      '<p>Endereço da sede: <a href="' + esc(r.urlSede) + '">' + esc(r.urlSede) + '</a></p>' +
      (r.status === 'pendente'
        ? '<p>Ela será publicada assim que for aprovada. Até lá, veja a prévia privada: <a href="' + esc(r.urlPrevia) + '">abrir prévia</a></p>'
        : '') +
      '<p>Planilha de inscrições: <a href="' + esc(r.planilha) + '" target="_blank" rel="noopener">abrir planilha</a></p>' +
      '<div class="botoes"><a class="botao botao--amarelo" href="index.html">Voltar ao início</a></div>');
  }

  // sem backend: oferece o JSON para salvar em sedes/<slug>.json
  function modoLocal(payload) {
    var json = JSON.stringify(payload.sede, null, 2);
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    mostrar('<h2>Modo local</h2>' +
      '<p>O backend ainda não está ligado (<code>apiUrl</code> vazio em <code>components/plataforma.js</code>), então a senha não é pedida e nada foi enviado.</p>' +
      '<p>Para testar: salve o arquivo abaixo como <code>sedes/' + esc(payload.slug) + '.json</code>, abra <code>sede/index.html?s=' + esc(payload.slug) + '</code> e inclua a sede em <code>sedes/index.json</code>.</p>' +
      '<div class="botoes"><a class="botao botao--amarelo" href="' + url + '" download="' + esc(payload.slug) + '.json">Baixar ' + esc(payload.slug) + '.json</a></div>' +
      '<pre>' + esc(json.length > 4000 ? json.slice(0, 4000) + '\n…' : json) + '</pre>');
  }
})();

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('form-inscricao');
    if (!form) return;
    var S = window.SITE;
    var status = document.getElementById('form-status');
    var sucesso = document.getElementById('form-sucesso');
    var botao = form.querySelector('[type="submit"]');


    // Idade que a menina terá no dia do evento
    function idadeNoEvento(iso) {
      var n = new Date(iso), e = new Date(S.evento.data);
      var idade = e.getFullYear() - n.getFullYear();
      var m = e.getMonth() - n.getMonth();
      if (m < 0 || (m === 0 && e.getDate() < n.getDate())) idade--;
      return idade;
    }

    // Telefone: só números, espaços, parênteses, + e hífen,
    // com 10 a 13 números no total (DDD + número)
    function telefoneValido(valor) {
      if (/[^0-9\s()+-]/.test(valor)) return false;
      var numeros = valor.replace(/\D/g, '').length;
      return numeros >= 10 && numeros <= 13;
    }

    // E-mail: precisa ter o formato algo@algo.algo, sem espaços
    function emailValido(valor) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }

   
    function nomeDoCampo(el) {
      if (el.dataset.nome) return el.dataset.nome;
      var label = form.querySelector('label[for="' + el.id + '"]');
      if (!label) return el.name;
      return label.textContent.replace('(opcional)', '').trim();
    }


    function caixaDoCampo(el) {
      return el.closest('.campo, .check');
    }

    function marcarErro(el) {
      var caixa = caixaDoCampo(el);
      if (!caixa) return;
      caixa.classList.remove('com-erro');
      void caixa.offsetWidth;            
      caixa.classList.add('com-erro');
      el.setAttribute('aria-invalid', 'true');
    }

    function limparErro(el) {
      var caixa = caixaDoCampo(el);
      if (caixa) caixa.classList.remove('com-erro');
      el.removeAttribute('aria-invalid');
    }

    
    form.addEventListener('input', function (ev) { limparErro(ev.target); });
    form.addEventListener('change', function (ev) { limparErro(ev.target); });

    /* ---------- Aviso no topo da tela ---------- */

    var aviso = document.createElement('div');
    aviso.className = 'aviso-erro';
    aviso.setAttribute('role', 'alert');
    aviso.hidden = true;
    document.body.appendChild(aviso);
    var timerAviso;

    function mostrarAviso(linhas) {
      aviso.textContent = '';

      var fechar = document.createElement('button');
      fechar.type = 'button';
      fechar.className = 'aviso-erro__fechar';
      fechar.setAttribute('aria-label', 'Fechar aviso');
      fechar.textContent = '×';
      fechar.addEventListener('click', esconderAviso);
      aviso.appendChild(fechar);

            linhas.forEach(function (linha, i) {
        var p = document.createElement('p');
        if (i === 0) {
          var titulo = document.createElement('strong');
          titulo.textContent = 'Atenção! ';
          p.appendChild(titulo);
        }
        if (linha.negrito) {
          var destaque = document.createElement('strong');
          destaque.textContent = linha.negrito + ' ';
          p.appendChild(destaque);
        }
        p.appendChild(document.createTextNode(linha.texto));
        aviso.appendChild(p);
      });
      
      aviso.hidden = true;
      void aviso.offsetWidth;           
      aviso.hidden = false;

      clearTimeout(timerAviso);
      timerAviso = setTimeout(esconderAviso, 10000);   
    }

    function esconderAviso() {
      clearTimeout(timerAviso);
      aviso.hidden = true;
    }

    

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.elements['website'].value) return;     

      var faltando = [];
      var invalidos = [];
      var primeiroErro = null;

      form.querySelectorAll('[required]').forEach(function (el) {
        limparErro(el);
        var valor = el.type === 'checkbox' ? '' : el.value.trim();
        var vazio = el.type === 'checkbox' ? !el.checked : valor === '';
        var temProblema = false;

        if (vazio) {
          faltando.push(nomeDoCampo(el));
          temProblema = true;
        } else if (el.type === 'tel' && !telefoneValido(valor)) {
            invalidos.push(nomeDoCampo(el));
          temProblema = true;
        } else if (el.type === 'email' && !emailValido(valor)) {
          invalidos.push(nomeDoCampo(el));
          temProblema = true;
        } else if (el.name === 'nascimento') {
          var idade = idadeNoEvento(valor);
          if (idade < S.evento.idadeMin || idade > S.evento.idadeMax) {
            invalidos.push(nomeDoCampo(el) + ' (a participante precisa ter de ' + S.evento.idadeMin + ' a ' + S.evento.idadeMax + ' anos no dia da Jornada)');
            temProblema = true;
          }
        }

        if (temProblema) {
          marcarErro(el);
          if (!primeiroErro) primeiroErro = el;
        }
      });

      if (primeiroErro) {
        var linhas = [];
        if (faltando.length) linhas.push({ texto: 'Faltam preencher os campos: ' + faltando.join(', ') + '.' });
        if (invalidos.length) linhas.push({ negrito: 'Campos inválidos:', texto: invalidos.join(', ') + '.' });
        mostrarAviso(linhas);
        primeiroErro.focus({ preventScroll: true });
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      esconderAviso();
      var dados = new URLSearchParams(new FormData(form));
      dados.append('acao', 'inscricao');
      dados.append('slug', S.slug);
      botao.disabled = true;
      status.textContent = 'Enviando inscrição…';

      function concluir() {
        status.textContent = '';
        document.getElementById('email-confirmado').textContent = form.elements['email'].value;
        form.hidden = true;
        sucesso.hidden = false;
        sucesso.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (!S.formularioUrl) {
        setTimeout(function () { document.getElementById('aviso-demo').hidden = false; concluir(); }, 500);
        return;
      }
      fetch(S.formularioUrl, { method: 'POST', mode: 'no-cors', body: dados })
        .then(concluir)
        .catch(function () {
          botao.disabled = false;
          status.textContent = 'Não foi possível enviar. Verifique sua conexão e tente de novo.';
        });
    });
  });
})();
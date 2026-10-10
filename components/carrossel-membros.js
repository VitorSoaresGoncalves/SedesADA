/* <carrossel-membros titulo="..." texto="..."></carrossel-membros> */
(function () {
  var S = window.SITE;
  var cores = ['roxo', 'vermelho', 'azul', 'verde', 'amarelo'];

  // Logo clicável das organizadoras (imagem real ou espaço tracejado)
  function logoOrg(l) {
    var url = l.url || (l.link && S.links && S.links[l.link]) || '#';
    var ext = /^https?:/.test(url);
    var attrs = 'href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') +
      ' aria-label="' + l.nome + (ext ? ' (abre em nova aba)' : '') + '"';
    return l.img
      ? '<a class="organizacao__logo" ' + attrs + '><img src="' + S.url(l.img) + '" alt="' + l.nome + '"></a>'
      : '<a class="organizacao__logo organizacao__logo--ph" ' + attrs + '>LOGO<br>' + l.nome + '</a>';
  }
  var seta = function (d) {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (d < 0 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7') + '"/></svg>';
  };

  class CarrosselMembros extends HTMLElement {
    connectedCallback() {
      var titulo = this.getAttribute('titulo') || 'Quem faz acontecer';
      var texto = this.getAttribute('texto') || '';
      var cards = S.membros.map(function (m, i) {
        var cor = cores[i % cores.length];
        return '<li class="membro">' +
          (m.foto
            ? '<img class="membro__foto foto-membro" style="--cor:var(--' + cor + ')" src="' + S.url(m.foto) + '" alt="Foto de ' + m.nome + '">'
            : '<div class="imagem-ph imagem-ph--' + cor + ' membro__foto" style="--ratio:4/5" role="img" aria-label="Espaço para foto de ' + m.nome + '">Foto · 4:5<small>retrato</small></div>') +
          '<h3>' + m.nome + '</h3><p class="membro__funcao">' + m.funcao + '</p><p class="membro__curso">' + m.curso + '</p></li>';
      }).join('');

      // Bloco "Organização": usa S.organizacao do config.js; se não existir, mostra 3 espaços para logos.
      // Para desligar em uma página: <carrossel-membros organizacao="nao">
      var O = S.organizacao || { titulo: 'Organização', logos: [
        { nome: 'Unifesp', link: 'unifesp' }, { nome: 'Mulheres da SBMAC' }, { nome: 'MIC' }
      ] };
      var org = '';
      if (this.getAttribute('organizacao') !== 'nao') {
        org = '<div class="container"><div class="organizacao">' + (O.imagem
          ? '<img class="organizacao__imagem" src="' + S.url(O.imagem) + '" alt="' + (O.alt || 'Organização do evento') + '">'
          : '<h3 class="organizacao__titulo">' + (O.titulo || 'Organização') + '</h3>' +
            '<ul class="organizacao__logos">' + O.logos.map(function (l) { return '<li>' + logoOrg(l) + '</li>'; }).join('') + '</ul>') +
          '</div></div>';
      }

      this.innerHTML =
        '<section class="secao secao--creme carrossel" aria-roledescription="carrossel" aria-label="' + titulo + '">' +
          '<div class="container carrossel__topo">' +
            '<div><h2>' + titulo + '</h2>' + (texto ? '<p class="lead">' + texto + '</p>' : '') + '</div>' +
            '<div class="carrossel__controles">' +
              '<button type="button" class="carrossel__btn" data-dir="-1" aria-label="Membros anteriores">' + seta(-1) + '</button>' +
              '<button type="button" class="carrossel__btn" data-dir="1" aria-label="Próximos membros">' + seta(1) + '</button>' +
            '</div>' +
          '</div>' +
          '<ul class="carrossel__faixa" tabindex="0" aria-label="Lista de membros">' + cards + '</ul>' +
          org +
        '</section>';

      var faixa = this.querySelector('.carrossel__faixa');
      this.querySelectorAll('.carrossel__btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var card = faixa.querySelector('.membro');
          var passo = (card ? card.offsetWidth : 260) + 28;
          faixa.scrollBy({ left: passo * Number(b.dataset.dir), behavior: 'smooth' });
        });
      });
    }
  }
  customElements.define('carrossel-membros', CarrosselMembros);
})();
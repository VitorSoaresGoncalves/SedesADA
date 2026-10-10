/* <site-header></site-header> — cabeçalho compartilhado */
(function () {
  var S = window.SITE;
  var ico = {
    insta: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
    menu: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  var paginas = [
    ['Início', 'index.html'],
    ['Quem somos', 'pages/quem-somos.html'],
    ['Mulheres na STEM', 'pages/mulheres-na-stem.html'],
   // ['Unifesp e Primos', 'pages/unifesp.html']
  ];

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      var atual = location.pathname.split('/').pop() || 'index.html';
      if (!/\.html$/.test(atual)) atual = 'index.html';   // /s/slug = home da sede
      var itens = paginas.map(function (p) {
        var nome = p[1].split('/').pop();
        var ativo = nome === atual ? ' aria-current="page"' : '';
        return '<li><a href="' + S.url(p[1]) + '"' + ativo + '>' + p[0] + '</a></li>';
      }).join('');

      var externos = S.externos.map(function (l) {
        return '<li><a href="' + l.url + '" target="_blank" rel="noopener">' + l.nome + ' ↗</a></li>';
      }).join('');
      if (S.opcoes.linkHub) itens += '<li><a href="' + S.root + 'index.html">Todas as sedes</a></li>';

        
      var insta = S.instagram.map(function (i) {
        return '<a href="' + i.url + '" target="_blank" rel="noopener" aria-label="Instagram ' + i.nome + '">' + ico.insta + '</a>';
      }).join('');

      this.innerHTML =
        '<header class="cabecalho"><div class="container cabecalho__in">' +
          '<a class="marca" href="' + S.url('index.html') + '">' +
            S.logo(S.logos.unifespBranco, 'marca__logo') +
            S.logo(S.logos.adaBranco, 'marca__logo') +
            '<span class="marca__nome"><strong>' + S.nome + '</strong><small>' + S.subtitulo + '</small></span>' +
          '</a>' +
          '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menu">' + ico.menu + '</button>' +
          '<nav class="menu" id="menu-principal" aria-label="Principal">' +
            '<ul>' + itens +
              '<li><details class="menu__mais"><summary>Outros links</summary><ul>' + externos + '</ul></details></li>' +
            '</ul>' +
            '<a class="botao botao--amarelo" href="' + S.url('pages/formulario.html') + '">Inscreva-se</a>' +
          '</nav>' +
        '</div></header>';

      var btn = this.querySelector('.menu-toggle');
      var menu = this.querySelector('.menu');
      btn.addEventListener('click', function () {
        var aberto = menu.classList.toggle('menu--aberto');
        btn.setAttribute('aria-expanded', aberto);
        btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      });
      // fecha o dropdown ao clicar fora
      var det = this.querySelector('.menu__mais');
      document.addEventListener('click', function (e) { if (!det.contains(e.target)) det.open = false; });
    }
  }
  customElements.define('site-header', SiteHeader);
})();

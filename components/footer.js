/* <site-footer></site-footer> — rodapé compartilhado: apoiadores, instagrams e links */
(function () {
  var S = window.SITE;
  class SiteFooter extends HTMLElement {
    connectedCallback() {
      var apoio = S.apoiadores.map(function (n) {
        var url = n.url || '#';
        var externo = /^https?:/.test(url);
        var attrs = 'href="' + url + '"' + (externo ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + n.nome + (externo ? ' (abre em nova aba)' : '') + '"';
        if (n.img) {
          return '<li><a class="logo-link rodape__apoio" ' + attrs + '><img src="' + S.url(n.img) + '" alt="' + n.nome + '"></a></li>';
        }
        return '<li><a class="logo-ph rodape__apoio" ' + attrs + '>LOGO<br>' + n.nome + '</a></li>';
      }).join('');

      var insta = S.instagram.map(function (i) {
        return '<li><a href="' + i.url + '" target="_blank" rel="noopener" aria-label="Instagram ' + i.nome + '">' + i.nome + '</a></li>';
      }).join('');

      var nav = [
        ['Início', 'index.html'],
        ['Inscrição', 'pages/formulario.html'],
        ['Quem somos', 'pages/quem-somos.html'],
        ['Mulheres na STEM', 'pages/mulheres-na-stem.html']
      ].map(function (p) {
        return '<li><a href="' + S.url(p[1]) + '">' + p[0] + '</a></li>';
      }).join('');

      var ext = S.externos.map(function (l) {
        return '<li><a href="' + l.url + '" target="_blank" rel="noopener">' + l.nome + ' ↗</a></li>';
      }).join('') + (S.opcoes.linkHub ? '<li><a href="' + S.root + 'index.html">Todas as sedes</a></li>' : '');

      var logos =
        S.logo(S.logos.unifesp, 'rodape__logo') +
        S.logo(S.logos.ada, 'rodape__logo');

      // Créditos: quem desenvolveu o site (lista "desenvolvedores" no config.js)
      var creditos = '';
      if (S.desenvolvedores && S.desenvolvedores.length) {
        var iconeIn = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
        var pessoas = S.desenvolvedores.map(function (d) {
          return '<a class="rodape__dev" href="' + (d.linkedin || '#') + '" target="_blank" rel="noopener" aria-label="' + d.nome + ' no LinkedIn (abre em nova aba)">' + iconeIn + '<span>' + d.nome + '</span></a>';
        }).join('');
        creditos = '<div class="rodape__creditos"><span>Site desenvolvido por</span>' + pessoas + '</div>';
      }

      this.innerHTML =
        '<footer class="rodape"><div class="faixa-cores" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="container"><div class="rodape__grid">' +
          '<div class="rodape__marca">' +
            '<div class="rodape__logos">' + logos + '</div>' +
            '<strong>' + S.nome + '</strong><p>' + S.descricaoCurta + '</p>' +
            '<h3>Instagram</h3><ul class="rodape__lista">' + insta + '</ul>' +
          '</div>' +
          '<div><h3>Apoiadores</h3><ul class="rodape__apoiadores">' + apoio + '</ul></div>' +
          '<div><h3>Páginas</h3><ul class="rodape__lista">' + nav + '</ul></div>' +
          '<div><h3>Links</h3><ul class="rodape__lista">' + ext + '</ul></div>' +
        '</div>' +
        '<div class="rodape__base"><span>© ' + new Date().getFullYear() + ' ' + S.nome + '</span><span>Evento realizado dentro da Jornada Latino-Americana de Oficinas STEM Ada Lovelace Day.</span></div>' +
        creditos +
        '</div></footer>';
    }
  }
  customElements.define('site-footer', SiteFooter);
})();
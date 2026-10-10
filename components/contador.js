/* <contador-evento></contador-evento> — contagem regressiva até SITE.evento.data */
(function () {
  var S = window.SITE;
  class ContadorEvento extends HTMLElement {
    connectedCallback() {
      var alvo = new Date(S.evento.data).getTime();
      var self = this;
      function cel(valor, rotulo) {
        return '<div class="contador__cel"><span>' + String(valor).padStart(2, '0') + '</span><small>' + rotulo + '</small></div>';
      }
      function atualizar() {
        var resto = Math.max(0, alvo - Date.now());
        if (resto === 0) {
          self.innerHTML = '<p class="contador__fim">A Jornada começou!</p>';
          clearInterval(timer);
          return;
        }
        var s = Math.floor(resto / 1000);
        self.innerHTML = '<div class="contador" role="timer" aria-label="Tempo restante para a Jornada">' +
          cel(Math.floor(s / 86400), 'Dias') + cel(Math.floor(s % 86400 / 3600), 'Horas') +
          cel(Math.floor(s % 3600 / 60), 'Minutos') + cel(s % 60, 'Segundos') + '</div>';
      }
      var timer = setInterval(atualizar, 1000);
      atualizar();
    }
  }
  customElements.define('contador-evento', ContadorEvento);
})();

/* <cronograma-evento></cronograma-evento> — linha do dia + lista de horários (SITE.cronograma)
   No dia do evento, destaca a atividade que está acontecendo ("Agora"). */
(function () {
  var S = window.SITE;
  function min(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function fmt(hhmm) { var p = hhmm.split(':'); return +p[0] + 'h' + (p[1] === '00' ? '' : p[1]); }

  class CronogramaEvento extends HTMLElement {
    connectedCallback() {
      var itens = S.cronograma;
      var ini = min(itens[0].inicio), fim = min(itens[itens.length - 1].fim);
      var barra = itens.map(function (i) {
        return '<span class="c-' + i.cor + '" style="flex:' + (min(i.fim) - min(i.inicio)) + '" title="' + i.titulo + '"></span>';
      }).join('');
      var lista = itens.map(function (i) {
        return '<li class="cronograma__item" data-ini="' + min(i.inicio) + '" data-fim="' + min(i.fim) + '">' +
          '<time class="cronograma__hora c-' + i.cor + '">' + fmt(i.inicio) + ' às ' + fmt(i.fim) + '</time>' +
          '<span class="cronograma__titulo">' + i.titulo + '</span></li>';
      }).join('');

      this.innerHTML =
        '<div class="cronograma">' +
          '<h3 class="cronograma__cab">Cronograma previsto</h3>' +
          '<div class="cronograma__barra" aria-hidden="true">' + barra + '</div>' +
          '<ol class="cronograma__lista">' + lista + '</ol>' +
        '</div>';

      var self = this;
      function marcarAgora() {
        var agora = new Date(), alvo = new Date(S.evento.data);
        var hoje = agora.toDateString() === alvo.toDateString();
        var m = agora.getHours() * 60 + agora.getMinutes();
        self.querySelectorAll('.cronograma__item').forEach(function (li) {
          var ativo = hoje && m >= +li.dataset.ini && m < +li.dataset.fim;
          li.classList.toggle('cronograma__item--agora', ativo);
          if (ativo) li.setAttribute('aria-current', 'time'); else li.removeAttribute('aria-current');
        });
      }
      marcarAgora();
      setInterval(marcarAgora, 30000);
    }
  }
  customElements.define('cronograma-evento', CronogramaEvento);
})();
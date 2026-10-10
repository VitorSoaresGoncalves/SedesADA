/* plataforma.js — configuração GLOBAL da plataforma (vale para o hub, o criar-sede e todas as sedes).
   É o único arquivo que você edita para ligar o backend. */
(function () {
  var root = new URL('../', document.currentScript.src).href; // raiz do site

  window.PLATAFORMA = {
    root: root,

    // URL do Google Apps Script publicado (apps-script/Code.gs).
    // Vazio = MODO LOCAL: lê sedes/<slug>.json e sedes/index.json e NÃO pede senha (bom para testar).
    apiUrl: 'https://script.google.com/macros/s/AKfycbzg3rzrKrvHbOtpYcJwQIhh2mpD6vNyFarOLtbwpqXMPIlOl6JTSByuXUW9sXMo9k8E8A/exec',

    // Imagens padrão = as usadas hoje no site da Unifesp. Ao criar uma sede, a pessoa
    // vê cada uma ao lado e escolhe: manter esta ou enviar outra.
    imagensPadrao: {
      hero: 'images/menina-experimento.png',
      sobre: 'images/poster-stem.png',
      cartaz: 'images/inscricoes-abertas.png',
      mulheres: 'images/meninas-stem.png',
      mapa: 'images/mapa-ada.png',
      icone: 'images/icone.png'
    },

    // sufixo colocado no endereço do ícone para o navegador não usar uma versão antiga guardada
    versaoIcone: '?v2',

    url: function (c) { return /^(https?:|data:)/.test(c) ? c : root + c; }
  };
})();
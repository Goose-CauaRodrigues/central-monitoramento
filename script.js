/**
 * ══════════════════════════════════════════════════════
 *  PRENSA-H5 · SUPERVISÓRIO INDUSTRIAL
 *  script.js — Engenharia de Interoperabilidade
 * ══════════════════════════════════════════════════════
 */

/* ── 1. VARIÁVEIS GLOBAIS — mapeamento do DOM ── */
const pressureValue  = document.getElementById('pressureValue');
const pressureDisplay = document.getElementById('pressureDisplay');
const progressBar    = document.getElementById('progressBar');
const spinner        = document.getElementById('spinner');
const alertErro      = document.getElementById('alertErro');
const mensagemErro   = document.getElementById('mensagemErro');
const btnSincronizar = document.getElementById('btnSincronizar');
const badgeStatus    = document.getElementById('badgeStatus');
const statusText     = document.getElementById('statusText');
const logLista       = document.getElementById('logLista');
const relogio        = document.getElementById('relogio');

/* ── Configurações ── */
const API_URL        = 'https://jsonplaceholder.typicode.com/todos/1';
/* Para testar ERRO, troque pela linha abaixo:
   const API_URL = 'https://api.inexistente.com/pressao'; */

const FATOR_PRESSAO  = 1.5;   // id × fator = BAR  →  1 × 1.5 = 1.5 BAR
const LIMITE_CRITICO = 80;    // BAR

/* ── Relógio ── */
function tickRelogio() {
  relogio.textContent = new Date().toLocaleTimeString('pt-BR');
}
tickRelogio();
setInterval(tickRelogio, 1000);

/* ── Horário inicial no log ── */
document.getElementById('logInitTime').textContent =
  new Date().toLocaleTimeString('pt-BR');

/* ═══════════════════════════════════════════════
 *  HELPERS
 * ═══════════════════════════════════════════════ */

function setBadge(estado) {
  badgeStatus.className = 'badge-status ' + (estado === 'aguardando' ? '' : estado);
  const labels = { online: 'ONLINE', offline: 'OFFLINE', aguardando: 'AGUARDANDO' };
  statusText.textContent = labels[estado] ?? estado.toUpperCase();
}

function atualizarBarra(pressao) {
  const pct = Math.min((pressao / 100) * 100, 100).toFixed(1);
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pressao.toFixed(1));
  progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
  if      (pressao >= LIMITE_CRITICO)          progressBar.classList.add('bg-danger');
  else if (pressao >= LIMITE_CRITICO * 0.75)   progressBar.classList.add('bg-warning');
  else                                          progressBar.classList.add('bg-success');
}

function log(mensagem, tipo = 'info') {
  const li   = document.createElement('li');
  li.className = `log-item log-${tipo}`;
  const hora = document.createElement('span');
  hora.className = 'log-time';
  hora.textContent = new Date().toLocaleTimeString('pt-BR');
  const txt  = document.createElement('span');
  txt.textContent = mensagem;
  li.append(hora, txt);
  logLista.prepend(li);
  while (logLista.children.length > 50) logLista.removeChild(logLista.lastChild);
}

/* ═══════════════════════════════════════════════
 *  2. FUNÇÃO PRINCIPAL — monitorarPressao()
 * ═══════════════════════════════════════════════ */
async function monitorarPressao() {

  /* Fase 1 — Preparação */
  spinner.classList.remove('d-none');
  alertErro.classList.add('d-none');
  btnSincronizar.disabled = true;
  pressureDisplay.classList.add('loading');
  log('Iniciando requisição ao sensor…', 'info');

  try {

    /* Fase 2 — Requisição */
    const resposta = await fetch(API_URL);

    /* Fase 3 — Validação */
    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status} — ${resposta.statusText}`);
    }

    /* Fase 4 — Processamento */
    const dados   = await resposta.json();
    const pressao = parseFloat((dados.id * FATOR_PRESSAO).toFixed(1));

    /* Fase 5 — Interface */
    pressureValue.classList.remove('critical', 'offline');
    pressureValue.textContent = pressao.toFixed(1);
    atualizarBarra(pressao);
    setBadge('online');

    if (pressao >= LIMITE_CRITICO) {
      pressureValue.classList.add('critical');
      log(`⚠ PRESSÃO CRÍTICA: ${pressao} BAR — acionar protocolo de emergência!`, 'warn');
    } else {
      log(`Leitura OK: ${pressao} BAR — sistema operando normalmente.`, 'success');
    }

  } catch (erro) {

    /* Fase 6 — Tratamento de Erro */
    mensagemErro.textContent = erro.message;
    alertErro.classList.remove('d-none');

    pressureValue.classList.remove('critical');
    pressureValue.classList.add('offline');
    pressureValue.textContent = 'OFFLINE';

    progressBar.style.width = '0%';
    progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');

    setBadge('offline');
    log(`ERRO: ${erro.message}`, 'error');

  } finally {

    /* Fase 7 — Finalização */
    spinner.classList.add('d-none');
    btnSincronizar.disabled = false;
    pressureDisplay.classList.remove('loading');
  }
}

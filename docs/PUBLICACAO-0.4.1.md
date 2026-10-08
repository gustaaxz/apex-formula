# Publicação da revisão 0.4.1

Destino: [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula), branch main. Data: 08/10/2026.

A entrega reúne os mapas e o HUD da revisão 0.4 e a saída apenas pelo acelerador da revisão 0.4.1. Os dez commits são organizados por assunto, com descrição de cada arquivo. O histórico remoto anterior é preservado. Os 87 testes foram aprovados, incluindo voltas secas/molhadas e boxes nos seis mapas. A largada foi repetida no navegador somente com W.

Relatórios e manifestos antigos permanecem históricos. O manifesto 0.4.1 descreve a entrega atual. Seu iniciador JOGAR.cmd considera os bytes LF já preservados no GitHub; o checkout Windows pode convertê-los para CRLF. O arquivo distribuído usa os mesmos bytes publicados.

## 1. feat: revisar os seis circuitos e cronometrar setores

- **tracks.js**: Identifica APX-01 a APX-06, redesenha curvas, relevo, boxes, escapes e limites de decoração.
- **timing.js**: Interpola voltas e setores; compara delta na mesma distância e rejeita recordes inválidos.
- **chassis.js**: Corrige velocidades nos contatos da IA e aplica as proteções específicas de cada trecho.
- **simulation.js**: Integra os novos circuitos, cronometragem e proteções; atualiza mensagens de largada e boxes para usar o acelerador.

## 2. feat: permitir largada pelo acelerador sem embreagem manual

- **vehicle.js**: Acopla automaticamente em baixa velocidade e rotação; mantém grid parado, marchas manuais, patinação e limites físicos da pista.

## 3. feat: detalhar cenários e HUD e remover controles de embreagem

- **game.js**: Adiciona cenários e instrumentos de pilotagem; remove comandos de embreagem do teclado, toque e gamepad e atualiza ajuda e mensagens.
- **index.html**: Carrega os módulos de mapas/setores e apresenta instrumentos; retira slider e botão de embreagem e identifica a versão 0.4.1.
- **style.css**: Adapta mapas e instrumentos a telas estreitas e paisagem; reorganiza seis controles de toque e retira estilos de embreagem.

## 4. test: validar mapas e largada com 87 testes

- **tests/browser-lab.html**: Atualiza o protocolo de teclado para largada somente pelo acelerador, com estados antes e depois.
- **tests/car-audit.cjs**: Grava as medições da revisão 0.4 sem substituir relatórios anteriores.
- **tests/car-bench.html**: Carrega os novos módulos na bancada térmica do navegador.
- **tests/dynamics-audit.cjs**: Grava a auditoria de dinâmica da revisão 0.4 mantendo o histórico.
- **tests/helpers.cjs**: Piloto exclusivo de teste usa direção, acelerador, freio e trocas manuais, sem comando de embreagem.
- **tests/launch.test.cjs**: Valida acelerador sozinho, grid, espera, dosagem, paradas nas oito marchas, repartidas, ré e patinação no molhado.
- **tests/maps-audit.cjs**: Registra geometria e ensaios de todos os circuitos em relatório próprio.
- **tests/maps-browser.html**: Inspeciona curvas e envia eventos de teclado; largada usa somente W.
- **tests/simulation.test.cjs**: Adapta verificações de corrida e geometria à extensão dos novos mapas.
- **tests/timing.test.cjs**: Valida setores, delta, sentido inverso e invalidação de recordes.
- **tests/track-metrics.cjs**: Centraliza métricas de traçado, volta e boxes para os ensaios repetíveis.
- **tests/tracks.test.cjs**: Valida geometria, voltas no seco/chuva, boxes e estabilidade de vinte carros nos seis mapas.

## 5. chore: versionar 0.4.1 e documentar aceleração normal

- **README.md**: Documenta mapas, HUD, 87 testes, oito marchas e saída pelo acelerador.
- **LEIA-ME.md**: Atualiza o guia em português com os controles e instruções atuais.
- **package.json**: Define versão 0.4.1 e reúne os 87 testes e a auditoria de mapas.

## 6. docs: registrar inspeção visual dos seis circuitos

- **docs/mapas-0.4/APX-01.png**: Preserva a inspeção visual do circuito APX-01 na revisão dos mapas.
- **docs/mapas-0.4/APX-02.png**: Preserva a inspeção visual do circuito APX-02 na revisão dos mapas.
- **docs/mapas-0.4/APX-03.png**: Preserva a inspeção visual do circuito APX-03 na revisão dos mapas.
- **docs/mapas-0.4/APX-04.png**: Preserva a inspeção visual do circuito APX-04 na revisão dos mapas.
- **docs/mapas-0.4/APX-05.png**: Preserva a inspeção visual do circuito APX-05 na revisão dos mapas.
- **docs/mapas-0.4/APX-06.png**: Preserva a inspeção visual do circuito APX-06 na revisão dos mapas.

## 7. docs: registrar revisão de mapas HUD e largada

- **docs/browser-hud-validation-0.4.json**: Preserva medidas e inspeção do navegador da revisão de mapas e HUD 0.4.
- **docs/browser-launch-0.4.1.json**: Preserva o ensaio real de teclado: zero no grid e 108,1 km/h em primeira após cinco segundos somente com W.
- **docs/browser-maps-validation-0.4.json**: Preserva medidas e inspeção do navegador da revisão de mapas e HUD 0.4.
- **docs/car-audit-0.4.txt**: Preserva a saída dos testes ou auditoria da revisão 0.4; permanece um registro histórico.
- **docs/car-validation-0.4.json**: Preserva as medições de validação da revisão 0.4; permanece um registro histórico.
- **docs/dynamics-audit-0.4.txt**: Preserva a saída dos testes ou auditoria da revisão 0.4; permanece um registro histórico.
- **docs/dynamics-validation-0.4.json**: Preserva as medições de validação da revisão 0.4; permanece um registro histórico.
- **docs/hud-0.4.png**: Preserva evidência visual do HUD na revisão 0.4, anterior à remoção da embreagem manual.
- **docs/LARGADA-0.4.1.md**: Explica a largada pelo acelerador, arquivos modificados, 87 testes e resultado no navegador.
- **docs/MAPAS-HUD-0.4.md**: Identifica os seis mapas, alterações por arquivo, ensaios e limites da revisão 0.4.
- **docs/maps-validation-0.4.json**: Preserva as medições de validação da revisão 0.4; permanece um registro histórico.
- **docs/PLANO-DE-MELHORIAS.md**: Registra mapas/HUD concluídos e a decisão posterior de retirar a embreagem manual; preserva pendências.
- **docs/revision-manifest-0.4.json**: Preserva os hashes históricos do pacote local 0.4.0.
- **docs/TESTES-0.4.1.txt**: Preserva a execução atual dos 87 testes aprovados.
- **docs/TESTES-0.4.txt**: Preserva a saída dos testes ou auditoria da revisão 0.4; permanece um registro histórico.
- **docs/PUBLICACAO-0.4.1.md**: Lista os commits e a descrição de cada arquivo publicado.
- **docs/revision-manifest-0.4.1.json**: Permite comparar todos os arquivos entregues por SHA-256, excluindo o próprio manifesto.


## Correções finais de caracteres

A conferência visual da publicação encontrou acentos corrompidos nos guias, na descrição do projeto e no laboratório. Os arquivos abaixo foram corrigidos em UTF-8; o código de física e os resultados dos 87 testes não foram alterados.

## 8. fix: preservar acentos nos guias e metadados

README.md: Corrige a codificação dos acentos no guia atual, mantendo os controles e os 87 testes documentados.

LEIA-ME.md: Preserva os mesmos caracteres corretos no guia em português.

package.json: Corrige o acento da descrição do projeto, mantendo versão e comandos de teste.

## 9. fix: preservar acentos no laboratório de teclado

tests/browser-lab.html: Recupera a codificação UTF-8 dos rótulos e mensagens, preservando o protocolo de largada somente pelo acelerador W.

## 10. docs: atualizar integridade dos textos publicados

docs/PUBLICACAO-0.4.1.md: Registra os três commits finais de correção de caracteres e a entrega dos mesmos 87 arquivos.

docs/revision-manifest-0.4.1.json: Recalcula os hashes dos guias, metadados, laboratório e inventário para a versão com caracteres corretos.

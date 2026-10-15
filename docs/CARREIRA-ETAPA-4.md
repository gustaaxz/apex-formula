# Etapa 4 — carreira e campeonato independentes

Entrega local em 15/10/2026. Implementação concluída para avaliação; a continuidade para a etapa 5 foi autorizada posteriormente pelo usuário.

## Objetivos entregues

- **E4.1 — progresso por modo:** carreira e campeonato possuem nome de piloto, temporada, rodada, calendário, pontos e resultados independentes. Créditos, reputação e melhorias são ganhos e utilizados na carreira. GP, treino, classificação e contra o relógio não avançam temporadas.
- **E4.2 — disputa pelo título:** cada corrida definitiva registra os resultados do pelotão. A classificação acumula pontos dos 20 pilotos; desempata por vitórias, segundos lugares e demais posições. Persistindo igualdade, utiliza a ordem original dos participantes. Abandonos não pontuam.
- **E4.3 — calendário e histórico:** seis etapas por temporada. A próxima corrida segue o calendário do modo escolhido; os seletores de pista ficam desativados nesses modos. Ao concluir a sexta etapa, a tabela é arquivada, começa uma nova temporada e o patrimônio da carreira é mantido. São preservadas as últimas cinco tabelas finais.
- **E4.4 — persistência:** formato versionado e validação de identidade, valores, calendário, melhorias e sequência de resultados. Uma rodada concluída não pode ser reaplicada ao reabrir o resultado ou recarregar o jogo.
- **E4.5 — energia:** a regeneração adicional por melhoria passou do laço gráfico para a física a 120 Hz. O bônus é de 0,08 ponto percentual de bateria por segundo por nível, durante frenagem com regeneração e velocidade acima de 2 m/s; até três níveis e limite de 100% de carga. Não atua em outros modos, parado, no grid ou durante o serviço de boxes.

## Progresso existente

O formato antigo utilizava `apex-formula-v1` para os dois modos, sem identificar a origem dos pontos. A migração preserva esse progresso na **carreira** e inicia o campeonato independente, copiando apenas a identidade do piloto. A chave antiga permanece intacta.

Não havia resultados anteriores dos rivais. Pontos e rodada antigos do jogador são preservados, e a classificação informa **histórico parcial** até o fim dessa temporada. O arquivo daquela temporada também mantém esse aviso; seu primeiro colocado aparece como líder do registro parcial. As novas temporadas possuem histórico completo.

O novo documento usa `apex-progress-v2`, com seções separadas `career` e `championship`. Antes de substituir dados inválidos ou ajustados, o original é preservado em `apex-progress-v2-recovery`. Se essa cópia falhar, a gravação principal é recusada. Uma versão futura desconhecida fica intacta, e a sessão funciona sem gravar progresso. Erros de leitura ou gravação aparecem na interface.

Os dados continuam locais ao navegador e à origem utilizada. A migração não transfere dados entre `file://`, servidores locais, navegadores ou computadores. Não há sincronização em nuvem, importação/exportação na interface ou recuperação de um armazenamento apagado pelo usuário. Configurações e recordes pessoais mantêm suas chaves próprias.

## Como avaliar no jogo

1. Abra `index.html`, selecione **Carreira** e entre no paddock. Confira os dados migrados, se existirem. Abra **Classificação da temporada**: observe o aviso de histórico parcial, os 20 pilotos e a pista marcada como próxima.
2. Complete uma corrida. Na tela definitiva, abra a classificação: os pontos devem acompanhar a posição corrigida por punições. Volte à tela de resultado e abra a tabela novamente; os pontos e créditos devem permanecer iguais.
3. Volte ao menu e selecione **Campeonato**. Ele deve começar na primeira etapa, sem os créditos, melhorias ou pontos da carreira. Complete uma rodada e confira a pontuação dos adversários.
4. Recarregue a página e alterne entre os modos. Cada um deve retomar a sua própria próxima etapa. GP e contra o relógio permitem escolher pista livremente e não alteram as temporadas.
5. Termine a sexta rodada de um modo. Confira a mensagem de conclusão e o resumo da temporada arquivada na tabela. A temporada seguinte deve começar na primeira pista, com zero ponto; na carreira, créditos e melhorias permanecem disponíveis.

As capturas `season-stage4-standings.png`, `season-stage4-migration.png`, `season-stage4-rollover.png` e `season-stage4-mobile.png` registram exemplos controlados da interface real.

## Verificação técnica

- `npm test`: 164 testes aprovados, incluindo 17 novos testes de progressão, migração, isolamento, repetição, falhas de armazenamento e regeneração de energia. Saída completa: `TESTES-ETAPA-4.txt`.
- `node tools/results-browser-check.cjs --stage4`: 28 cenários aprovados, sem exceções de execução. Integra os cenários das etapas anteriores e sete cenários da etapa 4, usando um perfil temporário exclusivo de Chrome/Edge. Relatório: `season-stage4-browser.json`.
- A verificação de energia usa o mesmo passo físico a 120 Hz com quadros gráficos a 30, 60 e 120 Hz. Isso verifica independência da taxa de apresentação, sem prometer FPS ou desempenho de dispositivos reais.
- As corridas usadas na verificação de interface recebem passagens controladas por checkpoints. O teste valida integração e apresentação; não representa seis corridas pilotadas por uma pessoa.

Arquivos principais: `progression.js` contém as regras e a persistência; `game.js` integra modos, calendário e telas; `vehicle.js` aplica o bônus de energia. Os testes estão em `tests/progression.test.cjs` e `tools/progression-browser-scenarios.cjs`.

## Limites mantidos

O calendário padrão é o mesmo conjunto de seis pistas fictícias em cada modo, com progresso independente. Não há editor de calendário. A interface resume as temporadas anteriores com posição, pontos e campeão; a tabela completa de cada uma é preservada no salvamento. Contratos negociáveis, equipes dinâmicas, campeonatos personalizados e equilíbrio dos seis upgrades permanecem para entregas futuras.

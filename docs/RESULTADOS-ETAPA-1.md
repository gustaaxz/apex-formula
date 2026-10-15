# Etapa 1 — resultados de corrida

Implementada em 15/10/2026. Aguardando avaliação do usuário antes da etapa 2.

Atualização posterior: as etapas [2](PERCURSO-ETAPA-2.md) e [3](ADVERSARIOS-ETAPA-3.md) foram autorizadas e implementadas. As limitações de percurso descritas no fechamento original desta entrega foram tratadas na etapa 2.

## Comportamento

- A primeira passagem pela linha ao completar a distância programada abre a bandeirada. Cada outro participante encerra na sua próxima passagem pela linha, mesmo com voltas a menos.
- A chegada é interpolada dentro do passo físico e registrada uma única vez, em segundos desde a largada.
- Concluintes são ordenados por voltas completadas, depois por tempo de chegada acrescido de punições. Empates exatos usam o identificador do piloto como desempate estável nesta edição local.
- Abandonos ficam depois dos concluintes, com identificação do motivo e sem pontos, créditos ou ganho de reputação. Não recebem tempo de chegada inventado.
- Após dez minutos simulados da bandeirada, quem ainda não concluiu é registrado como abandono. Esse prazo vale também para o jogador e é uma regra local para evitar sessões indefinidas.
- Carros que encerraram deixam de participar das colisões e da esteira aerodinâmica; adversários encerrados deixam de ser desenhados na pista.
- Depois da chegada ou abandono do jogador, aparece um aviso de resultado provisório. A simulação dos adversários é acelerada em até 48 vezes; o fator efetivo depende do desempenho do computador. O resultado definitivo só aparece quando todos concluíram ou abandonaram.
- Sair pelo botão do resultado provisório não registra a etapa nem suas recompensas. Permanecer até o fechamento registra a etapa, inclusive em caso de abandono, permitindo avançar o calendário.
- Posição, pontos, créditos e reputação da carreira usam a mesma classificação definitiva. A aplicação de recompensas é protegida contra repetição dentro da sessão.
- A tabela final mostra os vinte participantes, voltas, chegada, punição, tempo corrigido e situação. Em telas estreitas, a tabela tem rolagem horizontal.
- Treino, classificação por referência e contra o relógio continuam com seu encerramento próprio. Esta etapa não modifica a pilotagem manual.

## Avaliação rápida, sem servidor

Abra `tests/results-review.html` no Chrome ou Edge. A página funciona offline e não lê nem modifica seus salvamentos. Usa o mesmo cálculo de classificação e a mesma tabela do jogo, com participantes controlados para facilitar a conferência.

| Cenário | O que conferir |
| --- | --- |
| Sem punição | A chega em 1:40 e B em 1:42. A recebe P1, 25 pontos e 140 créditos no perfil fictício. |
| A +5 s / B chega +2 s | A passa a 1:45 corrigido. B vence em 1:42; A recebe P2, 18 pontos e 112 créditos. |
| Uma volta atrás | B completa três voltas, A completa duas. A aparece com +1 volta. |
| Abandono | A não recebe pontos nem créditos; motivo e ausência de chegada são apresentados. |
| Resultado provisório | Nenhuma recompensa é registrada até clicar em Concluir adversário. Depois, A recebe P1 e 25 pontos. |
| Reabrir resultado | Pontos, créditos, reputação e etapa registrada permanecem iguais. |

Na sua avaliação, observe se a posição e a punição ficam claras, se a tabela é legível e se o fechamento da corrida no jogo normal é confortável.

## Verificação técnica

- `npm test`: 104 testes, incluindo 17 novos testes de classificação, recompensas, interpolação, abandono, chegada nos boxes e integração com uma corrida do grid até o encerramento.
- `node tools/results-browser-check.cjs`: verificação opcional da tela real em Chrome/Edge, com perfil temporário e servidor restrito ao loopback. Requer Node 22+ e navegador instalado; não usa pacotes npm. A variável APEX_BROWSER permite indicar outro executável.
- O laboratório `tests/results-browser.html` usa a tela real do jogo e precisa ser servido por HTTP local. Seu modo padrão é Grand Prix, sem gravação de progresso. O parâmetro de teste mode=career grava o perfil da origem usada; a ferramenta automatizada executa esse teste em perfil temporário separado.
- `docs/results-stage1-browser.json` registra os cenários verificados. As imagens `results-stage1-penalty.png` e `results-stage1-mobile.png` mostram a tela real.

## Limitações mantidas para próximas etapas

A contagem de progresso ainda usa distância projetada na pista. Checkpoints obrigatórios e proteção completa contra cortes, saltos e reposicionamento são a etapa 2. A IA mantém sua física simplificada, as neutralizações ainda não têm fiscalização completa e carreira/campeonato ainda compartilham salvamento. Esta entrega não declara concluídos esses itens.

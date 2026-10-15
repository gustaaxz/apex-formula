# Etapa 5 — controles, aprendizado e feedback

Entrega local em 15/10/2026. Implementação e verificação automatizada concluídas para avaliação. A avaliação humana de conforto em teclado e gamepad físico permanece pendente; a continuidade para a etapa 6 foi autorizada posteriormente pelo usuário.

## Objetivos

- **E5.1 — ajustar os comandos:** remapeamento das teclas e botões do gamepad, detecção de conflitos, restauração do padrão e persistência própria. Esc e setas permanecem como alternativas fixas. Ajustes de sensibilidade do analógico, resposta de esterço, zonas mortas de direção/olhar/pedais e resposta dos pedais digitais.
- **E5.2 — praticar uma habilidade por vez:** escola com exercícios de marchas, frenagem e boxes em sessões individuais de Costa Verde. As instruções acompanham a etapa do exercício, os comandos escolhidos e os dados reais do carro. Há conclusão, explicação de falha, repetição e retorno ao menu.
- **E5.3 — entender a perda de aderência:** avisos de rodas travadas, patinagem, pneus frios, pneus superaquecidos e combustível baixo, com ações sugeridas. Há filtragem de oscilações breves, prioridade entre avisos e sons específicos. Não há direção, frenagem, troca de marcha, ABS ou controle de tração automáticos.
- **E5.4 — preparar a avaliação de conforto:** inspeção das telas e testes de teclado, gamepad simulado, toque e áudio no navegador; roteiro abaixo para avaliação humana no equipamento do usuário. Esses testes não equivalem a uma sessão humana com gamepad físico.

## Onde encontrar

No menu principal, abra **Controles**:

- **Configurar controles:** selecione a tecla de um comando, pressione a nova tecla e aplique. Botões do gamepad são escolhidos por número. Conflitos são informados sem substituir outro comando silenciosamente. Para liberar um botão de uma ação opcional, escolha “Sem botão”.
- **Escola de pilotagem:** escolha um exercício, leia as condições iniciais e clique em **Começar exercício**. Nos exercícios de frenagem e boxes, o carro já começa em movimento. Esc pausa e permite configurar controles ou reiniciar.

Durante uma sessão, **Pausa → Controles** abre os mesmos ajustes. Os rótulos de ajuda, as instruções dos exercícios e os atalhos do HUD acompanham o teclado remapeado. Os botões de toque preservam suas funções independentemente do teclado.

## Resposta dos comandos

O gamepad usa o primeiro dispositivo conectado reconhecido pela API Gamepad do navegador. Analógico esquerdo dirige; o eixo horizontal do analógico direito controla o olhar. Os botões podem ser remapeados de 0 a 31. O painel de controles mostra o nome do dispositivo e a leitura dos comandos com os ajustes em edição.

As zonas mortas retiram o movimento próximo ao centro e reescalam o curso restante até 100%. A sensibilidade altera a curva, preservando as extremidades. A velocidade de esterço determina a rapidez com que o volante responde; não corrige a trajetória.

Nos pedais digitais, segurar aumenta a pressão; soltar libera imediatamente. O padrão é 1,5 unidade de pressão por segundo, ajustável de 0,5 a 8. Isso permite dosar o freio com toques. A pressão analógica do gamepad continua proporcional ao gatilho. As rampas digitais e o esterço são aplicados no passo físico, sem depender da frequência gráfica.

Esc não pode ser remapeado no teclado. Setas são alternativas fixas. Não há combinações com Ctrl, Alt ou Meta. Os botões do gamepad são lidos por transições, evitando trocas repetidas enquanto estão segurados; a leitura continua durante a pausa para permitir retomar pelo controle. Desconectar o dispositivo remove seus pedais, direção e olhar.

## Exercícios

| Exercício | Condição inicial | Critério de conclusão |
| --- | --- | --- |
| Marchas e retomada | Parado, primeira marcha | Alcançar 60 km/h em primeira; subir manualmente e alcançar 80 km/h em segunda; frear até 40 km/h e reduzir manualmente para primeira |
| Frenagem progressiva | 80 km/h, segunda marcha | Usar o freio, parar em até 100 m e sustentar a parada por 0,5 s; no máximo 0,35 s de travamento |
| Boxes | 40 km/h, 430 m antes da linha | Solicitar boxes, entrar com limitador ativo, respeitar 80 km/h, parar na marca, aguardar o serviço e retornar manualmente à pista |

Os exercícios usam pista seca e pneus aquecidos. Há limites de tempo e falhas por contato, saída do trecho ou perda do ponto de entrada/parada/saída. O exercício de frenagem marca visualmente o limite de 100 m.

Os exercícios não concedem pontos, créditos ou reputação, não salvam recordes e não avançam calendários. Ao sair, o modo e a pista anteriores são restaurados. Repetir um exercício mantém suas condições de treino, sem aplicar melhorias da carreira.

## Avisos visuais e sonoros

| Aviso | Indicação | Resposta sugerida |
| --- | --- | --- |
| Rodas travadas | Estado de travamento de qualquer eixo, persistente por pelo menos 0,12 s | Aliviar o freio |
| Patinagem | Estado de patinagem persistente por pelo menos 0,18 s | Aliviar o acelerador e endireitar o volante antes de acelerar |
| Temperatura | Fora da janela do composto por mais de 3 °C, em movimento, por pelo menos 1 s | Aquecer com ritmo progressivo ou reduzir o escorregamento para resfriar |
| Pouco combustível | Menos de 2 kg com consumo habilitado, por pelo menos 0,3 s | Aliviar o acelerador e antecipar a desaceleração; não há reabastecimento |

São mostrados até dois avisos, priorizando travamento, patinagem, combustível e temperatura. O desaparecimento tem um pequeno atraso para evitar cintilação. Em telas estreitas, detalhes da classificação e dos tempos cedem espaço temporariamente aos avisos; velocidade e pedais permanecem livres. Em retratos com até 700 px de altura, o minimapa cede espaço temporariamente e aparece apenas o aviso prioritário. Em paisagem baixa, também aparece apenas o aviso prioritário.

Travamento e patinagem usam ruído filtrado de pneus com frequências distintas. Combustível usa dois tons curtos; temperatura usa um. Avisos contínuos não geram bipes repetitivos. Os sons dependem do áudio geral e do volume e podem ser desativados separadamente em **Configurar controles → Alertas sonoros de pilotagem**. As mensagens visuais permanecem.

Os sons são sinais sintetizados de orientação, não gravações físicas de pneus. O navegador pode exigir interação para liberar áudio; o sistema de voz do engenheiro continua separado.

## Persistência

Os comandos e ajustes usam `apex-controls-v1`, com versão e validação de campos. Configurações inválidas retornam a valores utilizáveis; mapas com comandos duplicados retornam ao padrão do respectivo dispositivo. A ação “Restaurar padrão” só é aplicada e gravada ao confirmar. Cancelar descarta a edição.

Se o navegador recusar a gravação, os comandos são aplicados na sessão e o aviso informa a falha. A carreira e o campeonato continuam nas estruturas da etapa 4; exercícios e ajustes de controles não escrevem seus resultados.

## Verificações

- `npm test`: **185 testes aprovados**, incluindo 21 novos testes de controles, feedback e exercícios. Saída completa: `TESTES-ETAPA-5.txt`.
- Os três exercícios foram concluídos em testes com física real e entradas explícitas. O teste de frenagem digital usa pressões de aproximadamente 167 ms, liberações de 100 ms e manutenção do freio próximo da parada; completa o exercício sem travamento. É um padrão automatizado, não uma medição de conforto humano.
- Testes de resposta digital com apresentação a 30, 60 e 120 Hz mantêm o mesmo resultado físico a 120 Hz.
- `node tools/results-browser-check.cjs --stage5`: **38 cenários aprovados, sem exceções de execução**, incluindo a regressão das etapas anteriores e dez cenários da etapa 5: remapeamento e recarga, gamepad simulado, pausa/retomada, desconexão, alertas e áudio Web Audio, exercícios, preservação da carreira, toque e paisagem. Relatório: `learning-stage5-browser.json`, consolidando a execução completa e a rechecagem dos dez cenários da etapa 5 após os ajustes finais de espaçamento e instruções.
- O teste de interface usa telemetria controlada para forçar avisos e fases dos exercícios. As passagens completas com física real são verificadas separadamente nos testes de regras. A existência e o controle do grafo de áudio são verificados; isso não demonstra audibilidade ou qualidade em caixas de som reais.
- Capturas: `learning-stage5-controls.png`, `learning-stage5-controls-mobile.png`, `learning-stage5-lock.png`, `learning-stage5-temperature-fuel-mobile.png`, `learning-stage5-lesson-mobile.png` e `learning-stage5-landscape.png`.

Arquivos: `controls.js`, `coaching.js` e `training.js`; integração em `game.js` e `vehicle.js`; testes em `tests/learning.test.cjs` e `tools/learning-browser-scenarios.cjs`.

## Avaliação humana solicitada

1. No teclado, configure uma tecla, recarregue e confirme o comando. Tente usar a mesma tecla em outra função; o conflito deve ser claro. Verifique Esc e setas.
2. Faça o exercício de marchas. Avalie se entende qual é a próxima ação sem abrir a ajuda. Depois faça a frenagem, modulando o freio. Se a resposta parecer brusca, reduza a resposta dos pedais; se parecer lenta, aumente.
3. Faça o exercício de boxes. Avalie a distância indicada, a facilidade de encontrar a marca e o aviso de que o limitador não freia. Reinicie e confira se as condições iniciais foram restauradas.
4. Em um gamepad físico, ajuste a zona morta até eliminar o desvio em repouso. Confirme curso completo dos gatilhos e direção, trocas únicas ao segurar o botão, pausa e retomada. Desconecte o dispositivo e confira se os comandos cessam.
5. Com som ligado e volume confortável, provoque brevemente um travamento e uma patinagem. Avalie se os sons se distinguem e se as sugestões ajudam a corrigir. Desative apenas os alertas sonoros e confira que os textos continuam.
6. Avalie legibilidade, resposta dos pedais e conforto da direção de 1 a 5. Informe dispositivo, navegador, resolução e qual ajuste ajudou ou atrapalhou. Isso orienta a calibração antes da etapa 6.

Limites: não há remapeamento dos eixos físicos, calibração individual de volante/pedaleira ou force feedback. Menus usam mouse, teclado ou toque; não há navegação completa de foco por gamepad. O comportamento de dispositivos fora do padrão depende do mapeamento exposto pelo navegador. Conforto humano, acessibilidade com leitor de tela e funcionamento em aparelhos móveis físicos ainda precisam de avaliação específica.

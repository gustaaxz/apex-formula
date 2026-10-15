# Etapa 2 — percurso e classificação válidos

Implementada em 15/10/2026. O usuário autorizou seguir diretamente para a etapa 3 após a validação.

- As seis pistas têm 120 pontos de controle ordenados. A passagem confere direção, posição física e largura do traçado; o corredor dos boxes é aceito somente na área de entrada e saída.
- Saltos de posição, descontinuidade entre amostras e velocidades de deslocamento incompatíveis com o passo físico não preenchem pontos intermediários artificialmente.
- A contagem de voltas, a chegada e as posições durante a corrida usam o progresso validado. Passar novamente pela mesma linha após andar em sentido inverso não duplica volta ou setor.
- Uma tentativa com pontos faltando não conta como volta de corrida nem como recorde. Ao cruzar a linha no sentido correto, uma nova tentativa começa e pode ser concluída normalmente.
- Sair da pista continua invalidando o recorde mesmo quando todos os pontos foram percorridos. Isso é distinto de uma volta incompleta, que não recebe crédito de percurso.
- X devolve o carro parado ao último ponto validado, mantém a sequência restante, invalida o recorde da tentativa atual e aplica +5 segundos. Reposicionar diretamente perto da chegada não concede progresso.
- A classificação sem melhor volta válida exibe **Sem tempo válido** e define P20. O tempo total da sessão não é mais usado como substituto de volta válida.
- Os novos recordes do contra o relógio usam a chave apex-best-course-v1, separada dos recordes anteriores à fiscalização do percurso. Os dados antigos não são apagados.

## Avaliação

O jogo continua abrindo offline por index.html. Para verificar exemplos controlados da tela real, sirva a pasta por HTTP local e abra tests/course-browser.html. Exemplo, com Python instalado:

```
python -m http.server 8765 --bind 127.0.0.1
```

Abra http://127.0.0.1:8765/tests/course-browser.html e confira Classificação válida, Sem tempo válido, Largar em P20, Corte de caminho e Recuperar com X. Esse laboratório usa Grand Prix e não grava progresso de carreira.

## Verificação

19 testes em tests/course.test.cjs cobrem as seis pistas, corte, salto, retorno em sentido inverso, recuperação, posições, boxes, carro parado sobre a linha e classificação inválida. A primeira validação passou com 122 testes; o caso adicional de carro parado também foi incorporado à suíte atual. O teste automatizado opcional `node tools/results-browser-check.cjs --stage2` passou em 14 cenários, incluindo regressões da etapa 1 e telas desktop/móvel; relatório em course-stage2-browser.json.

## Limites

São pontos discretos de controle, não um levantamento contínuo de toda a carroceria na área de pista. Os limites de pista e suas advertências complementam a passagem pelos pontos. O motor continua local e seu estado pode ser alterado por ferramentas de desenvolvimento; não se trata de validação de servidor para competição online.

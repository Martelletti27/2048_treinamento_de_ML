# 🎮 Sistema de Benchmark e Evolução de Algoritmos de IA para 2048

Sistema completo de treinamento, análise e competição de múltiplos modelos de Inteligência Artificial para o jogo 2048. Permite testar, calibrar, treinar e comparar 21 algoritmos diferentes em um ambiente controlado com visualização em tempo real, métricas avançadas e arena de combate.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Modelos de IA Implementados](#modelos-de-ia-implementados)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Métricas e Análises](#métricas-e-análises)
- [Sistema de Persistência](#sistema-de-persistência)
- [Arena de Combate](#arena-de-combate)

## 🎯 Sobre o Projeto

Este projeto implementa um **framework de experimentação e comparação de algoritmos de IA** para o jogo 2048. O sistema oferece duas modalidades principais:

### 🎓 **Página de Treinamento**
- Executa **100 jogos simultâneos** em paralelo
- Permite **calibrar parâmetros** de cada modelo em tempo real
- Coleta **métricas detalhadas** de desempenho
- Permite **salvar modelos treinados** com nomes personalizados
- Visualizações analíticas em tempo real

### ⚔️ **Arena de Combate**
- Competição entre até **6 modelos simultâneos**
- Rodadas cronometradas de **5 minutos**
- Sistema de **ranking dinâmico** e **pódio**
- Visualização em tempo real de cada jogo
- Hype Feed com comentários analíticos

## ✨ Funcionalidades

### 🎮 Treinamento
- **100 jogos simultâneos**: Execução paralela de múltiplas instâncias do jogo
- **Visualização em tempo real**: Canvas com grade 10x10 mostrando todos os jogos
- **Controles intuitivos**: Iniciar, pausar, resetar e salvar modelos
- **21 algoritmos diferentes**: De heurísticos simples a redes neurais profundas
- **Calibração de parâmetros**: Sliders para ajustar hiperparâmetros de cada modelo
- **Sistema de persistência**: Salvar e carregar modelos treinados com nomes personalizados

### 📊 Métricas em Tempo Real
- **Jogos Finalizados**: Contador de jogos concluídos
- **Tempo Decorrido**: Cronômetro do tempo de treinamento
- **Velocidade (MPS)**: Movimentos por segundo executados
- **Peça Recorde**: Maior peça alcançada
- **Score Médio**: Média de pontuação dos jogos ativos
- **Taxa de Sucesso**: Percentual de jogos que alcançaram 2048
- **Eficiência**: Pontos por movimento
- **Maior Peça**: Maior peça alcançada em jogos finalizados
- **Tempo até 2048**: Tempo médio para alcançar 2048 pela primeira vez
- **Movimentos Médios**: Média de movimentos por jogo
- **Taxa de Melhoria**: Tendência de melhoria ao longo do tempo

### 📈 Análises Avançadas
- **Melhor Jogada**: Melhor jogo (finalizado ou não) de todos os tempos
- **Heatmap de Posições**: Frequência de onde a maior peça aparece (em %)
- **Histograma de Frequências**: Distribuição de pontuações com eixo X adaptativo
- **Melhor Indivíduo por Segundo**: Gráfico de linha mostrando evolução temporal do melhor score
- **Taxa de Sucesso por Segundo**: Gráfico de linha mostrando evolução da taxa de sucesso

### ⚔️ Arena de Combate
- **Até 6 modelos simultâneos**: Selecione modelos base ou treinados
- **Timer de 5 minutos**: Rodadas cronometradas
- **Ranking dinâmico**: Ordenação por melhor pontuação histórica, maior peça ou número de jogos
- **Pódio**: Top 3 modelos com melhor desempenho
- **Hype Feed**: Comentários analíticos sobre a competição
- **Gráfico de pontuação**: Evolução da pontuação de classificação geral ao longo do tempo
- **Auto-restart**: Modelos que perdem reiniciam automaticamente
- **Vitória**: Primeiros 3 modelos a atingir 2048 ou melhor média ao final do tempo

## 🤖 Modelos de IA Implementados

### 1. **Heurísticos (Regras Fixas)**

#### Random
- Seleciona movimentos aleatórios
- **Uso**: Baseline para comparação
- **Complexidade**: O(1)

#### Greedy
- Escolhe o movimento que maximiza a pontuação imediata
- **Uso**: Estratégia simples e rápida
- **Complexidade**: O(1)

#### Heuristic
- Usa regras heurísticas para avaliar posições
- **Características**: 
  - Preferência por números grandes no canto
  - Valoriza monotonicidade
  - Prioriza células vazias
  - Busca merges potenciais
- **Complexidade**: O(n)

#### Weighted Heuristic
- Versão avançada do Heuristic com pesos ajustáveis
- **Parâmetros calibrados**: Pesos de diferentes heurísticas
- **Melhorias**: 
  - Avaliação de smoothness (suavidade)
  - Pesos otimizados para diferentes estratégias
- **Complexidade**: O(n)

### 2. **Algoritmos de Busca (Árvore de Decisão)**

#### Minimax
- Algoritmo de busca em árvore assumindo ambiente adversário
- **Parâmetros calibrados**: Profundidade de busca (1-5)
- **Complexidade**: O(b^d) onde b = branching factor, d = profundidade

#### Alpha-Beta
- Otimização do Minimax com poda alfa-beta
- **Parâmetros calibrados**: Profundidade de busca (1-5)
- **Vantagem**: Mais rápido que Minimax puro
- **Complexidade**: O(b^d) com poda

#### Expectimax
- Considera probabilidades ao invés de adversário
- **Parâmetros calibrados**: Profundidade de busca (1-5)
- **Complexidade**: O(b^d)

#### Monte Carlo
- Usa simulações aleatórias para avaliar movimentos
- **Parâmetros calibrados**: Número de simulações (10-200)
- **Complexidade**: O(s * m) onde s = simulações, m = movimentos

#### A* Search
- Algoritmo de busca informada usando heurística
- **Parâmetros calibrados**: Profundidade máxima
- **Complexidade**: O(b^d)

#### Beam Search
- Mantém apenas as k melhores opções em cada nível
- **Parâmetros calibrados**: Profundidade e largura do feixe (beam width)
- **Complexidade**: O(b * k * d)

#### Iterative Deepening
- Aumenta progressivamente a profundidade de busca
- **Parâmetros calibrados**: Profundidade máxima
- **Complexidade**: O(b^d)

#### MCTS (Monte Carlo Tree Search)
- Algoritmo usado no AlphaGo
- **Parâmetros calibrados**: Número de simulações
- **Complexidade**: O(s * m)

### 3. **Aprendizado por Reforço (Tabelas)**

#### Q-Learning
- Aprendizado por reforço com tabela Q
- **Parâmetros calibrados**: 
  - Taxa de aprendizado (learning rate)
  - Fator de desconto (discount factor)
  - Taxa de exploração ε (epsilon)
- **Características**: Aprende com experiência, salva Q-table
- **Complexidade**: O(1) por ação

#### SARSA
- Similar ao Q-Learning, mas usa ação real tomada
- **Parâmetros calibrados**: Learning rate, discount factor, epsilon
- **Complexidade**: O(1) por ação

#### TD-Learning
- Temporal Difference Learning
- **Parâmetros calibrados**: Learning rate, discount factor, lambda
- **Complexidade**: O(1) por ação

### 4. **Redes Neurais (TensorFlow.js)**

#### DQN (Deep Q-Network)
- Q-Learning com rede neural profunda
- **Parâmetros calibrados**: 
  - Learning rate
  - Discount factor
  - Epsilon
  - Batch size
  - Buffer size
  - Update target steps
- **Requisitos**: TensorFlow.js
- **Complexidade**: O(n) onde n = tamanho da rede

#### Policy Gradient
- Aprende política diretamente usando gradientes
- **Parâmetros calibrados**: Learning rate, batch size
- **Requisitos**: TensorFlow.js
- **Complexidade**: O(n)

#### Neural Network
- Rede neural simples para avaliação de posições
- **Parâmetros calibrados**: Learning rate
- **Requisitos**: TensorFlow.js
- **Complexidade**: O(n)

#### Actor-Critic
- Combina actor (política) e critic (valor)
- **Parâmetros calibrados**: Learning rate (actor e critic)
- **Requisitos**: TensorFlow.js
- **Complexidade**: O(n)

### 5. **Algoritmos Evolutivos**

#### Genetic Algorithm
- Evolução de estratégias através de seleção, crossover e mutação
- **Parâmetros calibrados**: 
  - Tamanho da população
  - Taxa de mutação
- **Características**: Salva população e geração
- **Complexidade**: O(p * g) onde p = população, g = gerações

## 🚀 Como Usar

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet (para carregar bibliotecas externas: Chart.js, TensorFlow.js, Font Awesome)

### Execução
1. Clone o repositório:
```bash
git clone https://github.com/Martelletti27/2048_treinamento_de_ML.git
cd 2048_treinamento_de_ML
```

2. Abra o arquivo `index.html` no navegador ou use um servidor local:
```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (http-server)
npx http-server

# Com PHP
php -S localhost:8000
```

3. Acesse `http://localhost:8000` no navegador

### Interface - Página de Treinamento

#### Painel Esquerdo - Controle de Treino
- **Modelo**: Selecione o algoritmo de IA (21 opções)
- **Parâmetros**: Ajuste sliders específicos de cada modelo
  - Profundidade (para algoritmos de busca)
  - Simulações (para Monte Carlo, MCTS)
  - Learning Rate, Discount Factor, Epsilon (para aprendizado por reforço)
  - Taxa de mutação, tamanho da população (para algoritmos genéticos)
  - E outros parâmetros específicos
- **▶ Iniciar**: Inicia o treinamento
- **↻ Reset**: Reseta todas as métricas e reinicia os jogos
- **💾 Salvar**: Salva o modelo atual com nome personalizado
- **📊 Modelos Treinados**: Abre modal com modelos salvos

#### Painel Central - Treinamento
- **Indicadores**: Cards com métricas em tempo real (2 blocos de 3x2)
- **Grade de Jogos**: Visualização de 100 jogos simultâneos (10x10)

#### Painel Direito - Análise
- **Melhor Jogada**: Melhor jogo de todos os tempos
- **Heatmap de Posições**: Distribuição espacial das maiores peças (%)
- **Histograma de Frequências**: Distribuição de pontuações
- **Melhor Indivíduo por Segundo**: Evolução temporal do melhor score
- **Taxa de Sucesso por Segundo**: Evolução da taxa de sucesso

### Interface - Arena de Combate

#### Painel Esquerdo - Controles
- **Selecionar Combatentes**: Checkboxes para até 6 modelos
- **Modelos Treinados**: Botão para abrir modal e selecionar modelos salvos
- **Controles de Arena**: Fight, Pause, Reset
- **Velocidade**: Slider para controlar velocidade de execução
- **No Limits**: Checkbox para remover limites de velocidade

#### Painel Central - Arena
- **Timer**: Contador regressivo de 5 minutos
- **Gráfico de Pontuação**: Evolução da pontuação de classificação geral
- **6 Jogos Simultâneos**: Cards com grid 4x4, pontuação, maior peça, barra de stress, último movimento

#### Painel Direito - Análise
- **Pódio**: Top 3 modelos (preenchido ao final ou quando atingem 2048)
- **Classificação Geral**: Gráfico de barras com abas (Score, Maior Peça, Jogos)
- **Hype Feed**: Comentários analíticos sobre a competição

## 📁 Estrutura do Projeto

```
2048_treinamento_de_ML/
│
├── index.html              # Interface principal de treinamento
├── script.js               # Lógica principal do sistema de treinamento
├── style.css               # Estilos da página de treinamento
│
├── combate.html            # Interface da arena de combate
├── combate.js              # Lógica principal da arena de combate
├── combate.css             # Estilos da arena de combate
│
├── js/
│   ├── Game2048.js        # Classe do jogo 2048 (lógica do jogo)
│   └── agents/             # Modelos de IA (21 arquivos)
│       ├── RandomAgent.js
│       ├── GreedyAgent.js
│       ├── HeuristicAgent.js
│       ├── WeightedHeuristicAgent.js
│       ├── MinimaxAgent.js
│       ├── AlphaBetaAgent.js
│       ├── ExpectimaxAgent.js
│       ├── MonteCarloAgent.js
│       ├── QLearningAgent.js
│       ├── SARSAAgent.js
│       ├── TDLearningAgent.js
│       ├── AStarAgent.js
│       ├── BeamSearchAgent.js
│       ├── IterativeDeepeningAgent.js
│       ├── MCTSAgent.js
│       ├── GeneticAlgorithmAgent.js
│       ├── PolicyGradientAgent.js
│       ├── NeuralNetworkAgent.js
│       ├── DQNAgent.js
│       └── ActorCriticAgent.js
│
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura da interface
- **CSS3**: Estilização, glassmorphism, animações, layout responsivo
- **JavaScript (ES6+)**: Lógica do sistema e algoritmos
- **Chart.js**: Gráficos e visualizações (histogramas, linhas, barras)
- **TensorFlow.js**: Redes neurais para modelos de deep learning
- **Canvas API**: Renderização dos jogos
- **LocalStorage API**: Persistência de modelos treinados
- **Font Awesome**: Ícones

## 📊 Métricas e Análises

### Métricas de Treinamento (Tempo Real)
- **Jogos Finalizados**: Total de jogos que terminaram
- **Tempo Decorrido**: Tempo total de execução
- **Velocidade (MPS)**: Movimentos executados por segundo
- **Peça Recorde**: Maior peça (2, 4, 8, ..., 2048, 4096, ...)
- **Score Médio**: Média aritmética das pontuações atuais
- **Taxa de Sucesso**: Percentual de jogos que alcançaram 2048
- **Eficiência**: Pontos por movimento

### Métricas de Jogos Finalizados
- **Maior Peça**: Maior peça alcançada em jogos finalizados
- **Tempo até 2048**: Tempo médio para alcançar 2048 pela primeira vez
- **Movimentos Médios**: Média de movimentos por jogo
- **Taxa de Melhoria**: Tendência de melhoria ao longo do tempo

### Análises Avançadas
- **Melhor Jogada**: 
  - Exibe o melhor jogo (finalizado ou não) de todos os tempos
  - Mostra grid completo e pontuação máxima
  - Inclui explicação breve

- **Heatmap de Posições**:
  - Frequência de onde a maior peça aparece em cada posição (em %)
  - Visualização usando cores do jogo 2048
  - Considera jogos ativos quando não há finalizados
  - Inclui explicação breve

- **Histograma de Frequências**:
  - Gráfico de barras com faixas adaptativas baseadas nos resultados
  - Eixo X sempre inicia em 0 e vai até o máximo
  - Atualização em tempo real
  - Considera jogos ativos quando não há finalizados

- **Melhor Indivíduo por Segundo**:
  - Gráfico de linha mostrando evolução temporal
  - Considera apenas jogos ativos (não finalizados)
  - Sempre exibe toda a métrica desde o primeiro segundo
  - Permite acompanhar a evolução do modelo em tempo real

- **Taxa de Sucesso por Segundo**:
  - Gráfico de linha mostrando evolução da taxa de sucesso
  - Considera apenas jogos ativos
  - Atualização em tempo real

## 💾 Sistema de Persistência

O sistema permite salvar modelos treinados com nomes personalizados. Cada modelo salvo inclui:

- **Metadados**: ID único, nome, tipo de agente, data de salvamento
- **Dados Aprendidos**:
  - Q-tables (Q-Learning, SARSA, TD-Learning)
  - Pesos de redes neurais (DQN, Policy Gradient, Neural Network, Actor-Critic)
  - Pesos de heurísticas (Weighted Heuristic)
  - População e geração (Genetic Algorithm)
- **Parâmetros de Calibração**: Todos os parâmetros ajustados pelo usuário

Os modelos são salvos no `localStorage` do navegador e podem ser:
- **Carregados** na página de treinamento para continuar o treinamento
- **Selecionados** na arena de combate para competir

## ⚔️ Arena de Combate

### Regras
- **Duração**: 5 minutos (timer regressivo)
- **Participantes**: Até 6 modelos (base ou treinados)
- **Vitória**: Primeiros 3 modelos a atingir 2048 OU melhor média ao final do tempo
- **Auto-restart**: Modelos que perdem antes de 2048 reiniciam automaticamente
- **Ranking**: Baseado em melhor pontuação histórica (não reseta)

### Sistema de Ranking
- **Pódio**: Top 3 modelos (preenchido ao final ou quando atingem 2048)
- **Classificação Geral**: Gráfico de barras com todos os participantes
- **Abas**: Alterna entre Score, Maior Peça e Número de Jogos
- **Gráfico de Linha**: Evolução da pontuação de classificação geral

### Hype Feed
- Comentários analíticos sobre a competição
- Análise do contexto geral da corrida
- Considera a natureza de cada modelo (heurístico vs neural)
- Frases curtas e objetivas

## 🎨 Características Visuais

- **Tema Escuro**: Fundo escuro com gradientes
- **Glassmorphism**: Cards com efeito de vidro
- **Neon Discreto**: Bordas e efeitos neon sutis
- **Layout Responsivo**: Três painéis (controles, treinamento/arena, análise)
- **Visualização Clara**: Cards, gráficos e grids bem organizados
- **Feedback Visual**: Diferenciação entre jogos ativos e finalizados
- **Animações**: Transições suaves e efeitos visuais

## 🔧 Configurações

### Parâmetros Ajustáveis por Modelo

Cada modelo tem parâmetros específicos que podem ser calibrados:

- **Algoritmos de Busca**: Profundidade máxima (1-5)
- **Monte Carlo/MCTS**: Número de simulações (10-200)
- **Aprendizado por Reforço**: 
  - Learning Rate (0.01-1.0)
  - Discount Factor (0.01-1.0)
  - Epsilon/Exploração (0.0-1.0)
  - Lambda (TD-Learning) (0.0-1.0)
- **Genetic Algorithm**: 
  - Taxa de mutação (0.01-1.0)
  - Tamanho da população
- **Beam Search**: Largura do feixe (beam width)
- **Redes Neurais**: Learning rate, batch size, buffer size, etc.

## 📝 Notas Técnicas

- O sistema executa 100 jogos simultâneos para estatísticas robustas
- Métricas são atualizadas em tempo real durante o treinamento
- O "Melhor Jogada" persiste mesmo após resetar jogos ativos
- Os gráficos temporais mostram evolução dos jogos ativos
- Modelos treinados são salvos no localStorage do navegador
- A arena de combate roda no main thread (não usa Web Workers)
- Todos os modelos compartilham a mesma instância de Game2048 para consistência

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Adicionar novos modelos de IA
- Melhorar heurísticas existentes
- Adicionar novas métricas
- Otimizar performance
- Melhorar a interface
- Adicionar testes automatizados

## 📄 Licença

Este projeto é de código aberto e está disponível para uso educacional e de pesquisa.

## 👤 Autor

**Martelletti27**

- GitHub: [@Martelletti27](https://github.com/Martelletti27)

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!

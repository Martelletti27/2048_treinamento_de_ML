# 🎮 Sistema de Treinamento de IA para 2048

Sistema completo de treinamento e análise de múltiplos modelos de Inteligência Artificial para o jogo 2048, com visualização em tempo real, métricas avançadas e comparação de desempenho.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Modelos de IA Implementados](#modelos-de-ia-implementados)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Métricas e Análises](#métricas-e-análises)

## 🎯 Sobre o Projeto

Este projeto implementa um laboratório de treinamento de IA para o jogo 2048, permitindo testar e comparar diferentes algoritmos de inteligência artificial em um ambiente controlado. O sistema executa 100 jogos simultaneamente, coletando métricas detalhadas e fornecendo visualizações em tempo real do desempenho de cada modelo.

## ✨ Funcionalidades

### 🎮 Treinamento
- **100 jogos simultâneos**: Execução paralela de múltiplas instâncias do jogo
- **Visualização em tempo real**: Canvas com grade 10x10 mostrando todos os jogos
- **Controles intuitivos**: Iniciar, pausar e resetar o treinamento
- **Múltiplos modelos**: 9 algoritmos diferentes de IA disponíveis

### 📊 Métricas em Tempo Real
- **Jogos Finalizados**: Contador de jogos concluídos
- **Tempo Decorrido**: Cronômetro do tempo de treinamento
- **Velocidade (MPS)**: Movimentos por segundo executados
- **Peça Recorde**: Maior peça alcançada
- **Score Médio**: Média de pontuação dos jogos ativos
- **Taxa de Sucesso**: Percentual de jogos que alcançaram 2048
- **Jogos com 2048**: Quantidade de jogos que chegaram ao objetivo

### 📈 Análises Avançadas
- **Melhor Indivíduo Ever**: Melhor jogo finalizado de todos os tempos
- **Heatmap de Posições**: Frequência de onde a maior peça aparece
- **Distribuição de Pontuações**: Gráfico de barras com faixas de score
- **Melhor Indivíduo por Segundo**: Gráfico de linha mostrando evolução temporal com média móvel

## 🤖 Modelos de IA Implementados

### 1. **Random**
- Seleciona movimentos aleatórios
- **Uso**: Baseline para comparação
- **Complexidade**: O(1)

### 2. **Greedy**
- Escolhe o movimento que maximiza a pontuação imediata
- **Uso**: Estratégia simples e rápida
- **Complexidade**: O(1)

### 3. **Heuristic**
- Usa regras heurísticas para avaliar posições
- **Características**: 
  - Preferência por números grandes no canto
  - Valoriza monotonicidade
  - Prioriza células vazias
  - Busca merges potenciais
- **Complexidade**: O(n)

### 4. **Weighted Heuristic**
- Versão avançada do Heuristic com pesos ajustáveis
- **Melhorias**: 
  - Avaliação de smoothness (suavidade)
  - Pesos otimizados para diferentes estratégias
- **Complexidade**: O(n)

### 5. **Minimax**
- Algoritmo de busca em árvore assumindo ambiente adversário
- **Configurável**: Profundidade de busca (1-5)
- **Complexidade**: O(b^d) onde b = branching factor, d = profundidade

### 6. **Alpha-Beta**
- Otimização do Minimax com poda alfa-beta
- **Vantagem**: Mais rápido que Minimax puro
- **Configurável**: Profundidade de busca (1-5)
- **Complexidade**: O(b^d) com poda

### 7. **Expectimax**
- Considera probabilidades ao invés de adversário
- **Configurável**: Profundidade de busca (1-5)
- **Complexidade**: O(b^d)

### 8. **Monte Carlo**
- Usa simulações aleatórias para avaliar movimentos
- **Configurável**: Número de simulações (10-200)
- **Complexidade**: O(s * m) onde s = simulações, m = movimentos

### 9. **Q-Learning**
- Aprendizado por reforço com tabela Q
- **Configurável**: Taxa de exploração ε (0-1.0)
- **Características**: Aprende com experiência
- **Complexidade**: O(1) por ação

## 🚀 Como Usar

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet (para carregar bibliotecas externas)

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

### Interface

#### Painel Esquerdo - Controle de Treino
- **Modelo**: Selecione o algoritmo de IA
- **Profundidade/Simulações/ε**: Ajuste parâmetros específicos do modelo
- **▶ Iniciar**: Inicia o treinamento
- **↻ Reset**: Reseta todas as métricas e reinicia os jogos

#### Painel Central - Treinamento
- **Indicadores**: Cards com métricas em tempo real
- **Grade de Jogos**: Visualização de 100 jogos simultâneos (10x10)

#### Painel Direito - Análise
- **Melhor Indivíduo Ever**: Melhor jogo finalizado
- **Heatmap de Posições**: Distribuição espacial das maiores peças
- **Distribuição de Pontuações**: Gráfico de barras por faixas
- **Melhor Indivíduo por Segundo**: Evolução temporal com média móvel

## 📁 Estrutura do Projeto

```
2048_treinamento_de_ML/
│
├── index.html              # Interface principal
├── script.js               # Lógica principal do sistema
├── style.css               # Estilos e layout
├── README.md               # Este arquivo
│
├── js/
│   ├── Game2048.js        # Classe do jogo 2048
│   └── agents/            # Modelos de IA
│       ├── RandomAgent.js
│       ├── GreedyAgent.js
│       ├── HeuristicAgent.js
│       ├── WeightedHeuristicAgent.js
│       ├── MinimaxAgent.js
│       ├── AlphaBetaAgent.js
│       ├── ExpectimaxAgent.js
│       ├── MonteCarloAgent.js
│       └── QLearningAgent.js
│
└── game/                   # Jogo original (referência)
    ├── index.html
    ├── script.js
    └── style.css
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura da interface
- **CSS3**: Estilização e layout responsivo
- **JavaScript (ES6+)**: Lógica do sistema e algoritmos
- **Chart.js**: Gráficos e visualizações
- **Canvas API**: Renderização dos jogos

## 📊 Métricas e Análises

### Métricas de Treinamento
- **Jogos Finalizados**: Total de jogos que terminaram
- **Tempo Decorrido**: Tempo total de execução
- **Velocidade (MPS)**: Movimentos executados por segundo
- **Peça Recorde**: Maior peça (2, 4, 8, ..., 2048, 4096, ...)
- **Score Médio**: Média aritmética das pontuações atuais
- **Taxa de Sucesso**: Percentual de jogos que alcançaram 2048

### Análises Avançadas
- **Melhor Indivíduo Ever**: 
  - Exibe o melhor jogo finalizado de todos os tempos
  - Considera apenas jogos que terminaram
  - Mostra grid completo e pontuação máxima

- **Heatmap de Posições**:
  - Frequência de onde a maior peça aparece em cada posição
  - Visualização usando cores do jogo 2048
  - Considera jogos ativos quando não há finalizados

- **Distribuição de Pontuações**:
  - Gráfico de barras com faixas: 0-500, 500-1K, 1K-2K, 2K-5K, 5K+
  - Atualização em tempo real
  - Considera jogos ativos quando não há finalizados

- **Melhor Indivíduo por Segundo**:
  - Gráfico de linha mostrando evolução temporal
  - Considera apenas jogos ativos (não finalizados)
  - Inclui média móvel com janela de 15% do tempo máximo
  - Permite acompanhar a evolução do modelo em tempo real

## 🎨 Características Visuais

- **Tema 2048**: Cores e estilo baseados no jogo original
- **Layout Responsivo**: Três painéis (controles, treinamento, análise)
- **Visualização Clara**: Cards, gráficos e grids bem organizados
- **Feedback Visual**: Diferenciação entre jogos ativos e finalizados

## 🔧 Configurações

### Parâmetros Ajustáveis

- **Profundidade (Minimax, Alpha-Beta, Expectimax)**: 1 a 5 níveis
- **Simulações (Monte Carlo)**: 10 a 200 simulações por movimento
- **Taxa de Exploração (Q-Learning)**: 0.0 a 1.0 (ε)

## 📝 Notas

- O sistema executa 100 jogos simultaneamente para estatísticas robustas
- Métricas são atualizadas em tempo real durante o treinamento
- O "Melhor Indivíduo Ever" persiste mesmo após resetar jogos ativos
- O gráfico "Melhor Indivíduo por Segundo" mostra evolução dos jogos ativos

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Adicionar novos modelos de IA
- Melhorar heurísticas existentes
- Adicionar novas métricas
- Otimizar performance
- Melhorar a interface

## 📄 Licença

Este projeto é de código aberto e está disponível para uso educacional e de pesquisa.

## 👤 Autor

**Martelletti27**

- GitHub: [@Martelletti27](https://github.com/Martelletti27)

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!


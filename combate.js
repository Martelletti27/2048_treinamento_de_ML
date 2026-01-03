// ============================================
// CLASH OF INTELLIGENCE - LÓGICA PRINCIPAL
// ============================================

// ============================================
// ESTADO GLOBAL
// ============================================
let combatants = []; // Array de modelos competindo na arena
let isCombatRunning = false;
let isCombatPaused = false;
let combatStartTime = 0;
let combatPausedTime = 0;
let totalPausedTime = 0;
const ROUND_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
let rankingChart = null;
let currentRankingTab = 'score'; // 'score', 'tile', 'games'
let scoreTimelineChart = null;
let podium = { first: null, second: null, third: null };
let scoreTimelineHistory = []; // Histórico de melhor pontuação por segundo
let lastScoreTimelineSecond = 0;
let speedMultiplier = 1;
let frameInterval = 50; // Intervalo em ms entre frames
let noLimits = false; // Modo sem limites de velocidade
let hypeFeed = [];
let modelColors = new Map();
let nextColorHue = 0;

// Mapeamento de tipos de agente
const agentTypeNames = {
    'random': 'Random',
    'greedy': 'Greedy',
    'heuristic': 'Heuristic',
    'weightedheuristic': 'Weighted Heuristic',
    'minimax': 'Minimax',
    'alphabeta': 'Alpha-Beta',
    'expectimax': 'Expectimax',
    'montecarlo': 'Monte Carlo',
    'qlearning': 'Q-Learning',
    'sarsa': 'SARSA',
    'tdlearning': 'TD-Learning',
    'astar': 'A* Search',
    'beamsearch': 'Beam Search',
    'iterativedeepening': 'Iterative Deepening',
    'mcts': 'MCTS',
    'geneticalgorithm': 'Genetic Algorithm',
    'policygradient': 'Policy Gradient',
    'neuralnetwork': 'Neural Network',
    'dqn': 'DQN',
    'actorcritic': 'Actor-Critic'
};

// Mapeamento de ícones para cada tipo de agente
const agentIcons = {
    'random': 'fa-dice',
    'greedy': 'fa-arrow-up',
    'heuristic': 'fa-lightbulb',
    'weightedheuristic': 'fa-balance-scale',
    'minimax': 'fa-chess',
    'alphabeta': 'fa-cut',
    'expectimax': 'fa-dice-d20',
    'montecarlo': 'fa-dice-five',
    'qlearning': 'fa-brain',
    'sarsa': 'fa-project-diagram',
    'tdlearning': 'fa-wave-square',
    'astar': 'fa-star',
    'beamsearch': 'fa-search',
    'iterativedeepening': 'fa-layer-group',
    'mcts': 'fa-sitemap',
    'geneticalgorithm': 'fa-dna',
    'policygradient': 'fa-chart-line',
    'neuralnetwork': 'fa-network-wired',
    'dqn': 'fa-robot',
    'actorcritic': 'fa-theater-masks'
};

const neuralAgents = ['qlearning', 'sarsa', 'tdlearning', 'geneticalgorithm', 'policygradient', 'neuralnetwork', 'dqn', 'actorcritic'];

// Inicialização
function init() {
    setupEventListeners();
    // Registra plugin de datalabels se disponível
    if (typeof Chart !== 'undefined') {
        if (window.ChartDataLabels) {
            Chart.register(window.ChartDataLabels);
        } else if (typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }
    }
    initRankingChart();
    initScoreTimelineChart();
    loadModelColors();
    setupTrainedModelsModal();
    
    // Inicializa timer com formato correto
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
        timerEl.textContent = '05:00';
    }
    
    // Carrega modelos treinados selecionados após um pequeno delay para garantir que os event listeners estejam configurados
    setTimeout(() => {
        loadTrainedModelsIntoSelection();
    }, 100);
    
    // Garante que o layout está correto desde o início
    ensureLayoutConsistency();
}

// Carrega modelos treinados selecionados na seção separada
function loadTrainedModelsIntoSelection() {
    const trainedModelsContainer = document.getElementById('trained-models-selection');
    if (!trainedModelsContainer) return;
    
    // Limpa modelos existentes
    trainedModelsContainer.innerHTML = '';
    
    // Busca todos os checkboxes de modelos treinados (incluindo os ocultos) que estão marcados
    const selectedTrainedCheckboxes = document.querySelectorAll('input[type="checkbox"][value^="trained_"]:checked');
    
    if (selectedTrainedCheckboxes.length === 0) {
        trainedModelsContainer.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 10px; opacity: 0.6;">Nenhum modelo treinado selecionado</div>';
        return;
    }
    
    // Para cada checkbox selecionado, busca os dados do modelo e exibe na seção
    selectedTrainedCheckboxes.forEach(checkbox => {
        const value = checkbox.value;
        if (!value.startsWith('trained_')) return;
        
        const modelId = value.replace('trained_', '');
        const modelData = localStorage.getItem(`trained_model_${modelId}`);
        
        if (!modelData) return;
        
        try {
            const data = JSON.parse(modelData);
            if (!data.metadata) return;
            
            const model = {
                id: data.metadata.id,
                name: data.metadata.name,
                agentType: data.metadata.agentType,
                agentName: data.metadata.agentName
            };
            
            const icon = agentIcons[model.agentType] || 'fa-brain';
            const isNeural = neuralAgents.includes(model.agentType);
            
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = `model-checkbox trained-model`;
            checkboxDiv.setAttribute('data-model-id', model.id);
            checkboxDiv.setAttribute('data-model-type', model.agentType);
            checkboxDiv.style.cssText = isNeural ? 'background: rgba(139, 92, 246, 0.08);' : 'background: rgba(245, 149, 99, 0.08);';
            
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="trained-selection-${model.id}" value="trained_${model.id}" checked>
                <label for="trained-selection-${model.id}" style="width: 100%;">
                    <i class="fas ${icon}"></i> 
                    <span style="font-weight: 600;">${model.name}</span>
                </label>
            `;
            
            trainedModelsContainer.appendChild(checkboxDiv);
            
            // Adiciona event listener para o novo checkbox
            const newCheckbox = checkboxDiv.querySelector('input[type="checkbox"]');
            newCheckbox.addEventListener('change', function() {
                // Sincroniza com o checkbox oculto de rastreamento
                const trackingCheckbox = document.querySelector(`input[value="trained_${model.id}"]`);
                if (trackingCheckbox) {
                    trackingCheckbox.checked = this.checked;
                }
                
                // Se desmarcado, remove da seção
                if (!this.checked) {
                    loadTrainedModelsIntoSelection();
                }
                
                // Conta todos os checkboxes marcados (incluindo modelos base e treinados)
                const baseChecked = document.querySelectorAll('.model-selection-combat input[type="checkbox"]:checked:not([value^="trained_"])').length;
                const trainedChecked = document.querySelectorAll('input[type="checkbox"][value^="trained_"]:checked').length;
                const totalChecked = baseChecked + trainedChecked;
                
                if (totalChecked > 6) {
                    this.checked = false;
                    if (trackingCheckbox) trackingCheckbox.checked = false;
                    alert('Máximo de 6 modelos por corrida!');
                }
            });
            
            // Torna o container clicável
            checkboxDiv.addEventListener('click', function(e) {
                if (e.target.type === 'checkbox') return;
                const cb = this.querySelector('input[type="checkbox"]');
                if (cb) {
                    const checked = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked').length;
                    if (!cb.checked && checked >= 6) {
                        alert('Máximo de 6 modelos por corrida!');
                        return;
                    }
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
        } catch (e) {
            console.warn('Erro ao carregar modelo treinado:', e);
        }
    });
}

// Configura modal de modelos treinados
function setupTrainedModelsModal() {
    const btnOpenModels = document.getElementById('btn-open-models-combat');
    const modal = document.getElementById('trained-models-modal-combat');
    const btnCloseModels = document.getElementById('btn-close-models-combat');
    
    if (btnOpenModels) {
        btnOpenModels.addEventListener('click', function() {
            loadTrainedModelsForCombat();
            if (modal) modal.style.display = 'flex';
        });
    }
    
    if (btnCloseModels) {
        btnCloseModels.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }
    
    // Fecha modal ao clicar fora
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Fecha modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

// Carrega modelos treinados para a página de combate (no modal)
function loadTrainedModelsForCombat() {
    const listContainer = document.getElementById('trained-models-combat-list');
    if (!listContainer) return;
    
    // Busca todos os modelos treinados no localStorage
    const trainedModels = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trained_model_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.metadata) {
                    trainedModels.push({
                        id: data.metadata.id,
                        name: data.metadata.name,
                        agentType: data.metadata.agentType,
                        agentName: data.metadata.agentName,
                        savedAt: new Date(data.metadata.savedAt)
                    });
                }
            } catch (e) {
                console.warn('Erro ao ler modelo treinado:', e);
            }
        }
    }
    
    // Ordena por data (mais recente primeiro)
    trainedModels.sort((a, b) => b.savedAt - a.savedAt);
    
    // Renderiza lista
    if (trainedModels.length === 0) {
        listContainer.innerHTML = `
            <div style="color: #94a3b8; font-size: 12px; text-align: center; padding: 40px;">
                Nenhum modelo treinado
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = trainedModels.map(model => {
        const icon = agentIcons[model.agentType] || 'fa-brain';
        const dateStr = model.savedAt.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const isNeural = neuralAgents.includes(model.agentType);
        return `
            <div class="trained-model-item-modal" data-model-id="${model.id}" data-model-type="${model.agentType}" style="
                padding: 12px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(245, 149, 99, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <i class="fas ${icon}" style="color: ${isNeural ? '#8b5cf6' : '#f59563'}; font-size: 14px;"></i>
                        <span style="color: #f59563; font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${model.name}</span>
                    </div>
                    <div style="color: #94a3b8; font-size: 11px;">
                        ${model.agentName} • ${dateStr}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-left: 12px;">
                    <button class="select-trained-model-btn" data-model-id="${model.id}" style="
                        background: rgba(245, 149, 99, 0.2);
                        border: 1px solid rgba(245, 149, 99, 0.4);
                        color: #f59563;
                        border-radius: 6px;
                        padding: 6px 12px;
                        font-size: 11px;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-weight: 600;
                    " title="Selecionar modelo">
                        <i class="fas fa-check"></i> Selecionar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Adiciona event listeners para modelos treinados
    listContainer.querySelectorAll('.trained-model-item-modal').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
            this.style.borderColor = 'rgba(245, 149, 99, 0.4)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.05)';
            this.style.borderColor = 'rgba(245, 149, 99, 0.2)';
        });
    });
    
    // Adiciona event listeners para botões de selecionar
    listContainer.querySelectorAll('.select-trained-model-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const modelId = this.dataset.modelId;
            const item = this.closest('.trained-model-item-modal');
            const agentType = item ? item.dataset.modelType : null;
            
            if (!agentType) {
                alert('Erro ao identificar tipo do modelo!');
                return;
            }
            
            // Verifica limite de 6 modelos
            const checked = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked').length;
            if (checked >= 6) {
                alert('Máximo de 6 modelos por corrida! Desmarque algum modelo primeiro.');
                return;
            }
            
            // Cria um checkbox oculto para rastrear a seleção (não adiciona na lista principal)
            let checkbox = document.querySelector(`input[value="trained_${modelId}"]`);
            if (!checkbox) {
                // Cria checkbox oculto para rastreamento (não adiciona na lista principal)
                const hiddenContainer = document.createElement('div');
                hiddenContainer.style.display = 'none';
                hiddenContainer.innerHTML = `<input type="checkbox" id="trained-${modelId}" value="trained_${modelId}">`;
                document.body.appendChild(hiddenContainer);
                checkbox = hiddenContainer.querySelector('input[type="checkbox"]');
                
                // Adiciona event listener para o checkbox oculto
                checkbox.addEventListener('change', function() {
                    const baseChecked = document.querySelectorAll('.model-selection-combat input[type="checkbox"]:checked:not([value^="trained_"])').length;
                    const trainedChecked = document.querySelectorAll('input[type="checkbox"][value^="trained_"]:checked').length;
                    const totalChecked = baseChecked + trainedChecked;
                    if (totalChecked > 6) {
                        this.checked = false;
                        alert('Máximo de 6 modelos por corrida!');
                    } else {
                        // Atualiza a seção de modelos treinados
                        loadTrainedModelsIntoSelection();
                    }
                });
            }
            
            // Marca o checkbox
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
                
                // Atualiza a seção de modelos treinados
                loadTrainedModelsIntoSelection();
                
                // Fecha o modal
                const modal = document.getElementById('trained-models-modal-combat');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
        
        btn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(245, 149, 99, 0.3)';
            this.style.borderColor = 'rgba(245, 149, 99, 0.6)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(245, 149, 99, 0.2)';
            this.style.borderColor = 'rgba(245, 149, 99, 0.4)';
        });
    });
}

// Configura event listeners
function setupEventListeners() {
    document.getElementById('btn-play').addEventListener('click', startCombat);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-reset').addEventListener('click', resetCombat);
    
    // Tabs do ranking
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            switchRankingTab(tabType);
        });
    });
    
    // Selecionar 6 Random / Deselecionar Todos
    document.getElementById('btn-random-6').addEventListener('click', selectRandom6);
    document.getElementById('btn-deselect-all').addEventListener('click', deselectAllModels);
    
    // Tornar labels e toda a área do model-checkbox clicáveis
    document.querySelectorAll('.model-checkbox').forEach(checkboxContainer => {
        checkboxContainer.addEventListener('click', function(e) {
            // Se clicou no checkbox, não faz nada (deixa o comportamento padrão)
            if (e.target.type === 'checkbox') {
                // Valida limite de 6 modelos
                const checked = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked').length;
                if (checked > 6) {
                    e.target.checked = false;
                    alert('Máximo de 6 modelos por corrida!');
                    return;
                }
                return;
            }
            
            // Se clicou em qualquer outro lugar do container, alterna o checkbox
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox) {
                // Valida limite antes de alternar
                const checked = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked').length;
                if (!checkbox.checked && checked >= 6) {
                    alert('Máximo de 6 modelos por corrida!');
                    return;
                }
                checkbox.checked = !checkbox.checked;
                // Dispara evento change para garantir que outros listeners sejam notificados
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
    
    // Valida limite ao mudar checkboxes diretamente
    document.querySelectorAll('.model-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked').length;
            if (checked > 6) {
                this.checked = false;
                alert('Você pode selecionar no máximo 6 modelos por corrida!');
            } else {
                // Se for um modelo treinado, atualiza a seção
                if (this.value && this.value.startsWith('trained_')) {
                    loadTrainedModelsIntoSelection();
                }
            }
        });
    });
    
    const speedSlider = document.getElementById('speed-slider');
    const noLimitsCheckbox = document.getElementById('no-limits-checkbox');
    
    speedSlider.addEventListener('input', function() {
        if (!noLimits) {
            speedMultiplier = this.value / 50;
            frameInterval = Math.max(10, Math.floor(50 / speedMultiplier)); // Mínimo de 10ms
            document.getElementById('speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
        }
    });
    
    noLimitsCheckbox.addEventListener('change', function() {
        noLimits = this.checked;
        if (noLimits) {
            frameInterval = 0; // Sem limite de velocidade
            document.getElementById('speed-value').textContent = '∞';
            speedSlider.disabled = true;
        } else {
            speedMultiplier = speedSlider.value / 50;
            frameInterval = Math.max(10, Math.floor(50 / speedMultiplier));
            document.getElementById('speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
            speedSlider.disabled = false;
        }
    });
}

// Seleciona 6 modelos aleatórios
function selectRandom6() {
    // Primeiro desmarca todos
    document.querySelectorAll('.model-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Pega todos os checkboxes
    const checkboxes = Array.from(document.querySelectorAll('.model-checkbox input[type="checkbox"]'));
    
    // Embaralha aleatoriamente
    const shuffled = checkboxes.sort(() => Math.random() - 0.5);
    
    // Seleciona os primeiros 6
    shuffled.slice(0, 6).forEach(cb => {
        cb.checked = true;
    });
    
    // Atualiza a seção de modelos treinados
    loadTrainedModelsIntoSelection();
}

// Deseleciona todos os modelos
function deselectAllModels() {
    document.querySelectorAll('.model-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    // Atualiza a seção de modelos treinados
    loadTrainedModelsIntoSelection();
}

// Inicia combate com countdown
function startCombat() {
    const selectedModels = getSelectedModels();
    if (selectedModels.length < 1) {
        alert('Selecione pelo menos 1 modelo para o combate!');
        return;
    }
    if (selectedModels.length > 6) {
        alert('Selecione entre 1 e 6 modelos para o combate!');
        return;
    }
    
    // Countdown
    showCountdown(() => {
        startCombatAfterCountdown(selectedModels);
    });
}

// Mostra countdown
function showCountdown(callback) {
    const overlay = document.getElementById('countdown-overlay');
    const fightOverlay = document.getElementById('fight-overlay');
    const number = document.getElementById('countdown-number');
    const fightText = document.getElementById('fight-text');
    const indicator = document.getElementById('fight-indicator');
    
    overlay.classList.add('active');
    indicator.textContent = 'READY';
    
    let count = 3;
    number.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            number.textContent = count;
        } else {
            clearInterval(countdownInterval);
            overlay.classList.remove('active');
            
            // Mostra "FIGHT!" em overlay separado
            fightOverlay.classList.add('active');
            indicator.textContent = 'FIGHT!';
            indicator.classList.add('fight');
            
            setTimeout(() => {
                fightOverlay.classList.remove('active');
                callback();
            }, 1200);
        }
    }, 1000);
}

// Inicia combate após countdown
function startCombatAfterCountdown(selectedModels) {
    combatants = [];
    podium = { first: null, second: null, third: null };
    combatStartTime = performance.now();
    totalPausedTime = 0;
    isCombatRunning = true;
    isCombatPaused = false;
    scoreTimelineHistory = [];
    lastScoreTimelineSecond = 0;
    
    // Cria combatentes
    selectedModels.forEach((modelInfo, index) => {
        let agent;
        let combatantName;
        let agentType;
        
        if (modelInfo.type === 'trained') {
            // Modelo treinado
            agent = createAgentFromTrainedModel(modelInfo.modelId);
            if (!agent) {
                console.error('Erro ao criar agente de modelo treinado:', modelInfo.modelId);
                return; // Pula este modelo
            }
            
            // Busca nome do modelo treinado
            try {
                const data = JSON.parse(localStorage.getItem(`trained_model_${modelInfo.modelId}`));
                combatantName = data.metadata ? data.metadata.name : agentTypeNames[modelInfo.agentType] || modelInfo.agentType;
                agentType = modelInfo.agentType;
            } catch (e) {
                combatantName = agentTypeNames[modelInfo.agentType] || modelInfo.agentType;
                agentType = modelInfo.agentType;
            }
        } else {
            // Modelo padrão
            agentType = modelInfo.agentType;
            agent = createAgent(agentType);
            combatantName = agentTypeNames[agentType] || agentType;
        }
        
        const color = getModelColor(agentType);
        const game = new Game2048(); // init() já é chamado no construtor
        const combatant = {
            id: index,
            name: combatantName,
            agentType: agentType,
            agent: agent,
            color: color,
            game: game,
            finished: false,
            position: null,
            maxTile: 0,
            score: 0,
            reached2048: false,
            victoryTime: null,
            bestScore: 0,
            bestMaxTile: 0,
            stressLevel: 0,
            lastMove: null,
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0
        };
        
        combatants.push(combatant);
    });
    
    // Atualiza UI
    document.getElementById('btn-play').disabled = true;
    document.getElementById('btn-pause').disabled = false;
    document.getElementById('fight-indicator').textContent = 'FIGHTING';
    
    // Limpa feed
    hypeFeed = [];
    const narratorMessage = `🎬 A ARENA ESTÁ PRONTA! ${combatants.length} modelos de IA se preparam para a batalha épica. Cada um com sua estratégia única, desde algoritmos clássicos até redes neurais profundas. O objetivo é claro: alcançar o bloco 2048 e dominar o tabuleiro. Que comece o Clash of Intelligence!`;
    updateHypeFeed(narratorMessage, 'highlight');
    
    // Mensagens descritivas iniciais
    setTimeout(() => {
        updateHypeFeed('🎮 Arena de Combate iniciada! Modelos competindo em tempo real.', 'normal');
    }, 500);
    setTimeout(() => {
        updateHypeFeed('📊 Ranking atualizado a cada movimento. Primeiro a 2048 vence!', 'normal');
    }, 1500);
    setTimeout(() => {
        updateHypeFeed('⚡ Use "No limits" para máxima velocidade de processamento.', 'normal');
    }, 2500);
    
    // Atualiza pódio inicial (baseado em score = 0, todos empatados)
    updateRankingAndPodium();
    
    // Renderiza cards iniciais
    renderBattleCards();
    
    // Inicia loop após um pequeno delay para garantir que tudo está inicializado
    setTimeout(() => {
        if (isCombatRunning) {
            combatLoop();
        }
    }, 100);
}

// Loop principal de combate
function combatLoop() {
    if (!isCombatRunning) {
        return;
    }
    
    if (isCombatPaused) {
        setTimeout(combatLoop, 100);
        return;
    }
    
    // Atualiza timer
    updateTimer();
    
    // Processa cada combatente
    let previousScores = new Map();
    combatants.forEach(c => previousScores.set(c.id, c.score));
    
    combatants.forEach(combatant => {
        const game = combatant.game;
        
        // Auto-restart se game over E não atingiu 2048
        if (game.isGameOver && !combatant.reached2048) {
            // Registra jogo finalizado
            combatant.gamesPlayed++;
            combatant.totalScore += game.score;
            // A média será recalculada em updateRankingAndPodium incluindo o jogo atual
            
            // Salva melhor resultado
            if (game.score > combatant.bestScore) {
                combatant.bestScore = game.score;
            }
            if (Math.max(...game.grid) > combatant.bestMaxTile) {
                combatant.bestMaxTile = Math.max(...game.grid);
            }
            
            // Reinicia imediatamente para tentar novamente
            combatant.game = new Game2048(); // init() já é chamado no construtor
            combatant.score = 0;
            combatant.maxTile = 0;
            combatant.stressLevel = 0;
            return;
        }
        
        // Se game over mas já atingiu 2048, mantém o score final
        if (game.isGameOver && combatant.reached2048) {
            return;
        }
        
        // Verifica se há movimentos válidos antes de tentar
        const hasValidMoves = game.hasValidMoves();
        if (!hasValidMoves) {
            game.isGameOver = true;
            game.checkForGameOver(); // Garante que está marcado como game over
            // Auto-restart se não atingiu 2048
            if (!combatant.reached2048) {
                if (game.score > combatant.bestScore) {
                    combatant.bestScore = game.score;
                }
                if (Math.max(...game.grid) > combatant.bestMaxTile) {
                    combatant.bestMaxTile = Math.max(...game.grid);
                }
                combatant.game = new Game2048();
                combatant.score = 0;
                combatant.maxTile = 0;
                combatant.stressLevel = 0;
            }
            return;
        }
        
        // Executa movimento
        try {
            // Usa o agente já criado no combatant
            if (!combatant.agent) {
                console.error(`Agente não encontrado para ${combatant.name}`);
                return;
            }
            
            const move = combatant.agent.selectMove(game);
            if (move === null || move === undefined) {
                console.error(`Movimento inválido para ${combatant.name}:`, move);
                return;
            }
            
            const moved = game.makeMove(move);
            
            if (moved) {
                game.generate();
                game.checkForGameOver(); // Verifica game over após cada movimento
            } else {
                // Se o movimento não foi válido, verifica se há outros movimentos válidos
                const stillHasMoves = game.hasValidMoves();
                if (!stillHasMoves) {
                    game.isGameOver = true;
                    game.checkForGameOver();
                    // Auto-restart se não atingiu 2048
                    if (!combatant.reached2048) {
                        if (game.score > combatant.bestScore) {
                            combatant.bestScore = game.score;
                        }
                        if (Math.max(...game.grid) > combatant.bestMaxTile) {
                            combatant.bestMaxTile = Math.max(...game.grid);
                        }
                        combatant.game = new Game2048();
                        combatant.score = 0;
                        combatant.maxTile = 0;
                        combatant.stressLevel = 0;
                    }
                }
                return;
            }
            
            // Atualiza métricas
            const oldScore = combatant.score;
            combatant.score = game.score;
            combatant.maxTile = Math.max(...game.grid);
            combatant.lastMove = move;
            
            // Atualiza melhor pontuação histórica se necessário
            if (game.score > combatant.bestScore) {
                combatant.bestScore = game.score;
            }
            if (Math.max(...game.grid) > combatant.bestMaxTile) {
                combatant.bestMaxTile = Math.max(...game.grid);
            }
            
            // Calcula stress (baseado em células vazias)
            const emptyCells = game.grid.filter(cell => cell === 0).length;
            combatant.stressLevel = Math.round((1 - emptyCells / 16) * 100);
            
            // Verifica se atingiu 2048
            if (combatant.maxTile >= 2048 && !combatant.reached2048) {
                combatant.reached2048 = true;
                combatant.victoryTime = performance.now() - combatStartTime - totalPausedTime;
                combatant.finished = true; // Marca como finalizado
                
                // Registra jogo finalizado com 2048
                combatant.gamesPlayed++;
                combatant.totalScore += game.score;
                // A média será recalculada em updateRankingAndPodium incluindo o jogo atual
                
                // Atualiza pódio imediatamente se atingiu 2048
                updateRankingAndPodium();
                
                // Não finaliza o combate aqui, continua até 5 minutos ou 3 no pódio
            }
            
            // Narração analítica para mudanças significativas
            const scoreGain = combatant.score - oldScore;
            if (scoreGain > 50 && Math.random() < 0.4) {
                const narratorMessage = generateAnalyticalComment(combatant, scoreGain, previousScores);
                if (narratorMessage) {
                    updateHypeFeed(narratorMessage, 'normal');
                }
            }
            
            // Análise contextual geral da corrida removida
        } catch (error) {
            console.error(`Erro no combatente ${combatant.name}:`, error);
            console.error('Stack trace:', error.stack);
        }
    });
    
    // Renderiza e atualiza ranking/pódio baseado em score ao vivo
    renderBattleCards();
    updateRankingAndPodium();
    updateScoreTimeline();
    
    // Continua loop
    setTimeout(() => {
        combatLoop();
    }, frameInterval);
}

// Pausa/Retoma combate
function togglePause() {
    isCombatPaused = !isCombatPaused;
    const btn = document.getElementById('btn-pause');
    
    if (isCombatPaused) {
        combatPausedTime = performance.now();
        btn.innerHTML = '<i class="fas fa-play"></i> RESUME';
        document.getElementById('fight-indicator').textContent = 'PAUSED';
    } else {
        totalPausedTime += performance.now() - combatPausedTime;
        btn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        document.getElementById('fight-indicator').textContent = 'FIGHTING';
        combatLoop();
    }
}

// Reinicia combate
function resetCombat() {
    isCombatRunning = false;
    isCombatPaused = false;
    combatants = [];
    podium = { first: null, second: null, third: null };
    combatStartTime = 0;
    totalPausedTime = 0;
    hypeFeed = [];
    
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-pause').disabled = true;
    document.getElementById('btn-pause').innerHTML = '<i class="fas fa-pause"></i> PAUSE';
    document.getElementById('fight-indicator').textContent = 'READY';
    document.getElementById('timer-display').textContent = '05:00';
    document.getElementById('countdown-overlay').classList.remove('active');
    const fightOverlayEl = document.getElementById('fight-overlay');
    if (fightOverlayEl) fightOverlayEl.classList.remove('active');
    
    renderBattleCards();
    updateRankingAndPodium();
    document.getElementById('hype-feed-container').innerHTML = '<div class="feed-item">Aguardando início do combate...</div>';
}

// Finaliza combate
function endCombat() {
    // Finaliza o combate quando o tempo acaba ou 3 modelos atingiram 2048
    const now = isCombatPaused ? combatPausedTime : performance.now();
    const elapsed = Math.max(0, now - combatStartTime - totalPausedTime);
    const isRoundFinished = elapsed >= ROUND_DURATION;
    const reached2048Count = combatants.filter(c => c.reached2048).length;
    
    if (!isRoundFinished && reached2048Count < 3) {
        return; // Só finaliza se tempo acabou ou 3 atingiram 2048
    }
    
    // Calcula médias finais para todos (incluindo jogo atual)
    combatants.forEach(combatant => {
        combatant.averageScore = calculateAverageScore(combatant);
    });
    
    // Atualiza pódio final
    updateRankingAndPodium();
    
    isCombatRunning = false;
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-pause').disabled = true;
    document.getElementById('fight-indicator').textContent = 'FINISHED';
    document.getElementById('fight-indicator').classList.remove('fight');
    
    const icon1 = agentIcons[podium.first.agentType] || 'fa-user';
    const icon2 = agentIcons[podium.second.agentType] || 'fa-user';
    const icon3 = agentIcons[podium.third.agentType] || 'fa-user';
    const score1 = podium.first.reached2048 ? `${podium.first.bestScore} pts` : `${Math.round(podium.first.averageScore || 0)} pts (média)`;
    const score2 = podium.second.reached2048 ? `${podium.second.bestScore} pts` : `${Math.round(podium.second.averageScore || 0)} pts (média)`;
    const score3 = podium.third.reached2048 ? `${podium.third.bestScore} pts` : `${Math.round(podium.third.averageScore || 0)} pts (média)`;
    const winnerMessage = `🏁 RODADA FINALIZADA! Vencedores: 🥇 ${podium.first.name} (${score1}), 🥈 ${podium.second.name} (${score2}), 🥉 ${podium.third.name} (${score3})`;
    updateHypeFeed(winnerMessage, 'highlight');
}

// Atualiza timer
function updateTimer() {
    if (combatStartTime === 0) {
        return;
    }
    
    const timerEl = document.getElementById('timer-display');
    if (!timerEl) {
        return;
    }
    
    const now = isCombatPaused ? combatPausedTime : performance.now();
    const elapsed = Math.max(0, now - combatStartTime - totalPausedTime);
    const remaining = Math.max(0, ROUND_DURATION - elapsed);
    
    // Se o tempo acabou, finaliza o combate
    if (remaining <= 0 && isCombatRunning) {
        endCombat();
        return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Obtém modelos selecionados
function getSelectedModels() {
    const checkboxes = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => {
        const value = cb.value;
        // Se é um modelo treinado, retorna objeto com informações
        if (value.startsWith('trained_')) {
            const modelId = value.replace('trained_', '');
            const container = cb.closest('.trained-model');
            const agentType = container ? container.dataset.modelType : null;
            return {
                type: 'trained',
                modelId: modelId,
                agentType: agentType,
                value: value
            };
        }
        // Modelo padrão
        return {
            type: 'standard',
            agentType: value,
            value: value
        };
    });
}

/**
 * Cria um agente a partir de um modelo treinado salvo
 * @param {string} modelId - ID do modelo treinado
 * @returns {Object|null} - Instância do agente ou null se houver erro
 */
function createAgentFromTrainedModel(modelId) {
    try {
        const data = JSON.parse(localStorage.getItem(`trained_model_${modelId}`));
        if (!data || !data.metadata) {
            console.error('Modelo treinado não encontrado:', modelId);
            return null;
        }
        
        const agentType = data.metadata.agentType;
        let agent = createAgent(agentType);
        
        if (!agent) {
            console.error('Erro ao criar agente do tipo:', agentType);
            return null;
        }
        
        // Carrega dados aprendidos
        if (agent.qTable && data.qTable) {
            agent.qTable = new Map(Object.entries(data.qTable));
        }
        if (data.heuristicWeights && agent.weights) {
            agent.weights = data.heuristicWeights;
        }
        if (agent.weights && data.weights && Array.isArray(data.weights)) {
            agent.weights = data.weights;
        }
        if (data.networkWeights && agent.qNetwork) {
            try {
                const weights = data.networkWeights.map(w => tf.tensor(w));
                agent.qNetwork.setWeights(weights);
            } catch (e) {
                console.warn('Erro ao carregar pesos da rede neural:', e);
            }
        }
        if (data.modelWeights && agent.model) {
            try {
                const weights = data.modelWeights.map(w => tf.tensor(w));
                agent.model.setWeights(weights);
            } catch (e) {
                console.warn('Erro ao carregar pesos do modelo:', e);
            }
        }
        if (data.actorWeights && agent.actor) {
            try {
                const weights = data.actorWeights.map(w => tf.tensor(w));
                agent.actor.setWeights(weights);
            } catch (e) {
                console.warn('Erro ao carregar pesos do actor:', e);
            }
        }
        if (data.criticWeights && agent.critic) {
            try {
                const weights = data.criticWeights.map(w => tf.tensor(w));
                agent.critic.setWeights(weights);
            } catch (e) {
                console.warn('Erro ao carregar pesos do critic:', e);
            }
        }
        if (data.population && agent.population) {
            agent.population = data.population;
            agent.generation = data.generation || 0;
        }
        
        // Aplica parâmetros de calibração salvos
        if (data.parameters) {
            const params = data.parameters;
            
            // Parâmetros de aprendizado
            if (params.learningRate !== undefined && agent.setLearningRate) {
                agent.setLearningRate(params.learningRate);
            }
            if (params.discountFactor !== undefined && agent.setDiscountFactor) {
                agent.setDiscountFactor(params.discountFactor);
            }
            if (params.epsilon !== undefined && agent.setEpsilon) {
                agent.setEpsilon(params.epsilon);
            }
            if (params.lambda !== undefined && agent.setLambda) {
                agent.setLambda(params.lambda);
            }
            if (params.explorationConstant !== undefined && agent.setExplorationConstant) {
                agent.setExplorationConstant(params.explorationConstant);
            }
            
            // Parâmetros de busca
            if (params.maxDepth !== undefined && agent.setMaxDepth) {
                agent.setMaxDepth(params.maxDepth);
            }
            if (params.depth !== undefined && agent.setMaxDepth) {
                agent.setMaxDepth(params.depth);
            }
            if (params.simulations !== undefined && agent.setSimulations) {
                agent.setSimulations(params.simulations);
            }
            if (params.beamWidth !== undefined && agent.setBeamWidth) {
                agent.setBeamWidth(params.beamWidth);
            }
            
            // Parâmetros genéticos
            if (params.mutationRate !== undefined && agent.setMutationRate) {
                agent.setMutationRate(params.mutationRate);
            }
            if (params.populationSize !== undefined && agent.setPopulationSize) {
                agent.setPopulationSize(params.populationSize);
            }
        }
        
        return agent;
    } catch (e) {
        console.error('Erro ao criar agente de modelo treinado:', e);
        return null;
    }
}

/**
 * Cria uma instância de agente baseado no tipo
 * @param {string} agentType - Tipo do agente ('random', 'greedy', 'qlearning', etc.)
 * @returns {Object} - Instância do agente
 */
function createAgent(agentType) {
    // Tenta carregar parâmetros salvos primeiro
    const saved = localStorage.getItem(`agent_${agentType}`);
    let savedParams = null;
    if (saved) {
        try {
            const data = JSON.parse(saved);
            savedParams = data.parameters || null;
        } catch (e) {
            console.warn(`Erro ao ler parâmetros salvos para ${agentType}:`, e);
        }
    }
    
    switch(agentType) {
        case 'random': return new RandomAgent();
        case 'greedy': return new GreedyAgent();
        case 'heuristic': return new HeuristicAgent();
        case 'weightedheuristic': return new WeightedHeuristicAgent();
        case 'alphabeta': {
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new AlphaBetaAgent(depth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'minimax': {
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new MinimaxAgent(depth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'expectimax': {
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new ExpectimaxAgent(depth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'montecarlo': {
            const sims = savedParams?.simulations || 100;
            const agent = new MonteCarloAgent(sims);
            if (savedParams?.simulations) agent.setSimulations(savedParams.simulations);
            return agent;
        }
        case 'qlearning': return loadOrCreateAgent('qlearning', () => new QLearningAgent());
        case 'sarsa': return loadOrCreateAgent('sarsa', () => new SARSAAgent());
        case 'tdlearning': return loadOrCreateAgent('tdlearning', () => new TDLearningAgent());
        case 'astar': {
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new AStarAgent(depth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'beamsearch': {
            const beamWidth = savedParams?.beamWidth || 3;
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new BeamSearchAgent(beamWidth, depth);
            if (savedParams?.beamWidth) agent.setBeamWidth(savedParams.beamWidth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'iterativedeepening': {
            const depth = savedParams?.depth || savedParams?.maxDepth || 3;
            const agent = new IterativeDeepeningAgent(depth);
            if (savedParams?.depth || savedParams?.maxDepth) agent.setMaxDepth(savedParams.depth || savedParams.maxDepth);
            return agent;
        }
        case 'mcts': {
            const sims = savedParams?.simulations || 100;
            const agent = new MCTSAgent(sims);
            if (savedParams?.simulations) agent.setSimulations(savedParams.simulations);
            if (savedParams?.explorationConstant) agent.setExplorationConstant(savedParams.explorationConstant);
            return agent;
        }
        case 'geneticalgorithm': {
            const agent = loadOrCreateAgent('geneticalgorithm', () => new GeneticAlgorithmAgent());
            if (savedParams?.mutationRate && agent.setMutationRate) {
                agent.setMutationRate(savedParams.mutationRate);
            }
            return agent;
        }
        case 'policygradient': return loadOrCreateAgent('policygradient', () => new PolicyGradientAgent());
        case 'neuralnetwork': return loadOrCreateAgent('neuralnetwork', () => new NeuralNetworkAgent());
        case 'dqn': return loadOrCreateAgent('dqn', () => new DQNAgent());
        case 'actorcritic': return loadOrCreateAgent('actorcritic', () => new ActorCriticAgent());
        default: return new RandomAgent();
    }
}

// Carrega ou cria agente
function loadOrCreateAgent(agentType, createFn) {
    try {
        const saved = localStorage.getItem(`agent_${agentType}`);
        if (saved) {
            const agent = createFn();
            const data = JSON.parse(saved);
            
            // Carrega dados aprendidos
            if (agent.qTable && data.qTable) {
                agent.qTable = new Map(Object.entries(data.qTable));
            }
            if (data.heuristicWeights && agent.weights) {
                // Para WeightedHeuristicAgent
                agent.weights = data.heuristicWeights;
            }
            if (agent.weights && data.weights && Array.isArray(data.weights)) {
                agent.weights = data.weights;
            }
            if (data.networkWeights && agent.qNetwork) {
                // Para DQN
                try {
                    const weights = data.networkWeights.map(w => tf.tensor(w));
                    agent.qNetwork.setWeights(weights);
                } catch (e) {
                    console.warn('Erro ao carregar pesos da rede neural:', e);
                }
            }
            if (data.modelWeights && agent.model) {
                // Para PolicyGradient, NeuralNetwork
                try {
                    const weights = data.modelWeights.map(w => tf.tensor(w));
                    agent.model.setWeights(weights);
                } catch (e) {
                    console.warn('Erro ao carregar pesos do modelo:', e);
                }
            }
            if (data.actorWeights && agent.actor) {
                // Para ActorCritic
                try {
                    const weights = data.actorWeights.map(w => tf.tensor(w));
                    agent.actor.setWeights(weights);
                } catch (e) {
                    console.warn('Erro ao carregar pesos do actor:', e);
                }
            }
            if (data.criticWeights && agent.critic) {
                // Para ActorCritic
                try {
                    const weights = data.criticWeights.map(w => tf.tensor(w));
                    agent.critic.setWeights(weights);
                } catch (e) {
                    console.warn('Erro ao carregar pesos do critic:', e);
                }
            }
            if (data.population && agent.population) {
                // Para GeneticAlgorithmAgent
                agent.population = data.population;
                agent.generation = data.generation || 0;
            }
            
            // Aplica parâmetros de calibração salvos
            if (data.parameters) {
                const params = data.parameters;
                
                // Parâmetros de aprendizado
                if (params.learningRate !== undefined && agent.setLearningRate) {
                    agent.setLearningRate(params.learningRate);
                }
                if (params.discountFactor !== undefined && agent.setDiscountFactor) {
                    agent.setDiscountFactor(params.discountFactor);
                }
                if (params.epsilon !== undefined && agent.setEpsilon) {
                    agent.setEpsilon(params.epsilon);
                }
                if (params.lambda !== undefined && agent.setLambda) {
                    agent.setLambda(params.lambda);
                }
                
                // Parâmetros de busca
                if (params.maxDepth !== undefined && agent.setMaxDepth) {
                    agent.setMaxDepth(params.maxDepth);
                }
                if (params.depth !== undefined && agent.setMaxDepth) {
                    agent.setMaxDepth(params.depth);
                }
                if (params.simulations !== undefined && agent.setSimulations) {
                    agent.setSimulations(params.simulations);
                }
                if (params.explorationConstant !== undefined && agent.setExplorationConstant) {
                    agent.setExplorationConstant(params.explorationConstant);
                }
                if (params.mutationRate !== undefined && agent.setMutationRate) {
                    agent.setMutationRate(params.mutationRate);
                }
                if (params.beamWidth !== undefined && agent.setBeamWidth) {
                    agent.setBeamWidth(params.beamWidth);
                }
                if (params.populationSize !== undefined && agent.populationSize !== undefined) {
                    agent.populationSize = params.populationSize;
                }
                if (params.batchSize !== undefined && agent.batchSize !== undefined) {
                    agent.batchSize = params.batchSize;
                }
                if (params.bufferSize !== undefined && agent.bufferSize !== undefined) {
                    agent.bufferSize = params.bufferSize;
                }
                if (params.updateTargetSteps !== undefined && agent.updateTargetSteps !== undefined) {
                    agent.updateTargetSteps = params.updateTargetSteps;
                }
            }
            
            return agent;
        }
    } catch (e) {
        console.warn(`Erro ao carregar agente ${agentType}:`, e);
    }
    return createFn();
}

// Obtém cor única para modelo
function getModelColor(agentType) {
    if (!modelColors.has(agentType)) {
        const hue = nextColorHue;
        nextColorHue = (nextColorHue + 137.5) % 360; // Golden angle para distribuição uniforme
        // Aumenta saturação e ajusta luminosidade para cores mais vibrantes
        modelColors.set(agentType, `hsl(${hue}, 85%, 55%)`);
    }
    return modelColors.get(agentType);
}

// Carrega cores salvas
function loadModelColors() {
    const saved = localStorage.getItem('modelColors');
    if (saved) {
        modelColors = new Map(JSON.parse(saved));
    }
}

// Converte cor HSL/hex para RGB
function hexToRgb(color) {
    if (color && color.startsWith('hsl')) {
        // Extrai valores HSL
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            const h = parseInt(match[1]) / 360;
            const s = parseInt(match[2]) / 100;
            const l = parseInt(match[3]) / 100;
            
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs((h * 6) % 2 - 1));
            const m = l - c / 2;
            
            let r, g, b;
            if (h < 1/6) { r = c; g = x; b = 0; }
            else if (h < 2/6) { r = x; g = c; b = 0; }
            else if (h < 3/6) { r = 0; g = c; b = x; }
            else if (h < 4/6) { r = 0; g = x; b = c; }
            else if (h < 5/6) { r = x; g = 0; b = c; }
            else { r = c; g = 0; b = x; }
            
            return {
                r: Math.round((r + m) * 255),
                g: Math.round((g + m) * 255),
                b: Math.round((b + m) * 255)
            };
        }
    }
    return null;
}

// Garante consistência do layout desde o carregamento
function ensureLayoutConsistency() {
    const battleGrid = document.getElementById('battle-grid');
    const timerChartContainer = document.querySelector('.timer-chart-container');
    
    if (battleGrid && timerChartContainer) {
        // Força o recálculo do layout
        battleGrid.style.display = 'grid';
        timerChartContainer.style.display = 'grid';
    }
}

// Renderiza battle cards
function renderBattleCards() {
    const container = document.getElementById('battle-grid');
    container.innerHTML = '';
    
    if (combatants.length === 0) {
        ensureLayoutConsistency();
        return;
    }
    
    // Ordena por bestScore para identificar líder
    const sortedForLeader = [...combatants].sort((a, b) => b.bestScore - a.bestScore);
    
    combatants.forEach((combatant, index) => {
        const card = document.createElement('div');
        let cardClasses = `battle-card ${combatant.finished ? 'finished' : ''}`;
        
        // Adiciona classe de líder se for o primeiro no ranking
        if (sortedForLeader[0] && sortedForLeader[0].id === combatant.id && !combatant.finished) {
            cardClasses += ' leader';
        }
        
        // Adiciona classe se atingiu 2048
        if (combatant.reached2048) {
            cardClasses += ' reached2048';
        }
        
        card.className = cardClasses;
        card.style.borderColor = combatant.color;
        card.style.boxShadow = `0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px ${combatant.color}40`;
        
        // Adiciona gradiente de fundo com a cor do player
        const colorRGB = hexToRgb(combatant.color) || {r: 245, g: 149, b: 99};
        card.style.background = `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, 0.1) 100%)`;
        card.style.borderRadius = '12px';
        
        const badgeType = neuralAgents.includes(combatant.agentType) ? 'neural' : 'heuristic';
        
        card.innerHTML = `
            <div class="battle-card-header">
                <span class="battle-card-name" style="color: ${combatant.color}; text-shadow: 0 0 5px ${combatant.color}60;">${combatant.name}</span>
            </div>
            <div class="battle-card-board">
                ${renderMiniGrid(combatant.game.grid)}
            </div>
            <div class="battle-card-stats">
                <div><i class="fas fa-star"></i> Score: ${combatant.score}</div>
                <div><i class="fas fa-cube"></i> Maior: ${combatant.maxTile}</div>
                <div class="stress-bar-container">
                    <div class="stress-bar-label">Stress: ${combatant.stressLevel}%</div>
                    <div class="stress-bar">
                        <div class="stress-bar-fill" style="width: ${combatant.stressLevel}%; background: ${combatant.color}; box-shadow: 0 0 5px ${combatant.color}60;"></div>
                    </div>
                </div>
                ${combatant.lastMove ? `
                    <div class="decision-preview">
                        <span>Último:</span>
                        <span class="decision-arrow" style="color: ${combatant.color}; text-shadow: 0 0 4px ${combatant.color}60;">${getMoveArrow(combatant.lastMove)}</span>
                        <span class="decision-badge" style="color: ${badgeType === 'neural' ? '#8b5cf6' : '#f59563'}; font-size: 10px; opacity: 0.7; margin-left: 4px;">${badgeType}</span>
                    </div>
                ` : ''}
                ${combatant.reached2048 ? '<div style="color: #f59563; font-weight: bold;">🎯 2048!</div>' : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Renderiza mini grid
function renderMiniGrid(grid) {
    let html = '';
    for (let i = 0; i < 16; i++) {
        const val = grid[i];
        if (val > 0) {
            html += `<div class="tile tile-${val}">${val}</div>`;
        } else {
            html += '<div class="tile"></div>';
        }
    }
    return html;
}

// Obtém seta do movimento
function getMoveArrow(move) {
    const arrows = {
        'up': '↑',
        'down': '↓',
        'left': '←',
        'right': '→'
    };
    return arrows[move] || '?';
}

// Gera comentário analítico específico baseado na natureza do modelo
function generateAnalyticalComment(combatant, scoreGain, previousScores) {
    const emptyCells = combatant.game.grid.filter(cell => cell === 0).length;
    const maxTile = combatant.maxTile;
    const score = combatant.score;
    const stress = combatant.stressLevel;
    const isNeural = neuralAgents.includes(combatant.agentType);
    const agentType = combatant.agentType;
    
    // Análise de performance
    const avgScore = Array.from(previousScores.values()).reduce((a, b) => a + b, 0) / previousScores.size;
    const isAboveAverage = score > avgScore;
    
    let messages = [];
    
    // Análise de estratégia (simplificada)
    if (scoreGain > 500) {
        messages.push(`💥 ${combatant.name}: +${scoreGain} pts!`);
    } else if (scoreGain > 200) {
        messages.push(`📈 ${combatant.name}: +${scoreGain} pts`);
    } else if (scoreGain > 50) {
        messages.push(`⚡ ${combatant.name}: +${scoreGain} pts`);
    }
    
    // Análise do estado do tabuleiro (simplificada)
    if (emptyCells < 4) {
        messages.push(`🚨 ${combatant.name}: ${emptyCells} células livres!`);
    } else if (emptyCells < 6) {
        messages.push(`⚠️ ${combatant.name}: ${emptyCells} células livres`);
    }
    
    // Análise de progresso (simplificada)
    if (maxTile >= 2048) {
        messages.push(`🎯 ${combatant.name} atingiu 2048!`);
    } else if (maxTile >= 1024) {
        messages.push(`🔥 ${combatant.name}: bloco ${maxTile}`);
    } else if (maxTile >= 512) {
        messages.push(`📊 ${combatant.name}: bloco ${maxTile}`);
    }
    
    // Retorna apenas a primeira mensagem para manter curto
    return messages.length > 0 ? messages[0] : null;
}

// Análise específica por modelo (simplificada)
function getModelSpecificAnalysis(combatant, agentType, scoreGain, emptyCells, maxTile, stress) {
    return null; // Removido para simplificar
}

// Estratégias específicas de redes neurais
function getNeuralStrategy(agentType) {
    const strategies = {
        'dqn': 'Deep Q-Network',
        'qlearning': 'Q-Learning',
        'sarsa': 'SARSA',
        'actorcritic': 'Actor-Critic',
        'policygradient': 'Policy Gradient',
        'neuralnetwork': 'Neural Network',
        'tdlearning': 'TD-Learning'
    };
    return strategies[agentType] || 'rede neural';
}

// Estratégias específicas de heurísticas
function getHeuristicStrategy(agentType) {
    const strategies = {
        'minimax': 'Minimax',
        'alphabeta': 'Alpha-Beta',
        'expectimax': 'Expectimax',
        'mcts': 'MCTS',
        'montecarlo': 'Monte Carlo',
        'greedy': 'Greedy',
        'beamsearch': 'Beam Search',
        'astar': 'A* Search',
        'heuristic': 'Heurística',
        'weightedheuristic': 'Heurística Ponderada'
    };
    return strategies[agentType] || 'algoritmo heurístico';
}

// Gera análise para pódio
function generatePodiumAnalysis(combatant) {
    const emptyCells = combatant.game.grid.filter(cell => cell === 0).length;
    const maxTile = combatant.maxTile;
    const stress = combatant.stressLevel;
    
    let analysis = '';
    
    if (combatant.reached2048) {
        analysis = `Este modelo já alcançou o objetivo de 2048, demonstrando ${neuralAgents.includes(combatant.agentType) ? 'excelência em aprendizado por reforço' : 'maestria em algoritmos de busca'}. `;
    }
    
    analysis += `Atualmente com bloco máximo de ${maxTile} e ${emptyCells} células livres. `;
    
    if (stress < 50) {
        analysis += `O tabuleiro está sob controle total, permitindo movimentos estratégicos de longo prazo.`;
    } else if (stress < 80) {
        analysis += `Gerenciamento eficiente do espaço, mantendo opções abertas.`;
    } else {
        analysis += `Operando sob alta pressão, cada movimento é crítico.`;
    }
    
    return analysis;
}

// Gera análise contextual geral da corrida
function generateContextualRaceAnalysis() {
    if (combatants.length === 0) return null;
    
    const sorted = [...combatants].sort((a, b) => b.bestScore - a.bestScore);
    const neuralCount = combatants.filter(c => neuralAgents.includes(c.agentType)).length;
    const heuristicCount = combatants.length - neuralCount;
    const avgScore = combatants.reduce((sum, c) => sum + c.bestScore, 0) / combatants.length;
    const maxScore = sorted[0]?.bestScore || 0;
    const minScore = sorted[sorted.length - 1]?.bestScore || 0;
    const scoreSpread = maxScore - minScore;
    
    // Divide em mensagens curtas
    let messages = [];
    
    let analysis = '';
    
    // Análise de composição da corrida
    if (neuralCount > 0 && heuristicCount > 0) {
        analysis += `🎯 ANÁLISE DA CORRIDA: Batalha híbrida com ${neuralCount} modelo${neuralCount > 1 ? 's' : ''} neural${neuralCount > 1 ? 's' : ''} vs ${heuristicCount} algoritmo${heuristicCount > 1 ? 's' : ''} heurístico${heuristicCount > 1 ? 's' : ''}. `;
        
        const neuralAvg = combatants.filter(c => neuralAgents.includes(c.agentType))
            .reduce((sum, c) => sum + c.bestScore, 0) / neuralCount;
        const heuristicAvg = combatants.filter(c => !neuralAgents.includes(c.agentType))
            .reduce((sum, c) => sum + c.bestScore, 0) / heuristicCount;
        
        if (neuralAvg > heuristicAvg * 1.2) {
            analysis += `As redes neurais estão dominando (média ${neuralAvg.toFixed(0)} vs ${heuristicAvg.toFixed(0)}), demonstrando superioridade do aprendizado adaptativo. `;
        } else if (heuristicAvg > neuralAvg * 1.2) {
            analysis += `Os algoritmos heurísticos estão liderando (média ${heuristicAvg.toFixed(0)} vs ${neuralAvg.toFixed(0)}), mostrando eficiência de estratégias pré-definidas. `;
        } else {
            analysis += `Equilíbrio interessante: redes neurais (média ${neuralAvg.toFixed(0)}) e heurísticas (média ${heuristicAvg.toFixed(0)}) estão competindo de forma equilibrada. `;
        }
    } else if (neuralCount === combatants.length) {
        analysis += `🧠 CORRIDA NEURAL: Todos os ${neuralCount} modelos são redes neurais. Esta é uma batalha pura de aprendizado por reforço, onde cada rede está refinando suas políticas através de experiência. `;
    } else {
        analysis += `⚙️ CORRIDA HEURÍSTICA: Todos os ${heuristicCount} modelos são algoritmos baseados em regras. Esta é uma competição de estratégias pré-definidas e otimização de parâmetros. `;
    }
    
    // Análise de dispersão de scores
    if (scoreSpread > avgScore * 0.5 && avgScore > 0) {
        analysis += `📊 DISPERSÃO ALTA: Diferença de ${scoreSpread.toFixed(0)} pontos entre líder (${maxScore}) e último (${minScore}), indicando estratégias muito diferentes em ação. `;
    } else if (scoreSpread < avgScore * 0.2 && avgScore > 0) {
        analysis += `📊 CORRIDA ACIRRADA: Apenas ${scoreSpread.toFixed(0)} pontos separam o líder (${maxScore}) do último (${minScore}), uma competição extremamente equilibrada. `;
    }
    
    // Análise de progresso geral
    const reached2048Count = combatants.filter(c => c.reached2048).length;
    if (reached2048Count > 0) {
        analysis += `🎯 ${reached2048Count} modelo${reached2048Count > 1 ? 's' : ''} já ${reached2048Count > 1 ? 'atingiram' : 'atingiu'} o objetivo de 2048. `;
    }
    
    const highStressCount = combatants.filter(c => c.stressLevel >= 90).length;
    if (highStressCount > combatants.length / 2) {
        analysis += `⚠️ SITUAÇÃO CRÍTICA GERAL: ${highStressCount} de ${combatants.length} modelos estão com stress acima de 90%, indicando que a maioria está em situação de emergência. `;
    }
    
    // Análise do líder
    if (sorted[0]) {
        const leader = sorted[0];
        analysis += `👑 LIDERANÇA: ${leader.name} está no topo com ${leader.bestScore} pontos, ${neuralAgents.includes(leader.agentType) ? 'demonstrando eficácia do aprendizado por reforço' : 'mostrando maestria em algoritmos de busca e heurísticas'}. `;
    }
    
    return analysis || null;
}

// Calcula média considerando jogo atual em aberto
function calculateAverageScore(combatant) {
    // Se não há jogos finalizados, usa apenas o score atual
    if (combatant.gamesPlayed === 0) {
        return combatant.score || 0;
    }
    // Média = (totalScore dos jogos finalizados + score atual) / (gamesPlayed + 1)
    return (combatant.totalScore + (combatant.score || 0)) / (combatant.gamesPlayed + 1);
}

// Atualiza ranking e pódio baseado na média de pontos por jogo
function updateRankingAndPodium() {
    // Calcula média atualizada para todos (incluindo jogo em aberto)
    combatants.forEach(combatant => {
        combatant.averageScore = calculateAverageScore(combatant);
    });
    
    // Ordena por: 1) Atingiu 2048, 2) Média de pontos
    const sorted = [...combatants].sort((a, b) => {
        // Primeiro: quem atingiu 2048
        if (a.reached2048 && !b.reached2048) return -1;
        if (!a.reached2048 && b.reached2048) return 1;
        // Segundo: maior média de pontos
        return b.averageScore - a.averageScore;
    });
    
    // Só atualiza pódio se atingiu 2048 ou se o combate terminou
    const reached2048Count = combatants.filter(c => c.reached2048).length;
    const now = isCombatPaused ? combatPausedTime : performance.now();
    const elapsed = Math.max(0, now - combatStartTime - totalPausedTime);
    const isRoundFinished = elapsed >= ROUND_DURATION;
    
    // Atualiza pódio apenas se alguém atingiu 2048 ou se a rodada terminou
    if (reached2048Count > 0 || isRoundFinished) {
        const newPodium = {
            first: sorted[0] || null,
            second: sorted[1] || null,
            third: sorted[2] || null
        };
        
        // Verifica se houve mudança no pódio
        const podiumChanged = 
            podium.first?.id !== newPodium.first?.id ||
            podium.second?.id !== newPodium.second?.id ||
            podium.third?.id !== newPodium.third?.id;
        
        if (podiumChanged && (reached2048Count > 0 || isRoundFinished)) {
            // Narração sobre mudanças no pódio (apenas se atingiu 2048)
            if (newPodium.first && podium.first?.id !== newPodium.first.id && newPodium.first.reached2048) {
                const narratorMessage = `👑 ${newPodium.first.name} atingiu 2048!`;
                updateHypeFeed(narratorMessage, 'highlight');
                if (!podium.first) {
                    showConfetti();
                }
            }
        }
        
        podium = newPodium;
    }
    
    // Atualiza posições dos combatentes
    sorted.forEach((combatant, index) => {
        combatant.position = index + 1;
    });
    
    // Atualiza classes de líder nos cards
    sorted.forEach((combatant, index) => {
        const cards = document.querySelectorAll('.battle-card');
        cards.forEach(card => {
            const cardName = card.querySelector('.battle-card-name')?.textContent.trim();
            if (cardName === combatant.name) {
                if (index === 0 && !combatant.finished) {
                    card.classList.add('leader');
                } else {
                    card.classList.remove('leader');
                }
                if (combatant.reached2048) {
                    card.classList.add('reached2048');
                } else {
                    card.classList.remove('reached2048');
                }
            }
        });
    });
    
    // Atualiza gráfico (todos os participantes)
    updateRankingChart(sorted);
    
    // Atualiza pódio visual
    updatePodium();
}

// Função antiga - mantida para compatibilidade mas não usada
function updateRanking() {
    updateRankingAndPodium();
}

// Atualiza pódio
function updatePodium() {
    updatePodiumSlot(1, podium.first);
    updatePodiumSlot(2, podium.second);
    updatePodiumSlot(3, podium.third);
}

function updatePodiumSlot(position, combatant) {
    const slot = document.getElementById(`podium-${position}`);
    if (!slot) return;
    
    if (combatant) {
        slot.querySelector('.podium-placeholder').style.display = 'none';
        const content = slot.querySelector('.podium-content');
        content.style.display = 'flex';
        const iconClass = agentIcons[combatant.agentType] || 'fa-user';
        content.querySelector('.podium-name').innerHTML = `<i class="fas ${iconClass}"></i> ${combatant.name}`;
        // Mostra apenas a pontuação
        const displayScore = combatant.reached2048 ? `${combatant.bestScore} pts` : `${Math.round(combatant.averageScore || 0)} pts (média)`;
        content.querySelector('.podium-time').textContent = displayScore;
        slot.classList.add('filled');
    } else {
        slot.querySelector('.podium-placeholder').style.display = 'flex';
        slot.querySelector('.podium-content').style.display = 'none';
        slot.classList.remove('filled');
    }
}

// Formata tempo
function formatTime(ms) {
    if (!ms) return '--:--:--.---';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(Math.floor(ms % 1000)).padStart(3, '0')}`;
}

// Atualiza hype feed
function updateHypeFeed(message, type = 'normal') {
    hypeFeed.push({ message, type, time: Date.now() });
    if (hypeFeed.length > 50) {
        hypeFeed.shift();
    }
    
    const container = document.getElementById('hype-feed-container');
    container.innerHTML = '';
    
    hypeFeed.slice(-20).reverse().forEach(item => {
        const feedItem = document.createElement('div');
        feedItem.className = `feed-item ${item.type === 'highlight' ? 'highlight' : ''}`;
        feedItem.textContent = item.message;
        container.appendChild(feedItem);
    });
    
    container.scrollTop = 0;
}

// Mostra confetti
function showConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#f59563', '#f67c5f', '#edcf72', '#edcc61', '#f65e3b'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Inicializa gráfico de ranking
function initRankingChart() {
    const canvas = document.getElementById('ranking-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                backgroundColor: function(context) {
                    if (!context.parsed) return 'rgba(245, 149, 99, 0.8)';
                    const combatant = combatants.find(c => c.name === context.chart.data.labels[context.dataIndex]);
                    return combatant ? combatant.color + '80' : 'rgba(245, 149, 99, 0.8)';
                },
                borderColor: function(context) {
                    if (!context.parsed) return '#f59563';
                    const combatant = combatants.find(c => c.name === context.chart.data.labels[context.dataIndex]);
                    return combatant ? combatant.color : '#f59563';
                },
                borderWidth: 2,
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    color: '#e2e8f0',
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return Math.round(value);
                    },
                    display: function(context) {
                        return context.parsed && context.parsed.x !== undefined && context.parsed.x > 0;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: {
                duration: 400
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#f59563',
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        title: function(context) {
                            const label = context[0].label;
                            const combatant = combatants.find(c => label.includes(c.name));
                            const iconClass = combatant ? agentIcons[combatant.agentType] || 'fa-user' : 'fa-user';
                            return `${String.fromCharCode(0x200B)} ${label}`;
                        },
                        label: function(context) {
                            if (!context.parsed || context.parsed.x === undefined) return 'Pontuação: 0';
                            return `Pontuação: ${context.parsed.x}`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    color: '#e2e8f0',
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return Math.round(value);
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 9 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Plugin para desenhar ícones no último ponto de cada linha
const iconPointPlugin = {
    id: 'iconPointPlugin',
    afterDraw: (chart) => {
        const datasets = chart.data.datasets;
        const canvas = chart.canvas;
        const wrapper = canvas.parentElement;
        
        if (!wrapper) return;
        
        // Remove ícones antigos
        wrapper.querySelectorAll('.timeline-icon').forEach(el => el.remove());
        
        datasets.forEach((dataset, datasetIndex) => {
            if (!dataset.data || dataset.data.length === 0) return;
            
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || !meta.data || meta.data.length === 0) return;
            
            // Pega o último ponto
            const lastPoint = meta.data[meta.data.length - 1];
            if (!lastPoint) return;
            
            const x = lastPoint.x;
            const y = lastPoint.y;
            
            // Encontra o combatente correspondente
            const combatant = combatants.find(c => c.name === dataset.label);
            if (!combatant) return;
            
            const iconClass = agentIcons[combatant.agentType] || 'fa-user';
            
            // Calcula posição relativa ao wrapper
            // As coordenadas x e y do Chart.js são relativas ao canvas
            // Precisamos ajustar para o padding do wrapper (8px)
            const iconX = x + 8; // padding do wrapper
            const iconY = y + 8; // padding do wrapper
            
            // Cria elemento HTML com ícone
            const iconEl = document.createElement('div');
            iconEl.className = 'timeline-icon';
            iconEl.style.position = 'absolute';
            iconEl.style.left = `${iconX}px`;
            iconEl.style.top = `${iconY}px`;
            iconEl.style.transform = 'translate(-50%, -50%)';
            iconEl.style.display = 'flex';
            iconEl.style.alignItems = 'center';
            iconEl.style.justifyContent = 'center';
            iconEl.style.fontSize = '12px';
            iconEl.style.color = combatant.color;
            iconEl.style.zIndex = '10';
            iconEl.style.pointerEvents = 'none';
            iconEl.style.lineHeight = '1';
            iconEl.innerHTML = `<i class="fas ${iconClass}"></i>`;
            
            wrapper.style.position = 'relative';
            wrapper.appendChild(iconEl);
        });
    }
};

// Inicializa gráfico de melhor pontuação por segundo
function initScoreTimelineChart() {
    const canvas = document.getElementById('score-timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Registra o plugin
    Chart.register(iconPointPlugin);
    
    scoreTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#f59563',
                    bodyColor: '#e2e8f0',
                    mode: 'index',
                    intersect: false,
                    titleFont: { size: 10 },
                    bodyFont: { size: 9 },
                    padding: 8,
                    callbacks: {
                        title: function(context) {
                            return `Segundo ${context[0].label}`;
                        },
                        label: function(context) {
                            const combatant = combatants.find(c => c.name === context.dataset.label);
                            return `${context.parsed.y} pts`;
                        },
                        labelColor: function(context) {
                            const combatant = combatants.find(c => c.name === context.dataset.label);
                            return {
                                borderColor: combatant ? combatant.color : '#f59563',
                                backgroundColor: combatant ? combatant.color : '#f59563'
                            };
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Atualiza gráfico de melhor pontuação por segundo
function updateScoreTimeline() {
    if (!scoreTimelineChart || combatants.length === 0 || !isCombatRunning) return;
    
    const currentTime = Math.floor((performance.now() - combatStartTime - totalPausedTime) / 1000);
    
    if (currentTime < 0) return;
    
    // Preenche segundos faltantes
    while (lastScoreTimelineSecond < currentTime) {
        lastScoreTimelineSecond++;
        scoreTimelineHistory.push({ second: lastScoreTimelineSecond, scores: {} });
    }
    
    // Atualiza pontuação média de cada combatente (incluindo jogo atual)
    combatants.forEach(combatant => {
        if (!scoreTimelineHistory[currentTime]) {
            scoreTimelineHistory[currentTime] = { second: currentTime, scores: {} };
        }
        // Usa a média calculada (inclui jogo atual)
        scoreTimelineHistory[currentTime].scores[combatant.name] = calculateAverageScore(combatant);
    });
    
    // Prepara dados para o gráfico
    const labels = scoreTimelineHistory.map(h => h.second.toString());
    const datasets = [];
    
    // Cria um dataset para cada combatente
    combatants.forEach((combatant, index) => {
        const data = scoreTimelineHistory.map(h => h.scores[combatant.name] || 0);
        datasets.push({
            label: combatant.name,
            data: data,
            borderColor: combatant.color,
            backgroundColor: combatant.color + '40',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 1,
            pointStyle: false
        });
    });
    
    scoreTimelineChart.data.labels = labels;
    scoreTimelineChart.data.datasets = datasets;
    scoreTimelineChart.update('none');
}

// Alterna entre abas do ranking
function switchRankingTab(tabType) {
    currentRankingTab = tabType;
    
    // Atualiza visual das abas
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        }
    });
    
    // Atualiza gráfico
    if (combatants.length > 0) {
        const sorted = [...combatants].sort((a, b) => {
            if (a.reached2048 && !b.reached2048) return -1;
            if (!a.reached2048 && b.reached2048) return 1;
            
            if (tabType === 'score') {
                return b.averageScore - a.averageScore;
            } else if (tabType === 'tile') {
                return (b.bestMaxTile || 0) - (a.bestMaxTile || 0);
            } else if (tabType === 'games') {
                // Ordena do maior para o menor número de jogos
                return (b.gamesPlayed || 0) - (a.gamesPlayed || 0);
            }
            return 0;
        });
        updateRankingChart(sorted);
    }
}

// Atualiza gráfico de ranking baseado na aba atual
function updateRankingChart(sorted) {
    if (!rankingChart) return;
    
    // Reordena baseado na aba atual antes de atualizar o gráfico
    let sortedForChart = [...sorted];
    if (currentRankingTab === 'score') {
        sortedForChart.sort((a, b) => {
            if (a.reached2048 && !b.reached2048) return -1;
            if (!a.reached2048 && b.reached2048) return 1;
            return b.averageScore - a.averageScore;
        });
    } else if (currentRankingTab === 'tile') {
        sortedForChart.sort((a, b) => {
            if (a.reached2048 && !b.reached2048) return -1;
            if (!a.reached2048 && b.reached2048) return 1;
            return (b.bestMaxTile || 0) - (a.bestMaxTile || 0);
        });
    } else if (currentRankingTab === 'games') {
        sortedForChart.sort((a, b) => {
            if (a.reached2048 && !b.reached2048) return -1;
            if (!a.reached2048 && b.reached2048) return 1;
            // Ordena do maior para o menor número de jogos
            return (b.gamesPlayed || 0) - (a.gamesPlayed || 0);
        });
    }
    
    const labels = sortedForChart.map(c => {
        const iconClass = agentIcons[c.agentType] || 'fa-user';
        return `${String.fromCharCode(0x200B)} ${c.name}`;
    });
    
    let data = [];
    let labelText = '';
    
    if (currentRankingTab === 'score') {
        data = sortedForChart.map(c => c.averageScore || 0);
        labelText = 'Pontuação Média';
    } else if (currentRankingTab === 'tile') {
        data = sortedForChart.map(c => c.bestMaxTile || 0);
        labelText = 'Maior Peça';
    } else if (currentRankingTab === 'games') {
        data = sortedForChart.map(c => c.gamesPlayed || 0);
        labelText = 'Jogos Finalizados';
    }
    
    rankingChart.data.labels = labels;
    rankingChart.data.datasets[0].data = data;
    
    // Atualiza formatter do datalabels
    rankingChart.data.datasets[0].datalabels.formatter = function(value) {
        if (currentRankingTab === 'tile') {
            return value > 0 ? value : '';
        }
        return Math.round(value);
    };
    
    // Atualiza cores das barras
    rankingChart.data.datasets[0].backgroundColor = sortedForChart.map(c => c.color + '80');
    rankingChart.data.datasets[0].borderColor = sortedForChart.map(c => c.color);
    
    // Atualiza tooltip
    rankingChart.options.plugins.tooltip.callbacks.label = function(context) {
        if (!context.parsed || context.parsed.x === undefined) {
            if (currentRankingTab === 'score') return 'Pontuação: 0';
            if (currentRankingTab === 'tile') return 'Maior Peça: 0';
            if (currentRankingTab === 'games') return 'Jogos: 0';
        }
        if (currentRankingTab === 'score') {
            return `Pontuação: ${context.parsed.x}`;
        } else if (currentRankingTab === 'tile') {
            return `Maior Peça: ${context.parsed.x}`;
        } else if (currentRankingTab === 'games') {
            return `Jogos: ${context.parsed.x}`;
        }
        return `${labelText}: ${context.parsed.x}`;
    };
    
    rankingChart.update('none');
}

// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


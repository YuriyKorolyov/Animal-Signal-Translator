const state = {
  knowledge: null,
  selectedSpecies: "dog"
};

const examples = {
  dog: "Собака стоит у двери, лает низко и громко после звонка. Тело напряжено, смотрит на незнакомца.",
  cat: "Кошка подходит к человеку с поднятым хвостом, мягко мяукает и трется о ногу около миски.",
  bee: "Пчела вернулась в улей и делает танец восьмеркой: виляющая фаза около 1 секунды, угол 40 градусов, после контакта с нектаром.",
  chicken: "Курица резко кричит, смотрит вверх и бежит к укрытию, когда над двором пролетает крупная птица."
};

const sourceMap = () => new Map(state.knowledge.sources.map((source) => [source.id, source]));

function normalize(text) {
  return text.toLowerCase().replaceAll("ё", "е");
}

function scoreRule(rule, text, filledFields) {
  const normalized = normalize(text);
  const matches = rule.keywords.filter((keyword) => normalized.includes(normalize(keyword)));
  const hasRequired = !rule.requiresAny?.length || rule.requiresAny.some((keyword) => normalized.includes(normalize(keyword)));
  if (!hasRequired && matches.length < 2) {
    return null;
  }

  const keywordScore = Math.min(matches.length / Math.max(rule.keywords.length, 1), 1);
  const completeness = filledFields / 4;
  const confidence = Math.min(0.92, rule.confidenceBase + keywordScore * 0.2 + completeness * 0.08);

  return {
    rule,
    matches,
    confidence
  };
}

function fallback(species, filledFields) {
  const base = Math.max(0.18, 0.34 + filledFields * 0.04);
  return {
    rule: {
      id: `${species.id}-uncertain`,
      translation: "Недостаточно данных для надежного перевода. Система видит отдельные признаки, но не связывает их с устойчивым правилом.",
      evidence: "Для честной интерпретации нужны более конкретные признаки: ситуация, повторяемость, поза тела, акустика или параметры движения.",
      alternatives: [
        "Сигнал может быть реакцией на контекст, который не описан во вводе",
        "Наблюдение может относиться к стрессу, игре, поиску ресурса или обычному исследованию среды"
      ],
      sourceIds: species.rules.flatMap((rule) => rule.sourceIds).slice(0, 3)
    },
    matches: [],
    confidence: base
  };
}

function translateSignal(formData) {
  const species = state.knowledge.species.find((item) => item.id === formData.species);
  const allText = [formData.behavior, formData.sound, formData.context, formData.parameters].join(" ");
  const filledFields = [formData.behavior, formData.sound, formData.context, formData.parameters].filter((value) => value.trim()).length;
  const scored = species.rules
    .map((rule) => scoreRule(rule, allText, filledFields))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0] || fallback(species, filledFields);
  const alternatives = scored.slice(1, 3).map((item) => item.rule.translation).concat(best.rule.alternatives).slice(0, 3);

  return {
    species,
    best,
    alternatives,
    completeness: filledFields / 4
  };
}

function confidenceLabel(value) {
  if (value >= 0.75) return "высокая";
  if (value >= 0.5) return "средняя";
  return "низкая";
}

function renderSpeciesTabs() {
  const tabs = document.querySelector("#speciesTabs");
  tabs.innerHTML = state.knowledge.species.map((species) => `
    <button class="species-tab ${species.id === state.selectedSpecies ? "is-active" : ""}" data-species="${species.id}" type="button">
      <span>${species.name}</span>
      <small>${species.latin}</small>
    </button>
  `).join("");
}

function renderKnowledge() {
  const species = state.knowledge.species.find((item) => item.id === state.selectedSpecies);
  const sources = sourceMap();
  document.querySelector("#speciesSummary").textContent = species.summary;
  document.querySelector("#knowledgeList").innerHTML = species.rules.map((rule) => `
    <article class="rule-card">
      <h3>${rule.translation}</h3>
      <p>${rule.evidence}</p>
      <div class="chips">${rule.keywords.slice(0, 6).map((keyword) => `<span>${keyword}</span>`).join("")}</div>
      <footer>${rule.sourceIds.map((id) => {
        const source = sources.get(id);
        return `<a href="${source.url}" target="_blank" rel="noreferrer">${source.authors}, ${source.year}</a>`;
      }).join("")}</footer>
    </article>
  `).join("");
}

function renderResult(result) {
  const { species, best, alternatives, completeness } = result;
  const sources = sourceMap();
  const percent = Math.round(best.confidence * 100);
  document.querySelector("#resultEmpty").hidden = true;
  document.querySelector("#resultContent").hidden = false;
  document.querySelector("#resultTitle").textContent = best.rule.translation;
  document.querySelector("#resultMeta").textContent = `${species.name}: уверенность ${confidenceLabel(best.confidence)} (${percent}%).`;
  document.querySelector("#confidenceFill").style.width = `${percent}%`;
  document.querySelector("#confidenceValue").textContent = `${percent}%`;
  document.querySelector("#explanation").textContent = best.rule.evidence;
  document.querySelector("#matchedSignals").innerHTML = best.matches.length
    ? best.matches.map((match) => `<span>${match}</span>`).join("")
    : "<span>нет устойчивых совпадений</span>";
  document.querySelector("#alternatives").innerHTML = alternatives.map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#sourceLinks").innerHTML = best.rule.sourceIds.map((id) => {
    const source = sources.get(id);
    return `<a href="${source.url}" target="_blank" rel="noreferrer">${source.title}<small>${source.authors}, ${source.year}</small></a>`;
  }).join("");
  document.querySelector("#honestyNote").textContent = completeness < 0.5
    ? "Ввод неполный, поэтому оценка снижена. Добавьте контекст, позу/движение и акустические параметры."
    : "Это вероятностная интерпретация, а не доказанный перевод мысли животного.";
}

function collectForm() {
  return {
    species: document.querySelector("#species").value,
    behavior: document.querySelector("#behavior").value,
    sound: document.querySelector("#sound").value,
    context: document.querySelector("#context").value,
    parameters: document.querySelector("#parameters").value
  };
}

function syncSpecies(speciesId) {
  state.selectedSpecies = speciesId;
  document.querySelector("#species").value = speciesId;
  document.querySelector("#behavior").placeholder = examples[speciesId];
  renderSpeciesTabs();
  renderKnowledge();
}

async function init() {
  const response = await fetch("./data/knowledge-base.json");
  state.knowledge = await response.json();

  document.querySelector("#species").innerHTML = state.knowledge.species.map((species) => (
    `<option value="${species.id}">${species.name}</option>`
  )).join("");

  renderSpeciesTabs();
  renderKnowledge();
  syncSpecies("dog");

  document.querySelector("#species").addEventListener("change", (event) => syncSpecies(event.target.value));
  document.querySelector("#speciesTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-species]");
    if (button) syncSpecies(button.dataset.species);
  });
  document.querySelector("#exampleButton").addEventListener("click", () => {
    fillExample();
  });
  document.querySelector("#translatorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult(translateSignal(collectForm()));
  });

  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    syncSpecies("bee");
    fillExample();
    renderResult(translateSignal(collectForm()));
  }
}

function fillExample() {
  document.querySelector("#behavior").value = examples[state.selectedSpecies];
  if (state.selectedSpecies === "bee") {
    document.querySelector("#sound").value = "Виляющая фаза, повторяется несколько раз.";
    document.querySelector("#context").value = "Возврат в улей после найденного ресурса.";
    document.querySelector("#parameters").value = "Угол 40 градусов, длительность около 1 секунды.";
    return;
  }
  if (state.selectedSpecies === "chicken") {
    document.querySelector("#sound").value = "Резкий тревожный крик, серия коротких сигналов.";
    document.querySelector("#context").value = "Во дворе сверху пролетает ястреб или другая крупная птица.";
    document.querySelector("#parameters").value = "Птица смотрит вверх, приседает и бежит к укрытию.";
    return;
  }
  document.querySelector("#sound").value = "Повторяющийся сигнал, средняя громкость.";
  document.querySelector("#context").value = "Контакт с человеком рядом с привычным местом.";
  document.querySelector("#parameters").value = "Сигнал повторяется сериями по 2-4 раза.";
}

init().catch((error) => {
  document.querySelector("#resultEmpty").textContent = `Не удалось загрузить базу знаний: ${error.message}`;
});

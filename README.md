# Animal Signal Translator 🐱🐶🐝🐔

## 🌐 Демо
Посмотреть работающий прототип можно здесь:  
**[Animal Signal Translator](https://YuriyKorolyov.github.io/Animal-Signal-Translator/)**

Прототип приложения, которое пытается переводить сигналы животных на человеческий язык. Это не генератор случайных фраз: результат строится на небольшой структурированной базе знаний, правилах сопоставления признаков и явном расчете уверенности.

## Как запустить

Нужен Node.js, потому что браузер должен загрузить `data/knowledge-base.json` через локальный сервер.

```bash
npm start
```

Затем открыть `http://localhost:4173`.

## Что реализовано

- 4 вида: домашняя собака, домашняя кошка, медоносная пчела, домашняя курица.
- Форма ввода: поведение, звук, контекст и параметры.
- Вероятный перевод сигнала.
- Уверенность в процентах.
- Альтернативные трактовки.
- Объяснение, какие признаки сработали.
- Ссылки на источники для каждого вывода.
- Структурированная база знаний в `data/knowledge-base.json`.

## Как устроена база знаний

База знаний хранится в JSON и содержит:

- `species`: список видов;
- `rules`: правила перевода для каждого вида;
- `keywords`: признаки, которые ищутся во вводе;
- `requiresAny`: ключевые признаки, без которых правило не считается надежным;
- `confidenceBase`: базовая уверенность правила;
- `evidence`: короткое объяснение;
- `alternatives`: альтернативные трактовки;
- `sourceIds`: ссылки на использованные источники;
- `sources`: библиографические записи и URL.

## Как работает логика перевода

1. Пользователь выбирает вид и описывает сигнал.
2. Приложение объединяет поля ввода в один текст.
3. Для выбранного вида проверяются только его правила.
4. Каждое правило получает баллы за найденные признаки.
5. Если обязательные признаки отсутствуют и совпадений мало, правило отбрасывается.
6. Побеждает правило с максимальной уверенностью.
7. Если подходящего правила нет, приложение честно сообщает, что данных мало.

Логика отличается по видам:

- у собак сильнее учитываются контекст лая, грубость/высота звука и ситуация;
- у кошек важны поза, хвост, уши, тип вокализации и контакт с человеком;
- у пчел важны форма танца, длительность виляющей фазы, угол и близость ресурса;
- у куриц важны пищевые calls/tidbitting, тип тревожного крика и направление предполагаемой угрозы.

## Как считается уверенность

Формула в прототипе:

```text
confidence = confidenceBase + доля найденных признаков * 0.20 + полнота ввода * 0.08
```

Значение ограничено максимумом `92%`, потому что приложение не должно выдавать вероятностную интерпретацию за научный факт. Если заполнено меньше половины полей, интерфейс дополнительно предупреждает, что оценка снижена из-за неполного наблюдения.

## Использованные источники

- Pongracz et al., 2004. "Barking in domestic dogs: context specificity and individual identification". Animal Behaviour. https://doi.org/10.1016/j.anbehav.2003.07.016
- Pongracz et al., 2014. "More than noise? Field investigations of intraspecific acoustic communication in dogs". Applied Animal Behaviour Science. https://doi.org/10.1016/j.applanim.2014.08.003
- Library of Congress. "How do cats communicate with each other?" https://www.loc.gov/item/how-do-cats-communicate-with-each-other/
- Schotz et al., 2016. "Meowsic: Acoustic analysis of cat vocalisations". Lund University. https://portal.research.lu.se/en/publications/meowsic-acoustic-analysis-of-cat-vocalisations
- Riley et al., 2005. "The flight paths of honeybees recruited by the waggle dance". Nature. https://www.nature.com/articles/nature03526
- Couvillon et al., 2015. "The spatial information content of the honey bee waggle dance". Frontiers in Ecology and Evolution. https://www.frontiersin.org/articles/10.3389/fevo.2015.00022/full
- Couvillon et al., 2008. "Do honeybees have two discrete dances to advertise food sources?" Animal Behaviour. https://doi.org/10.1016/j.anbehav.2008.01.032
- NC State Extension. "The Honey Bee Dance Language". https://content.ces.ncsu.edu/honey-bee-dance-language
- Marler et al., 1986. "Vocal communication in the domestic chicken: I. Does a sender communicate information about the quality of a food referent to a receiver?" Animal Behaviour. https://doi.org/10.1016/0003-3472(86)90022-9
- Evans and Evans, 1999. "Chicken food calls are functionally referential". Animal Behaviour. https://doi.org/10.1006/anbe.1999.1143
- Evans et al., 1993. "On the meaning of alarm calls: functional reference in an avian vocal system". Animal Behaviour. https://doi.org/10.1006/anbe.1993.1158
- Marino, 2017. "Thinking chickens: a review of cognition, emotion, and behavior in the domestic chicken". Animal Cognition. https://pmc.ncbi.nlm.nih.gov/articles/PMC5306232/

## Что использовано из AI

AI использован для проектирования прототипа, формулировки правил, структуры базы знаний, интерфейса и README. Внешние AI API в рантайме не используются: приложение работает локально и детерминированно.

## Ограничения

Приложение не распознает аудио или видео напрямую. Оно принимает текстовое описание наблюдения и делает объяснимую вероятностную интерпретацию. Для реального продукта следующим шагом были бы распознавание аудиопризнаков, датасет размеченных наблюдений и валидация правил с экспертами.

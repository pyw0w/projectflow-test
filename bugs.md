# bugs.md — найденные и исправленные ошибки + все проверки

Журнал качества проекта «GitHub Repo Search (pyw0w)». Каждый пункт: что
проверялось, что нашли, как исправили (или не нашли).

## 1. Найденные и исправленные баги

### Баг #1 — блокер: дублирующийся экспорт в MSW-сервере тестов
- **Где:** `src/test/mswServer.js`
- **Симптом:** линтер выдавал `L29: Duplicated export 'server'` — файл
  экспортировал `server` дважды (`export const server = …` и `export { server }`).
- **Причина:** ошибка при быстром наборе тестовой инфраструктуры.
- **Исправление:** лишний `export { server }` удалён.

### Баг #2 — блокер: неиспользуемая переменная `perPage` в тестовом хендлере
- **Где:** `src/test/mswServer.js`
- **Симптом:** линтер `no-unused-vars` блокировал запуск.
- **Причина:** переменная объявлена «на будущее» и нигде не применялась.
- **Исправление:** строка удалена.

### Баг #3 — серьёзный: все 40 тестов падали — `localStorage` недоступен в jsdom
- **Где:** `src/test/setup.js`, окружение Vitest
- **Симптом:** `npm test` → 11 файлов, 40/40 failed:
  `Cannot read properties of undefined (reading 'clear'/'setItem')`;
  в логе `ExperimentalWarning: localStorage is not available because
  --localstorage-file was not provided`.
- **Причина:** Node 26 предоставляет экспериментальный геттер
  `globalThis.localStorage` (и такой же у `window`), который возвращает
  `undefined` без флага `--localstorage-file` — он перекрывает storage jsdom.
- **Исправление:** в `setup.js` добавлен `installLocalStorage()`: если у
  `window.localStorage` нет рабочего `getItem`, ставится минимальный
  in-memory-шим (`Map` + `getItem/setItem/removeItem/clear/key/length`).
- **Проверка:** после фикса `npm test` → 40/40 passed.

### Баг #4 — тестовый: `RepoCard.test` проверял неверный `href`
- **Где:** `src/components/RepoCard.test.jsx`, фабрика `makeRepo`
- **Симптом:** `toHaveAttribute('href', 'https://github.com/pyw0w/my-repo')`
  падал — фабрика возвращала захардкоженный `html_url` независимо от `name`.
- **Причина:** `html_url` был зафиксирован в дефолте фабрики.
- **Исправление:** `makeRepo` теперь вычисляет `html_url` из `name`, если он
  не передан явно.

### Баг #5 — тестовый: двойной учёт `listitem` в `RepoList.test`
- **Где:** `src/components/RepoList.test.jsx`
- **Симптом:** ожидалось 3 `listitem`, получалось 6.
- **Причина:** `getAllByRole('listitem')` считал и `<li>` карточек, и `<li>`
  topics внутри карточек.
- **Исправление:** проверка переписана на контейнер: `getByRole('list',
  { name: 'Repositories' }).children`.

### Баг #6 — тестовый: неверный селектор языковой точки
- **Где:** `src/components/RepoCard.test.jsx`
- **Симптом:** `dot.style.backgroundColor` был пустым.
- **Причина:** `querySelector('span')` вызывался у `parentElement`, где первым
  span оказывался не цветной индикатор.
- **Исправление:** `querySelector('span')` вызывается у элемента языка.

### Баг #9 — блокер CI: первый деплой падал с `exit code 128`
- **Где:** `.github/workflows/deploy.yml`, шаг «Deploy dist to web branch»
- **Симптом** (лог Actions):

  ```text
  Run set -euo pipefail
  fatal: couldn't find remote ref web
  fatal: not a git repository (or any of the parent directories): .git
  Error: Process completed with exit code 128.
  ```
- **Причина:** при первом запуске ветки `web` ещё нет → `git fetch origin web`
  проваливается и `FETCH_HEAD` не создаётся; `git worktree add -B web FETCH_HEAD`
  тоже падает, и фолбэк `(cd "$workdir" && git checkout --orphan web)`
  выполнялся в обычном `mktemp`-каталоге без репозитория → «not a git repository».
- **Исправление:** явная ветка по результату fetch:
  `git fetch origin web 2>/dev/null` → если успех: `worktree add -B web FETCH_HEAD`;
  если нет: `worktree add --detach` + `git -C <worktree> switch --orphan web`.
  Заодно убрана awk-чистка worktree (в CI раннер свежий, она только ломала YAML).
- **Проверка:** скрипт шага, извлечённый из YAML, прогнан локально на
  bare-репозитории — 3 сценария PASS: первый деплой (создание `web`),
  повторный (обновление ветки), без изменений («No changes to deploy»).
- **Ещё в этом же коммите:** yamllint-ошибки line-length (>80) устранены,
  YAML валиден (`js-yaml` parses OK).

### Наблюдение #7 (не баг, ограничение инструмента)
- `scripts/manual-check.mjs` помечен knip как «unused file» — это ожидаемо:
  скрипт dev-only и не импортируется из приложения. Запускается вручную:
  `node scripts/manual-check.mjs`.

### Наблюдение #8 — markdownlint в README (исправлено)
- `MD034` bare URL в строке Live → обёрнут в `<…>`;
- `MD040` fenced code block без языка (ASCII-мокап UI) → указан `text`.

## 2. Все проверки

### 2.1 Автотесты — `npm test` (Vitest + RTL + MSW)

MSW запущен с `onUnhandledRequest: 'error'` — **любой реальный сетевой вызов
в тесте валит тест**. Итог: **11 файлов, 40/40 passed**.

Слой API:
| # | Проверка | Файл |
|---|---|---|
| 1 | Успешный fetch + заголовки rate limit (`remaining`, `reset`) | `src/api/githubApi.test.js` |
| 2 | Запрос идёт на `/users/pyw0w/repos` c `per_page=100`, `page=1` | там же |
| 3 | Пагинация: полная страница → второй запрос; короткая страница → стоп (100+1 кейс) | там же |
| 4 | 403 с `X-RateLimit-Remaining: 0` → `GitHubApiError`, `status=403`, `rateLimitRemaining=0`, текст про rate limit | там же |
| 5 | 500 от сервера → `GitHubApiError`, `status=500` | там же |
| 6 | Сетевой сбой fetch → `GitHubApiError`, `status=0` | там же |
| 7 | Кэш: запись/чтение с меткой времени | `src/api/cache.test.js` |
| 8 | Кэш: отсутствует → null | там же |
| 9 | Кэш: битый JSON → null | там же |
| 10 | Кэш: неверная форма → null | там же |
| 11 | Кэш: `clearCache` удаляет запись | там же |

Хук `useRepos`:
| # | Проверка | Файл |
|---|---|---|
| 12 | Монтирование: `loading → ready`, кэш записан | `src/hooks/useRepos.test.js` |
| 13 | Cache-first: мгновенно из кэша, `isRefreshing=true`, фоновое обновление заменяет список | там же |
| 14 | API упал + есть кэш → остаётся `ready` + объект ошибки (мягкая деградация) | там же |
| 15 | API упал + кэша нет → `status='error'` | там же |
| 16 | `refresh()` перезапрашивает и обновляет rate limit | там же |
| 17 | Исчерпание лимита 403 → ошибка + `rateLimit.remaining=0` | там же |

Компоненты:
| # | Проверка | Файл |
|---|---|---|
| 18 | `SearchBar`: контролируемое значение | `SearchBar.test.jsx` |
| 19 | `SearchBar`: `onChange` на каждый ввод | там же |
| 20 | `SearchBar`: кнопка очистки только при запросе, очищает | там же |
| 21 | `RepoCard`: имя — внешняя ссылка (`target=_blank`, `rel` noopener) | `RepoCard.test.jsx` |
| 22 | `RepoCard`: описание, язык, звёзды, дата обновления | там же |
| 23 | `RepoCard`: язык маппится на GitHub-цвет | там же |
| 24 | `RepoCard`: нет описания/языка — не ломается | там же |
| 25 | `RepoCard`: topics — максимум 5 чипов | там же |
| 26 | `RepoCard`: бейдж Private | там же |
| 27 | `RepoList`: карточка на репозиторий | `RepoList.test.jsx` |
| 28 | `RepoList`: пустой список → пусто | там же |
| 29 | `EmptyState`: эхо запроса в сообщении | `EmptyState.test.jsx` |
| 30 | `EmptyState`: без запроса — общая подсказка | там же |
| 31 | `ErrorState`: общая ошибка + кнопка retry вызывается | `ErrorState.test.jsx` |
| 32 | `ErrorState`: формулировка rate limit + время сброса для 403 | там же |
| 33 | `ErrorState`: без объекта ошибки есть fallback-текст (не белый экран) | там же |
| 34 | `SortControl`: все опции, выбранное значение | `SortControl.test.jsx` |
| 35 | `SortControl`: emits новый ключ сортировки | там же |
| 36 | `Skeleton`: N плейсхолдеров, нет реального контента/ссылок | `Skeleton.test.jsx` |
| 37 | `RateLimitBadge`: скрыт без данных | `RateLimitBadge.test.jsx` |
| 38 | `RateLimitBadge`: показывает квоту | там же |
| 39 | `RateLimitBadge`: `low` при ≤10 | там же |
| 40 | `RateLimitBadge`: `critical` при 0 | там же |

### 2.2 Ручная проверка — `npm run build`

- [x] `npm run build` без ошибок; `dist/index.html` ссылается на
      `/projectflow-test/assets/*` (корректный base path для GitHub Pages).
- [x] `npx oxlint src/` — 0 ошибок.
- [x] YAML `.github/workflows/deploy.yml` парсится; содержит
      checkout → `npm ci` → `npm test` → `npm run build` → push в `web`.

### 2.3 Ручная проверка UI — `scripts/manual-check.mjs` (headless Chromium)

**20/20 PASS** на 375×700 и 1280×900:

- [x] поиск/кнопка обновления не перекрываются (оба вьюпорта)
- [x] поиск/сортировка не перекрываются
- [x] все элементы тулбара внутри вьюпорта
- [x] тулбар `flex-direction: column` <420px, `row` на десктопе
- [x] safe-area padding верхний > 0
- [x] **0 обращений к API при вводе** (живой фильтр на клиенте)
- [x] фильтр + пустое состояние <1000ms (72–99ms)
- [x] пустое состояние показывается при отсутствии совпадений
- [x] очистка запроса восстанавливает полный список (38→38)
- [x] карточка содержит внешнюю ссылку

### 2.4 Сценарии, проверенные вручную в ходе разработки

- [x] Загрузка: skeleton при холодном старте → список.
- [x] Повторный заход: рендер из кэша мгновенно + тихое фоновое обновление
      (покрыто тестом №13).
- [x] Ошибка API: ErrorState с сообщением и retry (тесты №15, 31–33).
- [x] Rate limit: мягкая деградация — кэш остаётся, баннер + бейдж (тесты №14, 17, 37–40).
- [x] Сортировка: по дате/звёздам/названию (тесты №34–35).
- [x] Адаптив 375px / десктоп (2.3).
- [x] Светлая/тёмная тема: `prefers-color-scheme`, токены в `tokens.css`.

## 3. Известные ограничения (не баги)

- Анонимный rate limit GitHub 60/час — UI показывает остаток, но поднять его
  без токена нельзя (токены в статике запрещены условием задачи).
- Нет бэкенда; приватные репозитории не запрашиваются.
- E2E/визуальные тесты не запускаются в CI (нужна локальная установка Playwright).
- `vite.config.js` хардкодит `base: '/projectflow-test/'` — при переименовании
  репозитория править здесь.

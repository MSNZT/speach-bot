## 🚀 Установка проекта

### 1. Клонируй репозиторий

```bash
git clone <URL_репозитория>
```

### 2. Установи зависимости

```bash
cd <имя_папки_проекта>
npm install
```

### 3. Создай файл с переменными окружения

- Создай файл `.env` в корне проекта.
- Скопируй содержимое из `.env.example` в твой `.env`.

### 4. Получи токен Telegram-бота

- Создай бота через [@BotFather](https://t.me/BotFather) в Telegram.
- Скопируй выданный тебе токен.
- Вставь токен в файл `.env`:
  ```
  BOT_TOKEN=токен_от_BotFather
  ```

---

## 🤖 Установка AI-модуля (whisper.cpp)

### 1. Создай папку для моделей

```bash
mkdir models
cd models
```

### 2. Клонируй whisper.cpp

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
```

### 3. Собери whisper.cpp

#### Для Windows через MSYS2/MinGW

1. Установи [MSYS2](https://www.msys2.org/).
2. Открой MSYS2 MinGW 64-bit терминал.
3. Выполни по очереди:
   ```bash
   pacman -Syu
   pacman -S git make mingw-w64-x86_64-gcc
   cd путь_к_папке/whisper.cpp
   make
   ```
4. После сборки в папке whisper.cpp появится файл `main.exe`.

### 4. Скачай модель для распознавания речи

- В MSYS2 внутри папки whisper.cpp выполни:
  ```bash
  bash models/download-ggml-model.sh medium
  ```
- В папке `models` появится, например, файл `ggml-medium.bin`.

---

## ▶️ Запусти проект

- Перейди в корень проекта и запусти сервер:

  ```bash
  npm run start:dev
  ```

- Перейди к своему боту в Telegram и попробуй отправить голосовое сообщение.

---

# Доступные модели для whisper.cpp

Whisper.cpp поддерживает несколько моделей разного размера и точности.  
Чем больше модель — тем выше качество распознавания, но больше требуется ресурсов и дольше работает.

| Название                 | Размер файла | Память (RAM) | Языки        | Качество       | Скорость     | Команда для скачивания                        |
| ------------------------ | ------------ | ------------ | ------------ | -------------- | ------------ | --------------------------------------------- |
| tiny                     | ~75 MB       | ~390 MB      | Многоязычная | Низкое         | Очень быстро | `bash models/download-ggml-model.sh tiny`     |
| base                     | ~142 MB      | ~500 MB      | Многоязычная | Среднее-низкое | Быстро       | `bash models/download-ggml-model.sh base`     |
| small                    | ~466 MB      | ~900 MB      | Многоязычная | Среднее        | Средне       | `bash models/download-ggml-model.sh small`    |
| medium                   | ~1.5 GB      | ~1.6 GB      | Многоязычная | Высокое        | Медленно     | `bash models/download-ggml-model.sh medium`   |
| large-v1                 | ~2.9 GB      | ~3.1 GB      | Многоязычная | Очень высокое  | Медленно     | `bash models/download-ggml-model.sh large`    |
| large-v2                 | ~2.9 GB      | ~3.1 GB      | Многоязычная | Очень высокое  | Медленно     | `bash models/download-ggml-model.sh large-v2` |
| large-v3 (рекомендуется) | ~2.9 GB      | ~3.1 GB      | Многоязычная | Наилучшее      | Медленно     | `bash models/download-ggml-model.sh large-v3` |

### Замена модели

- Если хочешь использовать другую модель, просто повтори шаг 4 из раздела "Установка AI-модуля (whisper.cpp)"
- Затем меняешь в .env
  - AI_MODEL_NAME=ggml-medium.bin (было)
  - AI_MODEL_NAME=ggml-large.bin (стало)

---

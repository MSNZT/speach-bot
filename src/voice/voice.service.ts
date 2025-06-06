import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// Использовал require из-за проблем при использовании import
const ffmpegStatic = require("ffmpeg-static");

@Injectable()
export class VoiceService {
  private logger = new Logger(VoiceService.name);

  constructor(private config: ConfigService) {}

  private get audioDir() {
    return path.resolve(process.cwd(), this.config.get("AUDIO_DIR", "voices"));
  }
  private get whisperDir() {
    return path.resolve(
      process.cwd(),
      this.config.get("WHISPER_DIR", "models/whisper.cpp"),
    );
  }
  private get modelDir() {
    return path.resolve(
      process.cwd(),
      this.config.get("WHISPER_MODEL_DIR", "models/whisper.cpp/models"),
    );
  }
  private get modelName() {
    return this.config.get<string>("AI_MODEL_NAME", "ggml-medium.bin");
  }
  private get lang() {
    return this.config.get<string>("WHISPER_LANG", "ru");
  }

  async convertToText(fileId: string): Promise<string> {
    const oggPath = path.join(this.audioDir, `${fileId}.ogg`);
    const wavPath = path.join(this.audioDir, `${fileId}.wav`);

    try {
      await convertOggToWav(oggPath, wavPath);

      await whisperTranscribe(
        wavPath,
        path.join(
          this.whisperDir,
          "build",
          "bin",
          process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli",
        ),
        path.join(this.modelDir, this.modelName),
        this.lang,
      );

      const outputTxtPath = findOutputTxtPath(wavPath);

      if (!outputTxtPath) {
        const files = fs.readdirSync(this.audioDir);
        this.logger.error("Не найден текстовый файл. Файлы в папке:", files);
        return "Ошибка: не найден текстовый файл с результатом";
      }

      const result = fs.readFileSync(outputTxtPath, "utf-8").trim();

      if (result.length === 0) {
        return "Не удалось распознать речь";
      } else if (result.length > 4096) {
        return `__LONG_TEXT__::${outputTxtPath}`;
      } else {
        return result;
      }
    } catch (err) {
      this.logger.error(err);
      return "Ошибка при обработке аудио";
    }
  }
}

function convertOggToWav(oggPath: string, wavPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegStatic as string, [
      "-i",
      oggPath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      wavPath,
    ]);
    ffmpeg.on("close", (code) => {
      code === 0
        ? resolve()
        : reject(new Error("ffmpeg failed, code: " + code));
    });
    ffmpeg.on("error", reject);
  });
}

function whisperTranscribe(
  wavPath: string,
  cliPath: string,
  modelPath: string,
  lang: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let outputPath = wavPath.replace(/\.wav$/, ".txt");
    let altOutputPath = outputPath.endsWith(".txt.txt")
      ? outputPath
      : outputPath + ".txt";

    const args = [
      "-m",
      modelPath,
      "-f",
      wavPath,
      "-of",
      outputPath,
      "-otxt",
      "-l",
      lang,
    ];

    const whisper = spawn(cliPath, args);

    let stderr = "";
    whisper.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    whisper.on("close", (code) => {
      let actualOutputPath = fs.existsSync(outputPath)
        ? outputPath
        : fs.existsSync(altOutputPath)
          ? altOutputPath
          : null;

      if (actualOutputPath) {
        const text = fs.readFileSync(actualOutputPath, "utf-8").trim();
        if (text.length === 0 || /\[.*\]/.test(text)) {
          reject(new Error("Не удалось распознать речь или результат пустой"));
        } else {
          resolve(text);
        }
      } else {
        reject(new Error(`Whisper exited with code ${code}\n${stderr}`));
      }
    });
    whisper.on("error", reject);
  });
}

function findOutputTxtPath(wavPath: string): string | null {
  const base = wavPath.replace(/\.wav$/, "");
  const candidates = [base + ".txt", wavPath + ".txt", base + ".txt.txt"];
  for (const f of candidates) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

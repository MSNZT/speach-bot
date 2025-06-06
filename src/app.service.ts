import { Update, Ctx, On } from "nestjs-telegraf";
import { Context } from "telegraf";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "@nestjs/common";
import { VoiceService } from "./voice/voice.service";
import { ConfigService } from "@nestjs/config";

@Update()
export class AppService {
  private audioDir = path.resolve(__dirname, "..", "voices");
  private logger = new Logger(AppService.name);

  constructor(
    private voiceService: VoiceService,
    private configService: ConfigService,
  ) {
    this.audioDir = path.resolve(
      process.cwd(),
      this.configService.get("AUDIO_DIR", "voices"),
    );
  }

  @On("voice")
  async onVoice(@Ctx() ctx: Context) {
    const fileId = ctx.message?.["voice"]?.file_id;
    try {
      if (!fileId) {
        await ctx.reply("Не удалось получить файл");
        return;
      }
      const fileLink = await ctx.telegram.getFileLink(fileId);

      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
      }
      const oggPath = path.join(this.audioDir, `${fileId}.ogg`);

      const response = await axios.get(fileLink.href, {
        responseType: "stream",
      });
      const writer = fs.createWriteStream(oggPath);
      (response.data as NodeJS.ReadableStream).pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const resultResponse = await this.voiceService.convertToText(fileId);
      if (resultResponse.startsWith("__LONG_TEXT__::")) {
        const filePath = resultResponse.replace("__LONG_TEXT__::", "");
        await ctx.replyWithDocument({
          source: filePath,
          filename: "result.txt",
        });
        await ctx.reply("Результат длинный — отправил как файл.");
      } else {
        await ctx.reply(resultResponse);
      }
    } catch (e: any) {
      await ctx.reply("Не удалось распознать сообщение");
      console.error("Ошибка:", e);
    } finally {
      this.resetVoicesDir(this.audioDir, fileId);
    }
  }

  private async resetVoicesDir(dir: string, prefix: string) {
    try {
      const files = await fs.promises.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile() && file.startsWith(prefix)) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (err) {
      this.logger.error("Ошибка при удалении файлов из папки voices", err);
      throw err;
    }
  }
}

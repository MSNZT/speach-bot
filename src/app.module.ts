import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { VoiceModule } from "./voice/voice.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>("BOT_TOKEN"),
      }),
      inject: [ConfigService],
    }),
    VoiceModule,
  ],
  providers: [AppService],
})
export class AppModule {}

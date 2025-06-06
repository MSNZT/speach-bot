import { Module } from "@nestjs/common";
import { VoiceService } from "./voice.service";

@Module({
  imports: [],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}

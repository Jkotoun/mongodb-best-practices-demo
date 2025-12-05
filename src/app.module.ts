import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { mongooseConfigFactory } from './config/mongoose.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: mongooseConfigFactory,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: typeOrmConfig,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

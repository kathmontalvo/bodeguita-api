import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: typeOrmConfig,
    }),
    CqrsModule.forRoot(),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

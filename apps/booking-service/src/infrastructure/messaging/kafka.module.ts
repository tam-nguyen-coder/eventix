import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'KAFKA_CLIENT',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'booking-service',
                            brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
                        },
                        consumer: {
                            groupId: 'booking-consumer',
                        },
                    },
                }),
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class KafkaModule { }

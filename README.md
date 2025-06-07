# message-broker-lib

Biblioteca TypeScript para facilitar o envio e recebimento de mensagens em sistemas distribuídos, suportando Kafka e Amazon SQS com uma API unificada.

---

## Recursos

- Publicação e consumo de mensagens em Kafka
- Publicação e consumo de mensagens em Amazon SQS
- Controle de confirmação (ack/nack) de mensagens
- Suporte a headers customizados
- Estrutura modular e reutilizável para integração em diversos projetos

---

## Instalação

```bash
npm install my-message-broker-lib
```

## Exemplo de uso com Kafka
```typescript
import { KafkaPublisherSubscriber, handleNack } from 'my-message-broker-lib';

const kafka = new KafkaPublisherSubscriber(['localhost:9092']);

async function run() {
  // Consumir mensagens
  await kafka.subscribe(
    { destination: 'meu-topico', consumerGroup: 'meu-grupo' },
    async (msg, control) => {
      try {
        console.log('Mensagem recebida:', msg);
        await control.ack();
      } catch (error) {
        await handleNack(control, error);
      }
    },
  );

  // Publicar mensagem
  await kafka.publish(
    { destination: 'meu-topico', key: 'chave-1', headers: { origem: 'app' } },
    { texto: 'Olá Kafka!' },
  );
}

run();
```

## Exemplo de uso com Amazon SQS

```typescript
import { SqsPublisherSubscriber, handleNack } from 'my-message-broker-lib';

const sqs = new SqsPublisherSubscriber('us-east-1');

async function run() {
  // Consumir mensagens
  await sqs.subscribe(
    { destination: 'https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila' },
    async (msg, control) => {
      try {
        console.log('Mensagem SQS:', msg);
        await control.ack();
      } catch (error) {
        await handleNack(control, error);
      }
    },
  );

  // Publicar mensagem
  await sqs.publish(
    { destination: 'https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila' },
    { texto: 'Olá SQS!' },
  );
}

run();
```
## API

# Classes principais
 - KafkaPublisherSubscriber(brokers: string[])
   Construtor que recebe array de brokers Kafka.

 - SqsPublisherSubscriber(region: string)
   Construtor que recebe a região AWS.

## Métodos
 - publish(options: BrokerPublishOptions, message: any): Promise<void>
   Publica uma mensagem no destino configurado.

 - subscribe(options: BrokerSubscribeOptions, handler: (msg, control) =>     Promise<void>): Promise<void>
   Inscreve um consumidor para receber mensagens.

 - handleNack(control: MessageControl, error: Error): Promise<void>
   Função utilitária para lidar com falha no processamento de mensagem.



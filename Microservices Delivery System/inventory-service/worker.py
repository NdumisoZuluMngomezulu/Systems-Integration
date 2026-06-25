import os
import json
import time
import pika
from dotenv import load_dotenv

load_dotenv()

RabbitMQ_URL = os.getenv("RABBITMQ_URL", "am");
QUEUE_NAME = "order_queue";

def process_order(ch, method, properties, body):
    """This is the callback function triggered whenever a message arrives"""
    try:
        #deserielzing JSON payload accross languages
        order_data = json.loads(body.decode('utf-8'));
        print(f"\n[Inventory Service] Received Event for Order ID: {order_data['orderId']}");
        print(f"->Processing stock allocation for : {order_data['quantity']} x {order_data['item']}");

        time.sleep(2);
        print(f"[Inventory Service] Stock successfully allocated for Order ID: {order_data['orderId']}\n");

        #acknowledging message was safely process and remove it from queue
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True);
    
    except Exception as e:
        #reject message and put back in queue if process fails
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True);


def main():
    #parsing connection details
    url = pika.URLParameters(RabbitMQ_URL);
    connection = pika.BlockingConnection(url)
    channel = connection.channel();

    channel.queue_declare(queue=QUEUE_NAME, durable=True); #check that queue exists
    
    channel.basic_qos(prefetch_count=1); #don't giver a worker more than one message at a time

    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_order);

    print(" [*] Inventory Worker is running. Waiting for order events. Press CTRL+C to exit.");
    channel.start_consuming();

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Worker stopped.');

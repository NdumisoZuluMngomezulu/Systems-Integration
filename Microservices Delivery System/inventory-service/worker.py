import os
import json
import time
import pika
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://localhost")
QUEUE_NAME = "order_queue"

def process_order(ch, method, properties, body):
    """Callback function triggered whenever a message arrives."""
    try:
        # Deserialize JSON payload across languages
        order_data = json.loads(body.decode('utf-8'))
        print(f"\n[Inventory Service] Received event for Order ID: {order_data['orderId']}")
        print(f"-> Processing stock allocation for: {order_data['quantity']}x {order_data['item']}")
        
        # Simulate local database processing delay
        time.sleep(2) 
        print(f"[Inventory Service] Stock successfully allocated for Order ID: {order_data['orderId']}\n")
        
        # Acknowledge the message was safely processed (removes it from queue)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"Error processing message: {e}")
        # Reject message and put it back in queue if processing failed
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    # Parse connection details
    url_params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(url_params)
    channel = connection.channel()

    # Ensure queue exists
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    
    # Fair dispatch: Don't give a worker more than 1 message at a time
    channel.basic_qos(prefetch_count=1)
    
    # Link queue to processing callback
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_order)

    print(" [*] Inventory Worker is running. Waiting for order events. Press CTRL+C to exit.")
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Worker stopped.')

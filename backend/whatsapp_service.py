import os
import base64
import qrcode
from io import BytesIO
from neonize.client import NewClient
from neonize.events import ConnectedEv, MessageEv
from neonize.utils.jid import build_jid
import threading
import logging

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self, db_path=None):
        if db_path is None:
            base_dir = os.path.dirname(__file__)
            db_path = os.path.join(base_dir, "secrets", "whatsapp.db")
        self.db_path = db_path
        self.client = None
        self.qr_code = None
        self.is_connected = False
        self.thread = None
        self._stop_event = threading.Event()
        self.on_nokast_callback = None

    def _on_qr(self, client: NewClient, qr: str):
        logger.info("WhatsApp QR received")
        img = qrcode.make(qr)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        self.qr_code = base64.b64encode(buffered.getvalue()).decode()
        self.is_connected = False

    def _on_connected(self, client: NewClient, evt: ConnectedEv):
        logger.info("WhatsApp Connected ✅")
        self.is_connected = True
        self.qr_code = None

    def _on_message(self, client: NewClient, evt: MessageEv):
        # Handle !nokast command if needed
        text = evt.Message.conversation or ""
        if "!nokast" in text:
            # Safely extract sender JID which can vary by neonize version or chat type
            # 1. Try common top-level fields
            sender = getattr(evt.Info, "Sender", getattr(evt.Info, "sender", None))
            if not sender:
                sender = getattr(evt.Info, "Chat", getattr(evt.Info, "chat", None))
            
            # 2. Try MessageSource (attribute found in your logs)
            if not sender and hasattr(evt.Info, "MessageSource"):
                src = evt.Info.MessageSource
                # Inside MessageSource, look for Sender or Chat
                sender = getattr(src, "Sender", getattr(src, "sender", None))
                if not sender:
                    sender = getattr(src, "Chat", getattr(src, "chat", None))
            
            # 3. Try nested Source if still not found
            if not sender and hasattr(evt.Info, "Source"):
                sender = getattr(evt.Info.Source, "Sender", getattr(evt.Info.Source, "sender", None))
            
            if not sender:
                logger.error("Could not determine sender. Falling back to configured WHATSAPP_PHONE from .env")
                sender_jid = os.getenv("WHATSAPP_PHONE")
                if not sender_jid:
                    return
            else:
                # Get the phone number part accurately to avoid grabbing metadata zeros
                if hasattr(sender, "User"):
                    sender_jid = sender.User
                elif hasattr(sender, "String"):
                    sender_jid = sender.String().split("@")[0]
                else:
                    sender_jid = str(sender).split("@")[0]

            logger.info(f"Trigger Nokast job from {sender_jid}")
            
            if self.on_nokast_callback:
                self.on_nokast_callback(sender_jid)
            self.send_notification(sender_jid, "🚀 Starting Nokast job...")
            
            if self.on_nokast_callback:
                self.on_nokast_callback(sender_jid)
            self.send_notification(sender_jid, "🚀 Starting Nokast job...")

    def start(self):
        if self.thread and self.thread.is_alive():
            return

        def run_client():
            # Ensure secrets dir exists
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            self.client = NewClient(self.db_path)
            
            @self.client.qr
            def on_qr(client: NewClient, qr: bytes):
                self._on_qr(client, qr.decode())

            @self.client.event(ConnectedEv)
            def on_connected(client: NewClient, evt: ConnectedEv):
                self._on_connected(client, evt)
            
            @self.client.event(MessageEv)
            def on_message(client: NewClient, evt: MessageEv):
                self._on_message(client, evt)

            self.client.connect()

        self.thread = threading.Thread(target=run_client, daemon=True)
        self.thread.start()

    def send_notification(self, phone: str, message: str):
        if not self.is_connected or not self.client:
            logger.warning("WhatsApp not connected, cannot send notification")
            return
        
        # Extract just the phone number part (strip suffix and non-digits)
        clean_phone = phone.split("@")[0]
        clean_phone = "".join(filter(str.isdigit, clean_phone))
        
        try:
            # build_jid defaults server to 's.whatsapp.net'
            target_jid = build_jid(clean_phone)
            logger.info(f"Sending WhatsApp message to {clean_phone}@s.whatsapp.net")
            self.client.send_message(target_jid, message)
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {clean_phone}@s.whatsapp.net: {e}")

    def get_status(self):
        return {
            "connected": self.is_connected,
            "qr": self.qr_code
        }

# Singleton instance
whatsapp_service = WhatsAppService()

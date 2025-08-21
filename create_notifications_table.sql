-- =====================================================================
-- Create notifications table for TMS system
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
    'new_shipment_request',
    'load_update',
    'invoice_created', 
    'payment_received',
    'new_bid',
    'bid_accepted',
    'bid_rejected',
    'delivery_completed',
    'driver_message',
    'driver_contact_dispatch'
  )),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB,                    -- Additional data payload (can be null)
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Add comment
COMMENT ON TABLE notifications IS 'System notifications for users including dispatchers, drivers, carriers, and customers';

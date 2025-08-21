import { supabase } from '@/lib/supabase';
import { LoadWithDetails } from '@/types/loads';

export interface NotificationData {
  id?: number;
  user_id: string;
  type: 'new_shipment_request' | 'load_update' | 'invoice_created' | 'payment_received' | 'new_bid' | 'bid_accepted' | 'bid_rejected' | 'delivery_completed' | 'driver_message' | 'driver_contact_dispatch';
  title: string;
  message: string;
  data?: any; // Additional data payload
  read: boolean;
  created_at?: string;
}

export class NotificationService {
  // Create a new notification
  static async createNotification(notification: Omit<NotificationData, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating notification:', error.message || error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Notify all dispatchers of a new shipment request
  static async notifyDispatchersOfNewShipmentRequest(load: LoadWithDetails): Promise<void> {
    try {
      // Get all dispatcher users using service function to bypass RLS
      const { data: dispatchers, error } = await supabase
        .rpc('get_dispatchers_for_notifications');

      if (error) {
        console.error('Error fetching dispatchers for notification:', error);
        return;
      }

      if (!dispatchers || dispatchers.length === 0) {
        console.log('No dispatchers found to notify');
        return;
      }

      // Create notifications for each dispatcher
      const notifications = dispatchers.map(dispatcher => ({
        user_id: dispatcher.id,
        type: 'new_shipment_request' as const,
        title: 'New Shipment Request',
        message: `Customer ${load.customer?.name || 'Unknown'} has requested a new shipment (Load #${load.id}) from ${this.getLocationDisplay(load.origin_location)} to ${this.getLocationDisplay(load.destination_location)}.`,
        data: {
          load_id: load.id,
          customer_id: load.customer_id,
          customer_name: load.customer?.name,
          commodity: load.commodity,
          pickup_date: load.pickup_date,
          delivery_date: load.delivery_date
        },
        read: false
      }));

      // Send notifications to all dispatchers
      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      console.log(`✅ New shipment request notification sent to ${dispatchers.length} dispatchers for Load #${load.id}`);
      
      // Here you could add additional notification methods:
      // - Email notifications
      // - SMS alerts
      // - Slack/Teams integration
      // - Push notifications
      // - Real-time websocket updates
      
      // Example of what you might implement:
      // await this.sendEmailNotifications(dispatchers, load);
      // await this.sendSlackNotification(load);
      
    } catch (error) {
      console.error('Error sending dispatcher notifications:', error);
    }
  }

  // Notify customer of load status updates
  static async notifyCustomerOfLoadUpdate(load: LoadWithDetails, previousStatus: string): Promise<void> {
    try {
      // Get customer user
      const { data: customer, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('customer_id', load.customer_id)
        .eq('role', 'Customer')
        .single();

      if (error || !customer) {
        console.log('No customer user found for notification');
        return;
      }

      const notification = {
        user_id: customer.id,
        type: 'load_update' as const,
        title: 'Shipment Status Update',
        message: `Your shipment (Load #${load.id}) status has been updated from "${previousStatus}" to "${load.status}".`,
        data: {
          load_id: load.id,
          previous_status: previousStatus,
          new_status: load.status,
          carrier_name: load.carrier?.name,
          driver_name: load.driver?.name
        },
        read: false
      };

      await this.createNotification(notification);
      console.log(`✅ Load status update notification sent to customer for Load #${load.id}`);
      
    } catch (error) {
      console.error('Error sending customer notification:', error);
    }
  }

  // Get notifications for a specific user
  static async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Helper method to format location display
  private static getLocationDisplay(location: any): string {
    if (!location) return 'Unknown Location';
    const parts = [location.location_name, location.city, location.state].filter(Boolean);
    return parts.join(', ') || 'Unknown Location';
  }

  // Future implementation examples:
  
  // Send email notifications (would require email service integration)
  /*
  private static async sendEmailNotifications(dispatchers: any[], load: LoadWithDetails): Promise<void> {
    // Implementation would depend on your email service (SendGrid, AWS SES, etc.)
    for (const dispatcher of dispatchers) {
      if (dispatcher.email) {
        // await emailService.send({
        //   to: dispatcher.email,
        //   subject: `New Shipment Request - Load #${load.id}`,
        //   template: 'new-shipment-request',
        //   data: { dispatcher, load }
        // });
      }
    }
  }
  */

  // Send Slack notifications (would require Slack integration)
  /*
  private static async sendSlackNotification(load: LoadWithDetails): Promise<void> {
    // Implementation would depend on Slack webhook or API
    // await slackService.sendMessage({
    //   channel: '#dispatch',
    //   text: `🚛 New shipment request from ${load.customer?.name} - Load #${load.id}`,
    //   attachments: [...]
    // });
  }
  */

  // Bid-related notifications

  // Notify dispatchers when a new bid is placed
  static async notifyDispatchersOfNewBid(bidData: {
    bid_id: number;
    load_id: number;
    carrier_name: string;
    offered_rate: number;
    load_commodity?: string;
    load_origin?: string;
    load_destination?: string;
  }): Promise<void> {
    try {
      // Get all dispatcher users using service function to bypass RLS
      const { data: dispatchers, error } = await supabase
        .rpc('get_dispatchers_for_notifications');

      if (error) {
        console.error('Error fetching dispatchers for bid notification:', error);
        return;
      }

      if (!dispatchers || dispatchers.length === 0) {
        console.log('No dispatchers found to notify of new bid');
        return;
      }

      // Create notifications for each dispatcher
      const notifications = dispatchers.map(dispatcher => ({
        user_id: dispatcher.id,
        type: 'new_bid' as const,
        title: 'New Bid Received',
        message: `${bidData.carrier_name} placed a bid of $${bidData.offered_rate.toLocaleString()} on ${bidData.load_commodity || 'load'} from ${bidData.load_origin || 'origin'} to ${bidData.load_destination || 'destination'}`,
        data: {
          bid_id: bidData.bid_id,
          load_id: bidData.load_id,
          carrier_name: bidData.carrier_name,
          offered_rate: bidData.offered_rate
        },
        read: false
      }));

      // Bulk insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating bid notifications:', insertError);
        throw insertError;
      }

      console.log(`Created bid notifications for ${dispatchers.length} dispatchers`);
    } catch (error) {
      console.error('Error in notifyDispatchersOfNewBid:', error);
    }
  }

  // Notify carrier when their bid is accepted
  static async notifyCarrierOfBidAcceptance(carrierUserId: string, bidData: {
    bid_id: number;
    load_id: number;
    offered_rate: number;
    load_commodity?: string;
    load_origin?: string;
    load_destination?: string;
  }): Promise<void> {
    try {
      await this.createNotification({
        user_id: carrierUserId,
        type: 'bid_accepted',
        title: 'Bid Accepted!',
        message: `Congratulations! Your bid of $${bidData.offered_rate.toLocaleString()} for ${bidData.load_commodity || 'load'} from ${bidData.load_origin || 'origin'} to ${bidData.load_destination || 'destination'} has been accepted.`,
        data: {
          bid_id: bidData.bid_id,
          load_id: bidData.load_id,
          offered_rate: bidData.offered_rate
        },
        read: false
      });

      console.log(`Notified carrier of bid acceptance for load ${bidData.load_id}`);
    } catch (error) {
      console.error('Error notifying carrier of bid acceptance:', error);
    }
  }

  // Notify carrier when their bid is rejected (optional - might be too much)
  static async notifyCarrierOfBidRejection(carrierUserId: string, bidData: {
    bid_id: number;
    load_id: number;
    offered_rate: number;
    load_commodity?: string;
    load_origin?: string;
    load_destination?: string;
  }): Promise<void> {
    try {
      await this.createNotification({
        user_id: carrierUserId,
        type: 'bid_rejected',
        title: 'Bid Not Selected',
        message: `Your bid of $${bidData.offered_rate.toLocaleString()} for ${bidData.load_commodity || 'load'} from ${bidData.load_origin || 'origin'} to ${bidData.load_destination || 'destination'} was not selected.`,
        data: {
          bid_id: bidData.bid_id,
          load_id: bidData.load_id,
          offered_rate: bidData.offered_rate
        },
        read: false
      });

      console.log(`Notified carrier of bid rejection for load ${bidData.load_id}`);
    } catch (error) {
      console.error('Error notifying carrier of bid rejection:', error);
    }
  }

  // Notify dispatchers when a driver marks delivery as completed
  static async notifyDispatchersOfDeliveryCompleted(loadData: {
    load_id: number;
    driver_name: string;
    customer_name?: string;
    commodity?: string;
    origin?: string;
    destination?: string;
    delivery_time?: string;
  }): Promise<void> {
    try {
      // Get all dispatcher users using service function to bypass RLS
      const { data: dispatchers, error } = await supabase
        .rpc('get_dispatchers_for_notifications');

      if (error) {
        console.error('Error fetching dispatchers for delivery notification:', error);
        return;
      }

      if (!dispatchers || dispatchers.length === 0) {
        console.log('No dispatchers found to notify of delivery completion');
        return;
      }

      // Create notifications for each dispatcher
      const notifications = dispatchers.map(dispatcher => ({
        user_id: dispatcher.id,
        type: 'delivery_completed' as const,
        title: 'Delivery Completed',
        message: `${loadData.driver_name} has completed delivery for Load #${loadData.load_id}${loadData.customer_name ? ` (${loadData.customer_name})` : ''}${loadData.commodity ? ` - ${loadData.commodity}` : ''}${loadData.destination ? ` to ${loadData.destination}` : ''}.`,
        data: {
          load_id: loadData.load_id,
          driver_name: loadData.driver_name,
          customer_name: loadData.customer_name,
          commodity: loadData.commodity,
          delivery_time: loadData.delivery_time || new Date().toISOString()
        },
        read: false
      }));

      // Bulk insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating delivery completion notifications:', insertError);
        throw insertError;
      }

      console.log(`✅ Delivery completion notification sent to ${dispatchers.length} dispatchers for Load #${loadData.load_id}`);
    } catch (error) {
      console.error('Error in notifyDispatchersOfDeliveryCompleted:', error);
    }
  }

  // Notify dispatchers when a driver sends a message
  static async notifyDispatchersOfDriverMessage(messageData: {
    load_id: number;
    driver_name: string;
    message: string;
    customer_name?: string;
    commodity?: string;
  }): Promise<void> {
    try {
      // Get all dispatcher users using service function to bypass RLS
      const { data: dispatchers, error } = await supabase
        .rpc('get_dispatchers_for_notifications');

      if (error) {
        console.error('Error fetching dispatchers for message notification:', error);
        return;
      }

      if (!dispatchers || dispatchers.length === 0) {
        console.log('No dispatchers found to notify of driver message');
        return;
      }

      // Create notifications for each dispatcher
      const notifications = dispatchers.map(dispatcher => ({
        user_id: dispatcher.id,
        type: 'driver_message' as const,
        title: 'New Driver Message',
        message: `${messageData.driver_name} sent a message on Load #${messageData.load_id}${messageData.customer_name ? ` (${messageData.customer_name})` : ''}: "${messageData.message.length > 100 ? messageData.message.substring(0, 100) + '...' : messageData.message}"`,
        data: {
          load_id: messageData.load_id,
          driver_name: messageData.driver_name,
          driver_message: messageData.message,
          customer_name: messageData.customer_name,
          commodity: messageData.commodity
        },
        read: false
      }));

      // Bulk insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating driver message notifications:', insertError);
        throw insertError;
      }

      console.log(`✅ Driver message notification sent to ${dispatchers.length} dispatchers for Load #${messageData.load_id}`);
    } catch (error) {
      console.error('Error in notifyDispatchersOfDriverMessage:', error);
    }
  }

  // Notify dispatchers when a driver contacts them directly (not about a specific load)
  static async notifyDispatchersOfDriverContact(contactData: {
    driver_name: string;
    message: string;
    urgency: 'low' | 'medium' | 'high';
    driver_id?: number;
  }): Promise<void> {
    try {
      // Try service function first, fallback to direct query with admin privileges
      let dispatchers: any[] = [];
      let error: any = null;

      // Method 1: Try service function
      const { data: functionResult, error: functionError } = await supabase
        .rpc('get_dispatchers_for_notifications');

      if (functionError) {
        console.warn('Service function failed:', functionError);
        
        // Method 2: Fallback - direct query with service role
        try {
          const { data: directResult, error: directError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'Dispatcher');
          
          if (directError) {
            console.error('Direct query also failed:', directError);
            error = directError;
          } else {
            dispatchers = directResult || [];
            console.log('📧 Using direct query fallback for dispatchers');
          }
        } catch (directQueryError) {
          console.error('Fallback query failed:', directQueryError);
          error = directQueryError;
        }
      } else {
        dispatchers = functionResult || [];
        console.log('📧 Using service function for dispatchers');
      }

      if (error && (!dispatchers || dispatchers.length === 0)) {
        console.error('Error fetching dispatchers for dispatch contact notification:', error);
        return;
      }

      if (!dispatchers || dispatchers.length === 0) {
        console.error('❌ No dispatchers found to notify of driver contact');
        console.error('🔧 To fix this issue:');
        console.error('1. Run the complete_dispatcher_diagnostic.sql script in Supabase');
        console.error('2. Or manually create a user with role="Dispatcher"');
        console.error('3. Make sure RLS policies allow notifications to work');
        return;
      }

      console.log(`📧 Found ${dispatchers.length} dispatcher(s) to notify:`, dispatchers.map(d => d.name || d.email));

      // DEBUG: Show which method worked
      if (functionResult && functionResult.length > 0) {
        console.log('✅ Service function worked - RLS bypassed successfully');
      } else if (dispatchers.length > 0) {
        console.log('✅ Direct query fallback worked - RLS policies allow dispatcher visibility');
      }

      // Define urgency display text and priority
      const urgencyConfig = {
        low: { label: 'General Inquiry', emoji: '[Info]' },
        medium: { label: 'Need Assignment', emoji: '[Request]' },
        high: { label: 'Urgent Issue', emoji: '[URGENT]' }
      };

      const urgencyInfo = urgencyConfig[contactData.urgency];
      
      // Create notifications for each dispatcher
      const notifications = dispatchers.map(dispatcher => ({
        user_id: dispatcher.id,
        type: 'driver_contact_dispatch' as const,
        title: `Driver Contact: ${urgencyInfo.label}`,
        message: `${urgencyInfo.emoji} ${contactData.driver_name} contacted dispatch (${urgencyInfo.label}): "${contactData.message.length > 100 ? contactData.message.substring(0, 100) + '...' : contactData.message}"`,
        data: {
          driver_id: contactData.driver_id,
          driver_name: contactData.driver_name,
          driver_message: contactData.message,
          urgency: contactData.urgency,
          urgency_label: urgencyInfo.label,
          contact_time: new Date().toISOString()
        },
        read: false
      }));

      // Debug: Log the notification data being inserted
      console.log('Attempting to insert notifications:', JSON.stringify(notifications, null, 2));
      
      // Bulk insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating driver contact notifications:', insertError);
        console.error('Failed notification data:', JSON.stringify(notifications, null, 2));
        throw insertError;
      }

      console.log(`🎉 SUCCESS! Driver contact notification sent to ${dispatchers.length} dispatchers from ${contactData.driver_name} (${contactData.urgency} priority)`);
      console.log(`📧 Notified dispatchers:`, dispatchers.map(d => `${d.name} (${d.email})`).join(', '));
    } catch (error) {
      console.error('Error in notifyDispatchersOfDriverContact:', error);
      // Don't re-throw the error so the contact dispatch functionality still works
      // even if notifications fail
    }
  }
}

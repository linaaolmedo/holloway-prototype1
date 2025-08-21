import { supabase } from '@/lib/supabase';
import { 
  DriverAssignment, 
  LoadMessage, 
  DriverProfile, 
  SendMessageData, 
  StatusUpdateData,
  DriverDashboardData 
} from '@/types/driver';
import { NotificationService } from './notificationService';

export class DriverService {
  // Get driver profile by user ID
  static async getDriverProfile(userId: string): Promise<DriverProfile | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No driver profile found
      }
      throw new Error(`Failed to fetch driver profile: ${error.message}`);
    }

    return data;
  }

  // Get current assignment for a driver
  static async getCurrentAssignment(driverId: number): Promise<DriverAssignment | null> {
    const { data, error } = await supabase
      .from('loads')
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .eq('driver_id', driverId)
      .in('status', ['Pending Pickup', 'In Transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No current assignment
      }
      throw new Error(`Failed to fetch current assignment: ${error.message}`);
    }

    return data;
  }

  // Get load messages for a specific load
  static async getLoadMessages(loadId: number): Promise<LoadMessage[]> {
    const { data, error } = await supabase
      .from('load_messages')
      .select(`
        *,
        user:users(name, role)
      `)
      .eq('load_id', loadId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch load messages: ${error.message}`);
    }

    // Transform the data to include user details
    return (data || []).map(msg => ({
      id: msg.id,
      load_id: msg.load_id,
      user_id: msg.user_id,
      message: msg.message,
      timestamp: msg.timestamp,
      user_name: msg.user?.name || 'Unknown User',
      user_role: msg.user?.role || 'Unknown'
    }));
  }

  // Send a message about a load
  static async sendMessage(messageData: SendMessageData, userId: string): Promise<LoadMessage> {
    // First, let's gather debugging info if we encounter an RLS error
    let debugInfo: any = {};
    
    try {
      // Get current user info for debugging
      const { data: userInfo } = await supabase
        .from('users')
        .select('id, role, name')
        .eq('id', userId)
        .single();
      
      debugInfo.user = userInfo;

      // Get driver info for debugging
      const { data: driverInfo } = await supabase
        .from('drivers')
        .select('id, name, user_id')
        .eq('user_id', userId)
        .single();
      
      debugInfo.driver = driverInfo;

      // Get load info for debugging
      const { data: loadInfo } = await supabase
        .from('loads')
        .select('id, status, driver_id')
        .eq('id', messageData.load_id)
        .single();
      
      debugInfo.load = loadInfo;

    } catch (debugError) {
      console.warn('Could not gather debug info:', debugError);
    }

    // Attempt to send the message
    const { data, error } = await supabase
      .from('load_messages')
      .insert([{
        load_id: messageData.load_id,
        user_id: userId,
        message: messageData.message,
        timestamp: new Date().toISOString()
      }])
      .select(`
        *,
        user:users(name, role)
      `)
      .single();

    if (error) {
      // Enhanced error handling with debugging info
      console.error('Driver message send failed:', {
        error: error,
        messageData,
        userId,
        debugInfo
      });

      // Check for RLS policy violation specifically
      if (error.message.includes('row-level security policy') || 
          error.message.includes('violates row-level security') ||
          error.code === '42501') {
        
        let enhancedErrorMessage = `RLS Policy Violation - Cannot send message. `;
        
        if (debugInfo.user?.role !== 'Driver') {
          enhancedErrorMessage += `User role is '${debugInfo.user?.role}', expected 'Driver'. `;
        }
        
        if (!debugInfo.driver) {
          enhancedErrorMessage += `No driver record found for user. `;
        }
        
        if (debugInfo.load && debugInfo.driver && debugInfo.load.driver_id !== debugInfo.driver.id) {
          enhancedErrorMessage += `Load is assigned to driver ID ${debugInfo.load.driver_id}, but user is driver ID ${debugInfo.driver.id}. `;
        }
        
        if (!debugInfo.load) {
          enhancedErrorMessage += `Load not found. `;
        }

        enhancedErrorMessage += `Please contact support with this information: User ID ${userId}, Load ID ${messageData.load_id}.`;
        
        throw new Error(enhancedErrorMessage);
      }
      
      // For other errors, provide the original error message
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Transform the data to include user details
    const messageResult = {
      id: data.id,
      load_id: data.load_id,
      user_id: data.user_id,
      message: data.message,
      timestamp: data.timestamp,
      user_name: data.user?.name || 'Unknown User',
      user_role: data.user?.role || 'Unknown'
    };

    // Notify dispatchers of the new driver message (non-blocking)
    if (data.user?.role === 'Driver') {
      this.notifyDispatchersOfDriverMessage(data.load_id, data.user?.name, data.message)
        .catch(error => {
          console.error('Failed to send dispatcher notifications for driver message:', error);
        });
    }

    return messageResult;
  }

  // Update load status (In Transit or Delivered)
  static async updateLoadStatus(statusData: StatusUpdateData, userId: string): Promise<DriverAssignment> {
    const { data, error } = await supabase
      .from('loads')
      .update({ 
        status: statusData.status,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', statusData.load_id)
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update load status: ${error.message}`);
    }

    // Send automatic status update message
    try {
      await this.sendMessage({
        load_id: statusData.load_id,
        message: `Load status updated to: ${statusData.status}`
      }, userId);
    } catch (msgError) {
      console.warn('Failed to send status update message:', msgError);
    }

    // Notify dispatchers if delivery is completed (non-blocking)
    if (statusData.status === 'Delivered') {
      this.notifyDispatchersOfDeliveryCompleted(data)
        .catch(error => {
          console.error('Failed to send dispatcher notifications for delivery completion:', error);
        });
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  // Get all data needed for driver dashboard in one call
  static async getDriverDashboardData(userId: string): Promise<DriverDashboardData> {
    // First get the driver profile
    const driverProfile = await this.getDriverProfile(userId);
    
    if (!driverProfile) {
      return {
        currentAssignment: null,
        messages: [],
        driverProfile: null
      };
    }

    // Get current assignment
    const currentAssignment = await this.getCurrentAssignment(driverProfile.id);
    
    // Get messages for current assignment if it exists
    let messages: LoadMessage[] = [];
    if (currentAssignment) {
      messages = await this.getLoadMessages(currentAssignment.id);
    }

    return {
      currentAssignment,
      messages,
      driverProfile
    };
  }

  // Check if driver has permission to access a load
  static async canAccessLoad(userId: string, loadId: number): Promise<boolean> {
    const driverProfile = await this.getDriverProfile(userId);
    if (!driverProfile) return false;

    const { data, error } = await supabase
      .from('loads')
      .select('id')
      .eq('id', loadId)
      .eq('driver_id', driverProfile.id)
      .single();

    return !error && !!data;
  }

  // Helper method to notify dispatchers of delivery completion
  private static async notifyDispatchersOfDeliveryCompleted(loadData: DriverAssignment): Promise<void> {
    try {
      const destinationLocation = loadData.destination_location 
        ? `${loadData.destination_location.city}, ${loadData.destination_location.state}`
        : undefined;

      await NotificationService.notifyDispatchersOfDeliveryCompleted({
        load_id: loadData.id,
        driver_name: loadData.driver?.name || 'Unknown Driver',
        customer_name: loadData.customer?.name,
        commodity: loadData.commodity,
        destination: destinationLocation,
        delivery_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in notifyDispatchersOfDeliveryCompleted:', error);
      throw error;
    }
  }

  // Helper method to notify dispatchers of driver message
  private static async notifyDispatchersOfDriverMessage(loadId: number, driverName: string, message: string): Promise<void> {
    try {
      // Get load details for context
      const { data: loadData, error } = await supabase
        .from('loads')
        .select(`
          id,
          commodity,
          customer:customers(name)
        `)
        .eq('id', loadId)
        .single();

      if (error) {
        console.error('Error fetching load data for message notification:', error);
        // Still send notification but with limited context
        await NotificationService.notifyDispatchersOfDriverMessage({
          load_id: loadId,
          driver_name: driverName,
          message: message
        });
        return;
      }

      await NotificationService.notifyDispatchersOfDriverMessage({
        load_id: loadId,
        driver_name: driverName,
        message: message,
        customer_name: loadData.customer?.name,
        commodity: loadData.commodity
      });
    } catch (error) {
      console.error('Error in notifyDispatchersOfDriverMessage:', error);
      throw error;
    }
  }

  // Send a general message to dispatch (not related to a specific load)
  static async contactDispatch(userId: string, message: string, urgency: 'low' | 'medium' | 'high'): Promise<void> {
    try {
      // Get driver profile to get driver name and ID
      const driverProfile = await this.getDriverProfile(userId);
      
      if (!driverProfile) {
        throw new Error('Driver profile not found');
      }

      // Try to notify all dispatchers of the contact request
      try {
        await NotificationService.notifyDispatchersOfDriverContact({
          driver_name: driverProfile.name,
          message: message,
          urgency: urgency,
          driver_id: driverProfile.id
        });
        console.log(`✅ Driver ${driverProfile.name} successfully contacted dispatch with ${urgency} priority message (notifications sent)`);
      } catch (notificationError) {
        console.error('Failed to send notifications, but contact dispatch completed:', notificationError);
        console.log(`✅ Driver ${driverProfile.name} successfully contacted dispatch with ${urgency} priority message (notifications failed but contact logged)`);
      }

    } catch (error) {
      console.error('Error in contactDispatch:', error);
      throw error;
    }
  }
}

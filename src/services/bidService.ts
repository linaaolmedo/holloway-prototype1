import { supabase } from '@/lib/supabase';
import { 
  Bid, 
  BidWithDetails, 
  CreateBidData, 
  UpdateBidData, 
  BidFilters, 
  AvailableLoad,
  BidStats,
  BidNotification
} from '@/types/bids';
import { NotificationService } from './notificationService';

export class BidService {
  // Get all bids with details
  static async getAllBids(): Promise<BidWithDetails[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        loads (
          id,
          commodity,
          weight,
          pickup_date,
          delivery_date,
          rate_customer,
          status,
          customers (
            id,
            name
          ),
          origin_location:customer_locations!origin_location_id (
            id,
            location_name,
            city,
            state
          ),
          destination_location:customer_locations!destination_location_id (
            id,
            location_name,
            city,
            state
          ),
          equipment_types (
            id,
            name
          )
        ),
        carriers (
          id,
          name,
          mc_number,
          primary_contact_name,
          primary_contact_phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids:', error);
      throw new Error('Failed to fetch bids');
    }

    return data || [];
  }

  // Get bids for a specific load
  static async getBidsForLoad(loadId: number): Promise<BidWithDetails[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        carriers (
          id,
          name,
          mc_number,
          primary_contact_name,
          primary_contact_phone
        )
      `)
      .eq('load_id', loadId)
      .order('offered_rate', { ascending: true }); // Lowest bids first

    if (error) {
      console.error('Error fetching bids for load:', error);
      throw new Error('Failed to fetch bids for load');
    }

    return data || [];
  }

  // Get bids for a specific carrier
  static async getBidsForCarrier(carrierId: number): Promise<BidWithDetails[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        loads (
          id,
          commodity,
          weight,
          pickup_date,
          delivery_date,
          rate_customer,
          status,
          customers (
            id,
            name
          ),
          origin_location:customer_locations!origin_location_id (
            id,
            location_name,
            city,
            state
          ),
          destination_location:customer_locations!destination_location_id (
            id,
            location_name,
            city,
            state
          ),
          equipment_types (
            id,
            name
          )
        )
      `)
      .eq('carrier_id', carrierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids for carrier:', error);
      throw new Error('Failed to fetch bids for carrier');
    }

    return data || [];
  }

  // Get available loads for carrier load board
  static async getAvailableLoads(carrierId?: number): Promise<AvailableLoad[]> {
    let query = supabase
      .from('loads')
      .select(`
        *,
        customers (
          id,
          name
        ),
        origin_location:customer_locations!origin_location_id (
          id,
          location_name,
          address_line1,
          city,
          state,
          postal_code
        ),
        destination_location:customer_locations!destination_location_id (
          id,
          location_name,
          address_line1,
          city,
          state,
          postal_code
        ),
        equipment_types (
          id,
          name
        )
      `)
      .is('carrier_id', null) // Only unassigned loads
      .in('status', ['Pending Pickup']) // Only loads pending pickup
      .order('pickup_date', { ascending: true });

    const { data: loads, error } = await query;

    if (error) {
      console.error('Error fetching available loads:', error);
      throw new Error('Failed to fetch available loads');
    }

    if (!loads || !carrierId) {
      return loads?.map(load => ({ ...load, has_bid: false, bid_count: 0 })) || [];
    }

    // Get bid information for each load
    const loadIds = loads.map(load => load.id);
    
    // Get all bids for these loads
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('load_id, carrier_id, offered_rate')
      .in('load_id', loadIds);

    if (bidsError) {
      console.error('Error fetching bids:', bidsError);
      return loads.map(load => ({ ...load, has_bid: false, bid_count: 0 }));
    }

    // Process bid information
    const bidsByLoad = (bids || []).reduce((acc, bid) => {
      if (!acc[bid.load_id]) {
        acc[bid.load_id] = [];
      }
      acc[bid.load_id].push(bid);
      return acc;
    }, {} as Record<number, any[]>);

    return loads.map(load => {
      const loadBids = bidsByLoad[load.id] || [];
      const carrierBid = loadBids.find(bid => bid.carrier_id === carrierId);
      const rates = loadBids.map(bid => bid.offered_rate).filter(rate => rate !== null);
      
      return {
        ...load,
        has_bid: !!carrierBid,
        current_bid: carrierBid || undefined,
        bid_count: loadBids.length,
        lowest_bid: rates.length > 0 ? Math.min(...rates) : undefined
      };
    });
  }

  // Create a new bid
  static async createBid(bidData: CreateBidData): Promise<Bid> {
    // Check if carrier already has a bid for this load
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('load_id', bidData.load_id)
      .eq('carrier_id', bidData.carrier_id)
      .single();

    if (existingBid) {
      throw new Error('You have already placed a bid on this load');
    }

    const { data: bid, error } = await supabase
      .from('bids')
      .insert(bidData)
      .select()
      .single();

    if (error) {
      console.error('Error creating bid:', error);
      throw new Error('Failed to place bid');
    }

    // Get load and carrier details for notification
    try {
      const [loadResult, carrierResult] = await Promise.all([
        supabase
          .from('loads')
          .select(`
            id,
            commodity,
            origin_location:customer_locations!origin_location_id(city, state),
            destination_location:customer_locations!destination_location_id(city, state)
          `)
          .eq('id', bidData.load_id)
          .single(),
        supabase
          .from('carriers')
          .select('name')
          .eq('id', bidData.carrier_id)
          .single()
      ]);

      if (loadResult.data && carrierResult.data) {
        // Send notification to dispatchers
        await NotificationService.notifyDispatchersOfNewBid({
          bid_id: bid.id,
          load_id: bidData.load_id,
          carrier_name: carrierResult.data.name,
          offered_rate: bidData.offered_rate,
          load_commodity: loadResult.data.commodity,
          load_origin: loadResult.data.origin_location ? 
            `${loadResult.data.origin_location.city}, ${loadResult.data.origin_location.state}` : 
            undefined,
          load_destination: loadResult.data.destination_location ? 
            `${loadResult.data.destination_location.city}, ${loadResult.data.destination_location.state}` : 
            undefined
        });
      }
    } catch (notificationError) {
      console.error('Error sending bid notification:', notificationError);
      // Don't fail the bid creation if notification fails
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
      // Trigger bid notification for dispatchers
      window.dispatchEvent(new CustomEvent('new-bid', { detail: bid }));
    }

    return bid;
  }

  // Update an existing bid
  static async updateBid(bidId: number, bidData: UpdateBidData): Promise<Bid> {
    const { data: bid, error } = await supabase
      .from('bids')
      .update(bidData)
      .eq('id', bidId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bid:', error);
      throw new Error('Failed to update bid');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return bid;
  }

  // Accept a bid (dispatcher action)
  static async acceptBid(bidId: number): Promise<void> {
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('load_id, carrier_id')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      throw new Error('Bid not found');
    }

    // Start a transaction-like operation
    // 1. Accept the bid
    const { error: acceptError } = await supabase
      .from('bids')
      .update({ accepted: true })
      .eq('id', bidId);

    if (acceptError) {
      console.error('Error accepting bid:', acceptError);
      throw new Error('Failed to accept bid');
    }

    // 2. Assign carrier to load
    const { error: assignError } = await supabase
      .from('loads')
      .update({ carrier_id: bid.carrier_id })
      .eq('id', bid.load_id);

    if (assignError) {
      console.error('Error assigning carrier to load:', assignError);
      throw new Error('Failed to assign carrier to load');
    }

    // 3. Reject other bids on the same load
    const { error: rejectError } = await supabase
      .from('bids')
      .delete()
      .eq('load_id', bid.load_id)
      .neq('id', bidId);

    if (rejectError) {
      console.error('Error rejecting other bids:', rejectError);
      // This is not critical - we can continue
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  // Delete a bid
  static async deleteBid(bidId: number): Promise<void> {
    const { error } = await supabase
      .from('bids')
      .delete()
      .eq('id', bidId);

    if (error) {
      console.error('Error deleting bid:', error);
      throw new Error('Failed to delete bid');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  // Get bid statistics
  static async getBidStats(carrierId?: number): Promise<BidStats> {
    let query = supabase.from('bids').select('*');
    
    if (carrierId) {
      query = query.eq('carrier_id', carrierId);
    }

    const { data: bids, error } = await query;

    if (error) {
      console.error('Error fetching bid stats:', error);
      throw new Error('Failed to fetch bid statistics');
    }

    const today = new Date().toISOString().split('T')[0];
    const todayBids = bids?.filter(bid => 
      bid.created_at.split('T')[0] === today
    ) || [];

    const acceptedBids = bids?.filter(bid => bid.accepted) || [];
    const pendingBids = bids?.filter(bid => !bid.accepted) || [];
    
    const rates = bids?.map(bid => bid.offered_rate).filter(rate => rate !== null) || [];
    const averageRate = rates.length > 0 
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length 
      : 0;

    return {
      total_bids: bids?.length || 0,
      pending_bids: pendingBids.length,
      accepted_bids: acceptedBids.length,
      average_bid_rate: averageRate,
      today_bids: todayBids.length
    };
  }

  // Search bids with filters
  static async searchBids(filters: BidFilters): Promise<BidWithDetails[]> {
    let query = supabase
      .from('bids')
      .select(`
        *,
        loads (
          id,
          commodity,
          weight,
          pickup_date,
          delivery_date,
          rate_customer,
          status,
          customers (
            id,
            name
          ),
          origin_location:customer_locations!origin_location_id (
            id,
            location_name,
            city,
            state
          ),
          destination_location:customer_locations!destination_location_id (
            id,
            location_name,
            city,
            state
          ),
          equipment_types (
            id,
            name
          )
        ),
        carriers (
          id,
          name,
          mc_number,
          primary_contact_name,
          primary_contact_phone
        )
      `);

    if (filters.load_id) {
      query = query.eq('load_id', filters.load_id);
    }

    if (filters.carrier_id) {
      query = query.eq('carrier_id', filters.carrier_id);
    }

    if (filters.accepted !== undefined) {
      query = query.eq('accepted', filters.accepted);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error searching bids:', error);
      throw new Error('Failed to search bids');
    }

    return data || [];
  }
}

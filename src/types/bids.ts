import { Load, LoadWithDetails, Carrier } from './loads';

export interface Bid {
  id: number;
  load_id: number;
  carrier_id: number;
  offered_rate: number | null;
  accepted: boolean;
  created_at: string;
  created_by: string | null;
}

export interface BidWithDetails extends Bid {
  load?: LoadWithDetails;
  carrier?: Carrier;
}

export interface CreateBidData {
  load_id: number;
  carrier_id: number;
  offered_rate: number;
}

export interface UpdateBidData {
  offered_rate?: number;
  accepted?: boolean;
}

export interface BidFilters {
  load_id?: number;
  carrier_id?: number;
  accepted?: boolean;
  date_from?: string;
  date_to?: string;
}

// For carrier load board - loads available for bidding
export interface AvailableLoad extends LoadWithDetails {
  has_bid?: boolean; // Whether current carrier has already bid
  current_bid?: Bid; // Current carrier's bid if exists
  bid_count?: number; // Total number of bids on this load
  lowest_bid?: number; // Lowest bid amount (for competitive display)
}

// Notification types for bid alerts
export interface BidNotification {
  id: string;
  bid_id: number;
  load_id: number;
  carrier_name: string;
  offered_rate: number;
  load_origin: string;
  load_destination: string;
  created_at: string;
  read: boolean;
}

export interface BidStats {
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  average_bid_rate: number;
  today_bids: number;
}

// Component props
export interface BidTableProps {
  bids: BidWithDetails[];
  loading?: boolean;
  onAccept?: (bid: BidWithDetails) => void;
  onReject?: (bid: BidWithDetails) => void;
  onView?: (bid: BidWithDetails) => void;
  showActions?: boolean;
}

export interface LoadBoardProps {
  loads: AvailableLoad[];
  loading?: boolean;
  onPlaceBid: (load: AvailableLoad, rate: number) => void;
  onUpdateBid: (bid: Bid, rate: number) => void;
  onViewLoad: (load: AvailableLoad) => void;
}

export interface BidFormProps {
  load: AvailableLoad;
  existingBid?: Bid;
  onSubmit: (rate: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

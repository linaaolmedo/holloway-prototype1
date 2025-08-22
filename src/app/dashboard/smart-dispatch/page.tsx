'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import UnderConstruction from '../components/UnderConstruction';

export default function SmartDispatchPage() {
  return (
    <UnderConstruction 
      pageName="Smart Dispatch"
      description="AI-powered dispatch optimization system for intelligent load assignment, route planning, and resource allocation."
    />
  );
}
